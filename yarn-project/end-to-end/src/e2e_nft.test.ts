import { type AccountWallet, AztecAddress, BatchCall, ExtendedNote, Fr, Note } from '@aztec/aztec.js';
import { deriveStorageSlotInMap } from '@aztec/circuits.js/hash';
import { pedersenHash } from '@aztec/foundation/crypto';
import { NFTContract } from '@aztec/noir-contracts.js';

import { jest } from '@jest/globals';

import { setup } from './fixtures/utils.js';

const TIMEOUT = 120_000;

describe('NFT', () => {
  jest.setTimeout(TIMEOUT);

  let teardown: () => Promise<void>;

  let nftContractAsAdmin: NFTContract;
  let nftContractAsMinter: NFTContract;
  let nftContractAsUser1: NFTContract;
  let nftContractAsUser2: NFTContract;

  let adminWallet: AccountWallet;
  let minterWallet: AccountWallet;
  let user1Wallet: AccountWallet;
  let user2Wallet: AccountWallet;

  // Arbitrary token id
  const TOKEN_ID = Fr.random().toBigInt();
  const TRANSIENT_STORAGE_SLOT_PEDERSEN_INDEX = 3;

  beforeAll(async () => {
    let wallets: AccountWallet[];
    ({ teardown, wallets } = await setup(4));
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
    const isMinterAMinter = await nftContractAsAdmin.methods.is_minter(minterWallet.getAddress()).simulate();
    expect(isMinterAMinter).toBe(true);
  });

  it('minter mints to a user', async () => {
    await nftContractAsMinter.methods.mint(user1Wallet.getAddress(), TOKEN_ID).send().wait();

    const ownerAfterMint = await nftContractAsUser1.methods.owner_of(TOKEN_ID).simulate();
    expect(ownerAfterMint).toEqual(user1Wallet.getAddress());
  });

  it('shields', async () => {
    // In a simple shield flow the finalizer is the user itself (in the uniswap swap to shield flow it would be
    // the uniswap contract)
    const finalizer = user1Wallet.getAddress();
    const noteRandomness = Fr.random();
    const transientStorageSlotRandomness = Fr.random();
    const ownerStorageSlotCommitment = pedersenHash(
      [user1Wallet.getAddress(), transientStorageSlotRandomness],
      TRANSIENT_STORAGE_SLOT_PEDERSEN_INDEX,
    );

    const { txHash, debugInfo } = await new BatchCall(user1Wallet, [
      nftContractAsUser1.methods.prepare_shield(finalizer, noteRandomness, transientStorageSlotRandomness).request(),
      nftContractAsUser1.methods.send_to_shield(finalizer, TOKEN_ID, ownerStorageSlotCommitment, 0).request(),
    ])
      .send()
      .wait({ debug: true });

    const publicOwnerAfter = await nftContractAsUser1.methods.owner_of(TOKEN_ID).simulate();
    expect(publicOwnerAfter).toEqual(AztecAddress.ZERO);

    // TODO(#8238): Since we don't yet have a partial note delivery we have to manually add it to PXE
    const nftNote = new Note([
      new Fr(TOKEN_ID),
      user1Wallet.getCompleteAddress().publicKeys.masterNullifierPublicKey.hash(),
      noteRandomness,
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

    // We should get 4 data writes setting values to 0 - 3 for note hiding point and 1 for public owner (we shield so
    // public owner is set to 0). Ideally we would have here only 1 data write as the 4 values change from zero
    // to non-zero to zero in the tx and hence no write could be committed. This makes public writes squashing too
    // expensive for transient storage. This however probably does not matter as I assume we will want to implement
    // a real transient storage anyway. (Informed Leila about the potential optimization.)
    const publicDataWritesValues = debugInfo!.publicDataWrites!.map(write => write.newValue.toBigInt());
    expect(publicDataWritesValues).toEqual([0n, 0n, 0n, 0n]);
  });

  it('privately sends', async () => {
    await nftContractAsUser1.methods
      .transfer_from(user1Wallet.getAddress(), user2Wallet.getAddress(), TOKEN_ID, 0)
      .send()
      .wait();

    const user1Nfts = await getPrivateNfts(user1Wallet.getAddress());
    expect(user1Nfts).toEqual([]);

    const user2Nfts = await getPrivateNfts(user2Wallet.getAddress());
    expect(user2Nfts).toEqual([TOKEN_ID]);
  });

  it('unshields', async () => {
    await nftContractAsUser2.methods
      .unshield(user2Wallet.getAddress(), user2Wallet.getAddress(), TOKEN_ID, 0)
      .send()
      .wait();

    const publicOwnerAfter = await nftContractAsUser2.methods.owner_of(TOKEN_ID).simulate();
    expect(publicOwnerAfter).toEqual(user2Wallet.getAddress());
  });

  it('publicly sends', async () => {
    await nftContractAsUser2.methods
      .transfer_public(user2Wallet.getAddress(), user1Wallet.getAddress(), TOKEN_ID, 0)
      .send()
      .wait();

    const publicOwnerAfter = await nftContractAsUser2.methods.owner_of(TOKEN_ID).simulate();
    expect(publicOwnerAfter).toEqual(user1Wallet.getAddress());
  });

  it('burns', async () => {
    await nftContractAsUser1.methods.burn(user1Wallet.getAddress(), TOKEN_ID, 0).send().wait();

    const publicOwnerAfter = await nftContractAsUser1.methods.owner_of(TOKEN_ID).simulate();
    expect(publicOwnerAfter).toEqual(AztecAddress.ZERO);
  });

  const getPrivateNfts = async (owner: AztecAddress) => {
    const [nfts, pageLimitReached] = await nftContractAsUser1.methods.get_private_nfts(owner, 0).simulate();
    if (pageLimitReached) {
      throw new Error('Page limit reached and pagination not implemented in test');
    }
    // We prune placeholder values
    return nfts.filter((tokenId: bigint) => tokenId !== 0n);
  };
});
