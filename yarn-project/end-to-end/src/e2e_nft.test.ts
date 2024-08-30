import {
  type AccountWallet, type AztecNode, type PXE
} from '@aztec/aztec.js';
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
  let nftContractAsUser: NFTContract;

  let adminWallet: AccountWallet;
  let minterWallet: AccountWallet;
  let userWallet: AccountWallet;

  const TOKEN_ID = 6;

  beforeAll(async () => {
    let wallets: AccountWallet[];
    ({ aztecNode, pxe, teardown, wallets } = await setup(3));
    [adminWallet, minterWallet, userWallet] = wallets;


    nftContractAsAdmin = await NFTContract.deploy(adminWallet, adminWallet.getAddress(), 'FROG', 'FRG').send().deployed();
    nftContractAsMinter = await NFTContract.at(nftContractAsAdmin.address, minterWallet);
    nftContractAsUser = await NFTContract.at(nftContractAsAdmin.address, userWallet);
  });

  afterAll(() => teardown());

  // NOTE: This test is sequential and each test case depends on the previous one
  it('sets minter', async () => {
    await nftContractAsAdmin.methods.set_minter(minterWallet.getAddress(), true).send().wait();
  });

  it('minter mints to a user', async () => {
    await nftContractAsMinter.methods.mint(userWallet.getAddress(), TOKEN_ID).send().wait();
  });

  it('user shields', async () => {
    // In a simple shield flow the finalizer is the user itself (in the uniswap swap to shield flow it would be the uniswap contract)
    const finalizer = userWallet.getAddress();
    await nftContractAsUser.methods.prepare_shield(finalizer).send().wait();
  });
});
