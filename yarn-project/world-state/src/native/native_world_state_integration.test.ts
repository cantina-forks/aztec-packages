import { MerkleTreeId } from '@aztec/circuit-types';
import {
  Fr,
  NULLIFIER_TREE_HEIGHT,
  NullifierLeaf,
  NullifierLeafPreimage,
  PublicDataTreeLeaf,
  PublicDataTreeLeafPreimage,
} from '@aztec/circuits.js';

import { mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import { type IndexedTreeId } from '../world-state-db/merkle_tree_operations.js';
import { NativeWorldStateService } from './native_world_state.js';

describe('NativeWorldState', () => {
  let dataDir: string;
  let worldState: NativeWorldStateService;

  beforeAll(async () => {
    dataDir = await mkdtemp(join(tmpdir(), 'native_world_state_test-'));
    worldState = await NativeWorldStateService.create('world_state_napi', 'WorldState', dataDir);
  });

  it('gets tree info', async () => {
    const info = await worldState.getTreeInfo(MerkleTreeId.NULLIFIER_TREE, false);
    expect(info.size).toBe(2n); // prefilled with two leaves
  });

  it('gets sibling path', async () => {
    const siblingPath = await worldState.getSiblingPath(MerkleTreeId.NULLIFIER_TREE, 0n, false);
    expect(siblingPath.pathSize).toBe(NULLIFIER_TREE_HEIGHT);
  });

  it.each([
    [MerkleTreeId.NULLIFIER_TREE, new NullifierLeaf(new Fr(1n)).toBuffer(), 1n],
    [MerkleTreeId.NOTE_HASH_TREE, new Fr(1n), undefined],
  ])('gets leaf index', async (treeId, leaf, expected) => {
    const index = await worldState.findLeafIndex(treeId, leaf, false);
    expect(index).toEqual(expected);
  });

  it('gets state reference', async () => {
    const sr = await worldState.getStateReference(false);
    expect(sr).toBeDefined();
  });

  it.each([
    [MerkleTreeId.NULLIFIER_TREE, 0n, Fr.ZERO.toBuffer()],
    [MerkleTreeId.PUBLIC_DATA_TREE, 0n, new PublicDataTreeLeaf(new Fr(0n), new Fr(0n)).toBuffer()],
    [MerkleTreeId.NOTE_HASH_TREE, 0n, undefined],
  ])('gets leaf value', async (id, index, expectedLeaf) => {
    const leaf = await worldState.getLeafValue(id, index, false);
    expect(leaf).toEqual(expectedLeaf);
  });

  it.each([
    [MerkleTreeId.NULLIFIER_TREE, 0n, new NullifierLeafPreimage(new Fr(0n), new Fr(1), 1n)],
    [MerkleTreeId.PUBLIC_DATA_TREE, 0n, new PublicDataTreeLeafPreimage(new Fr(0n), new Fr(0n), new Fr(1n), 1n)],
  ])('gets leaf preimage', async (id, index, expected) => {
    const leaf = await worldState.getLeafPreimage(id as IndexedTreeId, index, false);
    expect(leaf).toEqual(expected);
  });

  it.each([
    [MerkleTreeId.NULLIFIER_TREE, 42n, 1n, false],
    [MerkleTreeId.NULLIFIER_TREE, 1n, 1n, true],
    [MerkleTreeId.PUBLIC_DATA_TREE, 42n, 1n, false],
    [MerkleTreeId.PUBLIC_DATA_TREE, 1n, 1n, true],
  ])('finds low leaf', async (treeId, key, index, alreadyPresent) => {
    const lowLeaf = await worldState.getPreviousValueIndex(treeId as any, key, false);
    expect(lowLeaf).toEqual({ index, alreadyPresent });
  });
});
