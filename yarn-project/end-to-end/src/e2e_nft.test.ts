import {
  type AccountWallet,
  AztecAddress,
  type AztecNode,
  BatchCall,
  ExtendedNote,
  Fr,
  Note,
  type PXE,
} from '@aztec/aztec.js';
import { deriveStorageSlotInMap } from '@aztec/circuits.js/hash';
import { NFTContract } from '@aztec/noir-contracts.js';

import { jest } from '@jest/globals';

import { setup } from './fixtures/utils.js';

const TIMEOUT = 120_000;

describe('NFT', () => {
  jest.setTimeout(TIMEOUT);

  let aztecNode: AztecNode;
  let pxe: PXE;
  let teardown: () => Promise<void>;

  let nftContractAsAdmin: NFTContract;
  let nftContractAsMinter: NFTContract;
  let nftContractAsUser1: NFTContract;
  let nftContractAsUser2: NFTContract;

  let adminWallet: AccountWallet;
  let minterWallet: AccountWallet;
  let user1Wallet: AccountWallet;
  let user2Wallet: AccountWallet;

  const TOKEN_ID = 6;

  beforeAll(async () => {
    let wallets: AccountWallet[];
    ({ aztecNode, pxe, teardown, wallets } = await setup(4));
    [adminWallet, minterWallet, user1Wallet, user2Wallet] = wallets;

    nftContractAsAdmin = await NFTContract.deploy(adminWallet, adminWallet.getAddress(), 'FROG', 'FRG')
      .send()
      .deployed();
    nftContractAsMinter = await NFTContract.at(nftContractAsAdmin.address, minterWallet);
    nftContractAsUser1 = await NFTContract.at(nftContractAsAdmin.address, user1Wallet);
    nftContractAsUser2 = await NFTContract.at(nftContractAsAdmin.address, user2Wallet);
  });

  afterAll(() => teardown());

  // NOTE: This test is sequential and each test case depends on the previous one
  it('sets minter', async () => {
    await nftContractAsAdmin.methods.set_minter(minterWallet.getAddress(), true).send().wait();
  });

  it('minter mints to a user', async () => {
    await nftContractAsMinter.methods.mint(user1Wallet.getAddress(), TOKEN_ID).send().wait();

    const ownerAfterMint = await nftContractAsUser1.methods.owner_of(TOKEN_ID).simulate();
    expect(ownerAfterMint).toEqual(user1Wallet.getAddress());
  });

  it('user shields', async () => {
    // In a simple shield flow the finalizer is the user itself (in the uniswap swap to shield flow it would be
    // the uniswap contract)
    const finalizer = user1Wallet.getAddress();
    const randomness = Fr.random();

    const { txHash } = await new BatchCall(user1Wallet, [
      nftContractAsUser1.methods.prepare_shield(finalizer, randomness).request(),
      nftContractAsUser1.methods.send_to_shield(finalizer, TOKEN_ID, 0).request(),
    ])
      .send()
      .wait();

    const publicOwnerAfter = await nftContractAsUser1.methods.owner_of(TOKEN_ID).simulate();
    expect(publicOwnerAfter).toEqual(AztecAddress.ZERO);

    // TODO(#8238): Since we don't yet have a partial note delivery we have to manually add it to PXE
    const nftNote = new Note([
      new Fr(TOKEN_ID),
      user1Wallet.getCompleteAddress().publicKeys.masterNullifierPublicKey.hash(),
      randomness,
    ]);

    await user1Wallet.addNote(
      new ExtendedNote(
        nftNote,
        user1Wallet.getAddress(),
        nftContractAsUser1.address,
        deriveStorageSlotInMap(NFTContract.storage.private_nfts.slot, user1Wallet.getAddress()),
        NFTContract.notes.NFTNote.id,
        txHash,
      ),
    );

    // TODO: check "transient storage" was correctly reset
    // const txEffect = await aztecNode.getTxEffect(txHash);
    // console.log('txEffect', txEffect);
  });

  it('user privately sends', async () => {
    await nftContractAsUser1.methods
      .transfer_from(user1Wallet.getAddress(), user2Wallet.getAddress(), TOKEN_ID, 0)
      .send()
      .wait();
  });
});
