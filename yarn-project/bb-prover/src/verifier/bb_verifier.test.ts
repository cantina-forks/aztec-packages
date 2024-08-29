import { type ServerCircuitProver } from '@aztec/circuit-types';
import { type EthAddress, Fr, ParityPublicInputs, type RecursiveProof } from '@aztec/circuits.js';
import { makeBaseParityInputs } from '@aztec/circuits.js/testing';
import { createL1Clients, deployL1Contract } from '@aztec/ethereum';
import { fileURLToPath } from '@aztec/foundation/url';
import { type ProtocolArtifact } from '@aztec/noir-protocol-circuits-types';
import { NoopTelemetryClient } from '@aztec/telemetry-client/noop';

import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
// @ts-expect-error solc-js doesn't publish its types https://github.com/ethereum/solc-js/issues/689
import solc from 'solc';
import { type GetContractReturnType, type PublicClient, getContract } from 'viem';

import { BBNativeRollupProver } from '../prover/bb_prover.js';
import { BBCircuitVerifier } from './bb_verifier.js';

const {
  ACVM_BINARY_PATH,
  BB_BINARY_PATH,
  ETHEREUM_HOST = 'http://127.0.0.1:8545',
  MNEMONIC = 'test test test test test test test test test test test junk',
} = process.env;

describe('bb_verifier', () => {
  let prover: ServerCircuitProver;
  let verifier: BBCircuitVerifier;
  let tmp: string;
  let circuit: ProtocolArtifact;
  let proof: RecursiveProof<any>;
  let proofBuf: Buffer;
  let publicInputs: readonly Fr[];

  beforeAll(async () => {
    const repoRoot = join(fileURLToPath(import.meta.url), '../../../../..');
    const acvmBinaryPath = ACVM_BINARY_PATH ?? join(repoRoot, 'noir/noir-repo/target/release/acvm');
    const bbBinaryPath = BB_BINARY_PATH ?? join(repoRoot, 'barretenberg/cpp/build/bin/bb');
    tmp = await mkdtemp(join(tmpdir(), 'bb-prover-test-'));
    console.log({ tmp });

    prover = await BBNativeRollupProver.new(
      {
        acvmBinaryPath,
        acvmWorkingDirectory: join(tmp, 'acvm'),
        bbBinaryPath,
        bbWorkingDirectory: join(tmp, 'bb-prover'),
      },
      new NoopTelemetryClient(),
    );

    verifier = await BBCircuitVerifier.new({
      bbBinaryPath,
      bbWorkingDirectory: join(tmp, 'bb-verifier'),
    });
  });

  afterAll(async () => {
    // await rm(tmp, { recursive: true });
  });

  beforeAll(async () => {
    circuit = 'BaseParityArtifact';
    const result = await prover.getBaseParityProof(makeBaseParityInputs());
    proof = result.proof;
    publicInputs = ParityPublicInputs.getFields(result.publicInputs);
    publicInputs = result.proof.proof.slice(0, result.verificationKey.numPublicInputs);
    proofBuf = result.proof.proof
      .slice(result.verificationKey.numPublicInputs)
      .reduce((acc, x) => Buffer.concat([acc, x.toBuffer()]), Buffer.alloc(0));
  });

  describe('offchain verification', () => {
    it('verifies proofs locally', async () => {
      await expect(verifier.verifyProofForCircuit(circuit, proof.binaryProof)).resolves.toBeUndefined();
    });
  });

  describe('onchain verification', () => {
    let verifierAddress: EthAddress;
    let verifierContract: GetContractReturnType<any, PublicClient>;

    beforeAll(async () => {
      expect(ETHEREUM_HOST).toBeTruthy();

      const contract = await verifier.generateSolidityContract(circuit, 'UltraHonkVerifier.sol');

      const input = {
        language: 'Solidity',
        sources: {
          'UltraHonkVerifier.sol': {
            content: contract,
          },
        },
        settings: {
          // we require the optimizer
          optimizer: {
            enabled: true,
            runs: 200,
          },
          evmVersion: 'paris',
          outputSelection: {
            '*': {
              '*': ['evm.bytecode.object', 'abi'],
            },
          },
        },
      };

      const output = JSON.parse(solc.compile(JSON.stringify(input)));

      const abi = output.contracts['UltraHonkVerifier.sol']['HonkVerifier'].abi;
      const bytecode: string = output.contracts['UltraHonkVerifier.sol']['HonkVerifier'].evm.bytecode.object;

      const { walletClient, publicClient } = createL1Clients(ETHEREUM_HOST!, MNEMONIC);

      verifierAddress = await deployL1Contract(walletClient, publicClient, abi, `0x${bytecode}`);
      verifierContract = getContract({
        address: verifierAddress.toString(),
        client: publicClient,
        abi,
      });
    });

    it('verifies proof onchain', async () => {
      const p = proof.binaryProof.buffer.subarray(publicInputs.length * Fr.SIZE_IN_BYTES).toString('hex');
      console.log('pub inputs', proof.binaryProof.numPublicInputs);
      await expect(verifierContract.read.verify(['0x' + p, publicInputs.map(x => x.toString())])).resolves.toBeTruthy();
    });
  });
});
