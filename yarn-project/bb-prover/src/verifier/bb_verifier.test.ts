import { type ServerCircuitProver } from '@aztec/circuit-types';
import { type EthAddress, Fr, type RecursiveProof } from '@aztec/circuits.js';
import { makeBaseParityInputs } from '@aztec/circuits.js/testing';
import { createL1Clients, deployL1Contract } from '@aztec/ethereum';
import { BufferReader } from '@aztec/foundation/serialize';
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
  let proofBuffer: Buffer;

  beforeAll(async () => {
    const repoRoot = join(fileURLToPath(import.meta.url), '../../../../..');
    const acvmBinaryPath = ACVM_BINARY_PATH ?? join(repoRoot, 'noir/noir-repo/target/release/acvm');
    const bbBinaryPath = BB_BINARY_PATH ?? join(repoRoot, 'barretenberg/cpp/build/bin/bb');
    tmp = await mkdtemp(join(tmpdir(), 'bb-prover-test-'));

    prover = await BBNativeRollupProver.new(
      {
        acvmBinaryPath,
        acvmWorkingDirectory: join(tmp, 'acvm'),
        bbBinaryPath,
        bbWorkingDirectory: join(tmp, 'bb-prover'),
        bbSkipCleanup: true,
      },
      new NoopTelemetryClient(),
    );

    verifier = await BBCircuitVerifier.new({
      bbBinaryPath,
      bbWorkingDirectory: join(tmp, 'bb-verifier'),
    });
  });

  afterAll(async () => {
    await rm(tmp, { recursive: true });
  });

  beforeAll(async () => {
    circuit = 'BaseParityArtifact';
    const result = await prover.getBaseParityProof(makeBaseParityInputs());
    proof = result.proof;
    proofBuffer = result.proof.binaryProof.buffer;
  });

  describe('off-chain verification', () => {
    it('verifies proofs with bb', async () => {
      await expect(verifier.verifyProofForCircuit(circuit, proof.binaryProof)).resolves.toBeUndefined();
    });
  });

  describe('on-chain verification', () => {
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

    beforeAll(async () => {
      // const dir = '/tmp/bb-prover-test-7X2sBc/bb-prover/tmp-6IKVgc/ultra_keccak_honk/';
      // proofBuffer = await readFile(dir + 'proof');
    });

    it('verifies proof on-chain', async () => {
      const offset = 4;
      const headerSize = 3;
      const numPublicInputs = 19;
      const proofStart = proofBuffer.subarray(offset, offset + headerSize * Fr.SIZE_IN_BYTES);
      const publicInputsRaw = proofBuffer.subarray(
        offset + headerSize * Fr.SIZE_IN_BYTES,
        offset + headerSize * Fr.SIZE_IN_BYTES + numPublicInputs * Fr.SIZE_IN_BYTES,
      );
      const proofEnd = proofBuffer.subarray(
        offset + headerSize * Fr.SIZE_IN_BYTES + numPublicInputs * Fr.SIZE_IN_BYTES,
        proofBuffer.length,
      );

      const proofStr = '0x' + Buffer.concat([proofStart, proofEnd]).toString('hex');
      const publicInputs = BufferReader.asReader(publicInputsRaw)
        .readArray(numPublicInputs, Fr)
        .map(x => x.toString());

      // console.log({
      //   numPublicInputs,
      //   proofSize: proofStr.length - 2, // remove 0x
      //   proofStartSize: 2 * proofStart.length, // hex
      //   proofEndSize: 2 * proofEnd.length,
      // });
      // console.log(publicInputs);

      await expect(verifierContract.read.verify([proofStr, publicInputs])).resolves.toBeTruthy();
    });
  });
});
