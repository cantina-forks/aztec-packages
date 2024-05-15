import { getSchnorrAccount } from '@aztec/accounts/schnorr';
import {
  type AztecAddress,
  type AztecNode,
  ContractDeployer,
  ContractFunctionInteraction,
  type DebugLogger,
  Fr,
  type PXE,
  type Wallet,
  deriveKeys,
} from '@aztec/aztec.js';
import { times } from '@aztec/foundation/collection';
import { StatefulTestContractArtifact } from '@aztec/noir-contracts.js';
import { TestContract } from '@aztec/noir-contracts.js/Test';
import { TokenContract } from '@aztec/noir-contracts.js/Token';

import 'jest-extended';

import { TaggedNote } from '../../circuit-types/src/logs/l1_note_payload/tagged_note.js';
import { setup } from './fixtures/utils.js';

describe('e2e_block_building', () => {
  let pxe: PXE;
  let logger: DebugLogger;
  let owner: Wallet;
  let minter: Wallet;
  let aztecNode: AztecNode;
  let teardown: () => Promise<void>;

  describe('multi-txs block', () => {
    const artifact = StatefulTestContractArtifact;

    beforeAll(async () => {
      ({
        teardown,
        pxe,
        logger,
        aztecNode,
        wallets: [owner, minter],
      } = await setup(2));
    });

    afterEach(() => aztecNode.setConfig({ minTxsPerBlock: 1 }));
    afterAll(() => teardown());

    it('assembles a block with multiple txs', async () => {
      // Assemble N contract deployment txs
      // We need to create them sequentially since we cannot have parallel calls to a circuit
      const TX_COUNT = 8;
      await aztecNode.setConfig({ minTxsPerBlock: TX_COUNT });
      const deployer = new ContractDeployer(artifact, owner);
      const methods = times(TX_COUNT, i => deployer.deploy(owner.getCompleteAddress().address, i));
      for (let i = 0; i < TX_COUNT; i++) {
        await methods[i].create({
          contractAddressSalt: new Fr(BigInt(i + 1)),
          skipClassRegistration: true,
          skipPublicDeployment: true,
        });
        await methods[i].prove({});
      }

      // Send them simultaneously to be picked up by the sequencer
      const txs = await Promise.all(methods.map(method => method.send()));
      logger.info(`Txs sent with hashes: `);
      for (const tx of txs) {
        logger.info(` ${await tx.getTxHash()}`);
      }

      // Await txs to be mined and assert they are all mined on the same block
      const receipts = await Promise.all(txs.map(tx => tx.wait()));
      expect(receipts.map(r => r.blockNumber)).toEqual(times(TX_COUNT, () => receipts[0].blockNumber));

      // Assert all contracts got deployed
      const isContractDeployed = async (address: AztecAddress) => !!(await pxe.getContractInstance(address));
      const areDeployed = await Promise.all(receipts.map(r => isContractDeployed(r.contract.address)));
      expect(areDeployed).toEqual(times(TX_COUNT, () => true));
    });

    it.skip('can call public function from different tx in same block', async () => {
      // Ensure both txs will land on the same block
      await aztecNode.setConfig({ minTxsPerBlock: 2 });

      // Deploy a contract in the first transaction
      // In the same block, call a public method on the contract
      const deployer = TokenContract.deploy(owner, owner.getCompleteAddress(), 'TokenName', 'TokenSymbol', 18);
      await deployer.create();

      // We can't use `TokenContract.at` to call a function because it checks the contract is deployed
      // but we are in the same block as the deployment transaction
      const callInteraction = new ContractFunctionInteraction(
        owner,
        deployer.getInstance().address,
        TokenContract.artifact.functions.find(x => x.name === 'set_minter')!,
        [minter.getCompleteAddress(), true],
      );

      await deployer.prove({});
      await callInteraction.prove({
        // we have to skip simulation of public calls simulation is done on individual transactions
        // and the tx deploying the contract might go in the same block as this one
        skipPublicSimulation: true,
      });

      const [deployTxReceipt, callTxReceipt] = await Promise.all([
        deployer.send().wait(),
        callInteraction.send({ skipPublicSimulation: true }).wait(),
      ]);

      expect(deployTxReceipt.blockNumber).toEqual(callTxReceipt.blockNumber);
    });
  });

  describe('double-spends', () => {
    let contract: TestContract;
    let teardown: () => Promise<void>;
    // TODO(https://github.com/AztecProtocol/aztec-packages/issues/5818): clean up
    // Under current public, we expect 'dropped', under the AVM, we expect 'reverted'.
    const DUPLICATE_NULLIFIER_ERROR = /dropped|reverted/;

    beforeAll(async () => {
      ({ teardown, pxe, logger, wallet: owner } = await setup(1));
      contract = await TestContract.deploy(owner).send().deployed();
      logger.info(`Test contract deployed at ${contract.address}`);
    });

    afterAll(() => teardown());

    // Regressions for https://github.com/AztecProtocol/aztec-packages/issues/2502
    // Note that the order in which the TX are processed is not guaranteed.
    describe('in the same block, different tx', () => {
      it('private <-> private', async () => {
        const nullifier = Fr.random();
        const txs = await sendAndWait([
          contract.methods.emit_nullifier(nullifier),
          contract.methods.emit_nullifier(nullifier),
        ]);

        // One transaction should succeed, the other should fail, but in any order.
        expect(txs).toIncludeSameMembers([
          { status: 'fulfilled', value: expect.anything() },
          {
            status: 'rejected',
            reason: expect.objectContaining({ message: expect.stringMatching(DUPLICATE_NULLIFIER_ERROR) }),
          },
        ]);
      });

      it('public -> public', async () => {
        const nullifier = Fr.random();
        const txs = await sendAndWait([
          contract.methods.emit_nullifier_public(nullifier),
          contract.methods.emit_nullifier_public(nullifier),
        ]);

        // One transaction should succeed, the other should fail, but in any order.
        expect(txs).toIncludeSameMembers([
          { status: 'fulfilled', value: expect.anything() },
          {
            status: 'rejected',
            reason: expect.objectContaining({ message: expect.stringMatching(DUPLICATE_NULLIFIER_ERROR) }),
          },
        ]);
      });

      it('private -> public', async () => {
        const nullifier = Fr.random();
        const txs = await sendAndWait([
          contract.methods.emit_nullifier(nullifier),
          contract.methods.emit_nullifier_public(nullifier),
        ]);

        // One transaction should succeed, the other should fail, but in any order.
        expect(txs).toIncludeSameMembers([
          { status: 'fulfilled', value: expect.anything() },
          {
            status: 'rejected',
            reason: expect.objectContaining({ message: expect.stringMatching(DUPLICATE_NULLIFIER_ERROR) }),
          },
        ]);
      });

      it('public -> private', async () => {
        const nullifier = Fr.random();
        const txs = await sendAndWait([
          contract.methods.emit_nullifier_public(nullifier),
          contract.methods.emit_nullifier(nullifier),
        ]);

        // One transaction should succeed, the other should fail, but in any order.
        expect(txs).toIncludeSameMembers([
          { status: 'fulfilled', value: expect.anything() },
          {
            status: 'rejected',
            reason: expect.objectContaining({ message: expect.stringMatching(DUPLICATE_NULLIFIER_ERROR) }),
          },
        ]);
      });
    });

    describe('across blocks', () => {
      it('private -> private', async () => {
        const nullifier = Fr.random();
        await contract.methods.emit_nullifier(nullifier).send().wait();
        await expect(contract.methods.emit_nullifier(nullifier).send().wait()).rejects.toThrow('dropped');
      });

      it('public -> public', async () => {
        const nullifier = Fr.random();
        await contract.methods.emit_nullifier_public(nullifier).send().wait();
        await expect(contract.methods.emit_nullifier_public(nullifier).send().wait()).rejects.toThrow(
          DUPLICATE_NULLIFIER_ERROR,
        );
      });

      it('private -> public', async () => {
        const nullifier = Fr.random();
        await contract.methods.emit_nullifier(nullifier).send().wait();
        await expect(contract.methods.emit_nullifier_public(nullifier).send().wait()).rejects.toThrow(
          DUPLICATE_NULLIFIER_ERROR,
        );
      });

      it('public -> private', async () => {
        const nullifier = Fr.random();
        await contract.methods.emit_nullifier_public(nullifier).send().wait();
        await expect(contract.methods.emit_nullifier(nullifier).send().wait()).rejects.toThrow('dropped');
      });
    });
  });

  describe('logs in nested calls are ordered as expected', () => {
    // This test was originally writted for e2e_nested, but it was refactored
    // to not use TestContract.
    let testContract: TestContract;

    beforeEach(async () => {
      ({ teardown, pxe, logger, wallet: owner } = await setup(1));
      logger.info(`Deploying test contract`);
      testContract = await TestContract.deploy(owner).send().deployed();
    }, 60_000);

    it('calls a method with nested unencrypted logs', async () => {
      const tx = await testContract.methods.emit_unencrypted_logs_nested([1, 2, 3, 4, 5]).send().wait();
      const logs = (await pxe.getUnencryptedLogs({ txHash: tx.txHash })).logs.map(l => l.log);

      // First log should be contract address
      expect(logs[0].data).toEqual(testContract.address.toBuffer());

      // Second log should be array of fields
      let expectedBuffer = Buffer.concat([1, 2, 3, 4, 5].map(num => new Fr(num).toBuffer()));
      expect(logs[1].data.subarray(-32 * 5)).toEqual(expectedBuffer);

      // Third log should be string "test"
      expectedBuffer = Buffer.concat(
        ['t', 'e', 's', 't'].map(num => Buffer.concat([Buffer.alloc(31), Buffer.from(num)])),
      );
      expect(logs[2].data.subarray(-32 * 5)).toEqual(expectedBuffer);
    }, 60_000);

    it('calls a method with nested encrypted logs', async () => {
      // account setup
      const privateKey = new Fr(7n);
      const keys = deriveKeys(privateKey);
      const account = getSchnorrAccount(pxe, privateKey, keys.masterIncomingViewingSecretKey);
      await account.deploy().wait();
      const thisWallet = await account.getWallet();

      // call test contract
      const action = testContract.methods.emit_encrypted_logs_nested(10, thisWallet.getAddress());
      const tx = await action.prove();
      const rct = await action.send().wait();

      // compare logs
      expect(rct.status).toEqual('mined');
      const decryptedLogs = tx.encryptedLogs
        .unrollLogs()
        .map(l => TaggedNote.fromEncryptedBuffer(l.data, keys.masterIncomingViewingSecretKey));
      const notevalues = decryptedLogs.map(l => l?.notePayload.note.items[0]);
      expect(notevalues[0]).toEqual(new Fr(10));
      expect(notevalues[1]).toEqual(new Fr(11));
      expect(notevalues[2]).toEqual(new Fr(12));
    }, 30_000);
  });
});

async function sendAndWait(calls: ContractFunctionInteraction[]) {
  return await Promise.allSettled(
    calls
      // First we send them all.
      .map(call => call.send())
      // Onlt then we wait.
      .map(p => p.wait()),
  );
}
