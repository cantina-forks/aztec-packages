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

  let nftContract: NFTContract;

  let adminWallet: AccountWallet;
  let minterWallet: AccountWallet;
  let userWallet: AccountWallet;

  const TOKEN_ID = 6;

  beforeAll(async () => {
    let wallets: AccountWallet[];
    ({ aztecNode, pxe, teardown, wallets } = await setup(3));
    [adminWallet, minterWallet, userWallet] = wallets;


    nftContract = await NFTContract.deploy(adminWallet, adminWallet.getAddress(), 'FROG', 'FRG').send().deployed();
  });

  afterAll(() => teardown());

  it('sets minter', async () => {
    await nftContract.methods.set_minter(minterWallet.getAddress(), true).send().wait();
  });

  it('minter mints to a user', async () => {
    await nftContract.methods.mint(userWallet.getAddress(), TOKEN_ID).send().wait();
  });
});
