import {
  type AztecAddress,
  type AztecNode,
  type DebugLogger,
  EthAddress,
  Fr,
  type PXE,
  type Wallet,
  computeSecretHash,
} from '@aztec/aztec.js';
import { GasPortalAbi, OutboxAbi, PortalERC20Abi } from '@aztec/l1-artifacts';
import { GasTokenContract } from '@aztec/noir-contracts.js';
import { GasTokenAddress, getCanonicalGasToken } from '@aztec/protocol-contracts/gas-token';

import {
  type Account,
  type Chain,
  type GetContractReturnType,
  type HttpTransport,
  type PublicClient,
  type WalletClient,
  getContract,
} from 'viem';

export interface IGasBridgingTestHarness {
  getL1GasTokenBalance(address: EthAddress): Promise<bigint>;
  bridgeFromL1ToL2(l1TokenBalance: bigint, bridgeAmount: bigint, owner: AztecAddress): Promise<void>;
  l2Token: GasTokenContract;
  l1GasTokenAddress: EthAddress;
}

export interface GasPortalTestingHarnessFactoryConfig {
  aztecNode: AztecNode;
  pxeService: PXE;
  publicClient: PublicClient<HttpTransport, Chain>;
  walletClient: WalletClient<HttpTransport, Chain, Account>;
  wallet: Wallet;
  logger: DebugLogger;
  mockL1?: boolean;
}

export class GasPortalTestingHarnessFactory {
  private constructor(private config: GasPortalTestingHarnessFactoryConfig) {}

  private async createMock() {
    const wallet = this.config.wallet;

    // In this case we are not using a portal we just yolo it.
    const gasL2 = await GasTokenContract.deploy(wallet)
      .send({ contractAddressSalt: getCanonicalGasToken().instance.salt })
      .deployed();
    return Promise.resolve(new MockGasBridgingTestHarness(gasL2, EthAddress.ZERO));
  }

  private async createReal() {
    const { aztecNode, pxeService, publicClient, walletClient, wallet, logger } = this.config;

    const ethAccount = EthAddress.fromString((await walletClient.getAddresses())[0]);
    const l1ContractAddresses = (await pxeService.getNodeInfo()).l1ContractAddresses;

    const gasTokenAddress = l1ContractAddresses.gasTokenAddress;
    const gasPortalAddress = l1ContractAddresses.gasPortalAddress;

    if (gasTokenAddress.isZero() || gasPortalAddress.isZero()) {
      throw new Error('Gas portal not deployed on L1');
    }

    const outbox = getContract({
      address: l1ContractAddresses.outboxAddress.toString(),
      abi: OutboxAbi,
      client: walletClient,
    });

    const gasL1 = getContract({
      address: gasTokenAddress.toString(),
      abi: PortalERC20Abi,
      client: walletClient,
    });

    const gasPortal = getContract({
      address: gasPortalAddress.toString(),
      abi: GasPortalAbi,
      client: walletClient,
    });

    const gasL2 = await GasTokenContract.at(GasTokenAddress, wallet);

    return new GasBridgingTestHarness(
      aztecNode,
      pxeService,
      logger,
      gasL2,
      ethAccount,
      gasPortalAddress,
      gasPortal,
      gasL1,
      outbox,
      publicClient,
      walletClient,
    );
  }

  static create(config: GasPortalTestingHarnessFactoryConfig): Promise<IGasBridgingTestHarness> {
    const factory = new GasPortalTestingHarnessFactory(config);
    if (config.mockL1) {
      return factory.createMock();
    } else {
      return factory.createReal();
    }
  }
}

class MockGasBridgingTestHarness implements IGasBridgingTestHarness {
  constructor(public l2Token: GasTokenContract, public l1GasTokenAddress: EthAddress) {}
  async bridgeFromL1ToL2(_l1TokenBalance: bigint, bridgeAmount: bigint, owner: AztecAddress): Promise<void> {
    await this.l2Token.methods.mint_public(owner, bridgeAmount).send().wait();
  }
  getL1GasTokenBalance(_address: EthAddress): Promise<bigint> {
    throw new Error('Cannot get gas token balance on mocked L1.');
  }
}

/**
 * A Class for testing cross chain interactions, contains common interactions
 * shared between cross chain tests.
 */
class GasBridgingTestHarness implements IGasBridgingTestHarness {
  constructor(
    /** Aztec node */
    public aztecNode: AztecNode,
    /** Private eXecution Environment (PXE). */
    public pxeService: PXE,
    /** Logger. */
    public logger: DebugLogger,

    /** L2 Token/Bridge contract. */
    public l2Token: GasTokenContract,

    /** Eth account to interact with. */
    public ethAccount: EthAddress,

    /** Portal address. */
    public tokenPortalAddress: EthAddress,
    /** Token portal instance. */
    public tokenPortal: GetContractReturnType<typeof GasPortalAbi, WalletClient<HttpTransport, Chain, Account>>,
    /** Underlying token for portal tests. */
    public underlyingERC20: GetContractReturnType<typeof PortalERC20Abi, WalletClient<HttpTransport, Chain, Account>>,
    /** Message Bridge Outbox. */
    public outbox: GetContractReturnType<typeof OutboxAbi, PublicClient<HttpTransport, Chain>>,
    /** Viem Public client instance. */
    public publicClient: PublicClient<HttpTransport, Chain>,
    /** Viem Wallet Client instance. */
    public walletClient: WalletClient,
  ) {}

  get l1GasTokenAddress() {
    return EthAddress.fromString(this.underlyingERC20.address);
  }

  generateClaimSecret(): [Fr, Fr] {
    this.logger.debug("Generating a claim secret using pedersen's hash function");
    const secret = Fr.random();
    const secretHash = computeSecretHash(secret);
    this.logger.info('Generated claim secret: ' + secretHash.toString());
    return [secret, secretHash];
  }

  async mintTokensOnL1(amount: bigint) {
    this.logger.info('Minting tokens on L1');
    await this.publicClient.waitForTransactionReceipt({
      hash: await this.underlyingERC20.write.mint([this.ethAccount.toString(), amount]),
    });
    expect(await this.underlyingERC20.read.balanceOf([this.ethAccount.toString()])).toBe(amount);
  }

  async getL1GasTokenBalance(address: EthAddress) {
    return await this.underlyingERC20.read.balanceOf([address.toString()]);
  }

  async sendTokensToPortalPublic(bridgeAmount: bigint, l2Address: AztecAddress, secretHash: Fr) {
    await this.publicClient.waitForTransactionReceipt({
      hash: await this.underlyingERC20.write.approve([this.tokenPortalAddress.toString(), bridgeAmount]),
    });

    // Deposit tokens to the TokenPortal
    this.logger.info('Sending messages to L1 portal to be consumed publicly');
    const args = [l2Address.toString(), bridgeAmount, secretHash.toString()] as const;
    const { result: messageHash } = await this.tokenPortal.simulate.depositToAztecPublic(args, {
      account: this.ethAccount.toString(),
    } as any);
    await this.publicClient.waitForTransactionReceipt({
      hash: await this.tokenPortal.write.depositToAztecPublic(args),
    });

    return Fr.fromString(messageHash);
  }

  async consumeMessageOnAztecAndMintPublicly(bridgeAmount: bigint, owner: AztecAddress, secret: Fr, leafIndex: bigint) {
    this.logger.info('Consuming messages on L2 Publicly');
    // Call the mint tokens function on the Aztec.nr contract
    await this.l2Token.methods.claim_public(owner, bridgeAmount, secret, leafIndex).send().wait();
  }

  async getL2PublicBalanceOf(owner: AztecAddress) {
    return await this.l2Token.methods.balance_of_public(owner).simulate();
  }

  async expectPublicBalanceOnL2(owner: AztecAddress, expectedBalance: bigint) {
    const balance = await this.getL2PublicBalanceOf(owner);
    expect(balance).toBe(expectedBalance);
  }

  async bridgeFromL1ToL2(l1TokenBalance: bigint, bridgeAmount: bigint, owner: AztecAddress) {
    const [secret, secretHash] = this.generateClaimSecret();

    // 1. Mint tokens on L1
    await this.mintTokensOnL1(l1TokenBalance);

    // 2. Deposit tokens to the TokenPortal
    const msgHash = await this.sendTokensToPortalPublic(bridgeAmount, owner, secretHash);
    expect(await this.getL1GasTokenBalance(this.ethAccount)).toBe(l1TokenBalance - bridgeAmount);

    // Perform an unrelated transactions on L2 to progress the rollup by 2 blocks.
    await this.l2Token.methods.check_balance(0).send().wait();
    await this.l2Token.methods.check_balance(0).send().wait();

    // Get message leaf index, needed for claiming in public
    const maybeIndexAndPath = await this.aztecNode.getL1ToL2MessageMembershipWitness('latest', msgHash, 0n);
    expect(maybeIndexAndPath).toBeDefined();
    const messageLeafIndex = maybeIndexAndPath![0];

    // 3. Consume L1-> L2 message and mint public tokens on L2
    await this.consumeMessageOnAztecAndMintPublicly(bridgeAmount, owner, secret, messageLeafIndex);
    await this.expectPublicBalanceOnL2(owner, bridgeAmount);
  }
}
// docs:end:cross_chain_test_harness
