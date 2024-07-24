import type { Tx, TxHash } from '@aztec/circuit-types';
import { BlockAttestation, BlockProposal } from '@aztec/foundation/sequencer';

import type { PeerId } from '@libp2p/interface';
import EventEmitter from 'events';

import { type P2PService, type PeerDiscoveryService, PeerDiscoveryState } from './service.js';

/**
 * A dummy implementation of the P2P Service.
 */
export class DummyP2PService implements P2PService {
  /**
   * Starts the dummy implementation.
   * @returns A resolved promise.
   */
  public start() {
    return Promise.resolve();
  }

  /**
   * Stops the dummy implementation.
   * @returns A resolved promise.
   */
  public stop() {
    return Promise.resolve();
  }

  /**
   * Called to have the given transaction propagated through the P2P network.
   * @param _ - The transaction to be propagated.
   */
  public propagateTx(_: Tx) {}

  public propagateProposal(_: BlockProposal) {}
  public propagateAttestation(_: BlockAttestation) {}

  /**
   * Called upon receipt of settled transactions.
   * @param _ - The hashes of the settled transactions.
   */
  public settledTxs(_: TxHash[]) {}
}

/**
 * A dummy implementation of the Peer Discovery Service.
 */
export class DummyPeerDiscoveryService extends EventEmitter implements PeerDiscoveryService {
  private currentState = PeerDiscoveryState.STOPPED;
  /**
   * Starts the dummy implementation.
   * @returns A resolved promise.
   */
  public start() {
    this.currentState = PeerDiscoveryState.RUNNING;
    return Promise.resolve();
  }
  /**
   * Stops the dummy implementation.
   * @returns A resolved promise.
   */
  public stop() {
    this.currentState = PeerDiscoveryState.STOPPED;
    return Promise.resolve();
  }
  /**
   * Called to discover peers in the network.
   * @returns An array of discovered peer addresses.
   */
  public getAllPeers() {
    return [];
  }

  public runRandomNodesQuery(): Promise<void> {
    return Promise.resolve();
  }

  public isBootstrapPeer(_: PeerId): boolean {
    return false;
  }

  public getStatus(): PeerDiscoveryState {
    return this.currentState;
  }
}
