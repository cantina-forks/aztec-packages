/* Autogenerated file, do not edit! */

/* eslint-disable */
import {
  AztecAddress,
  Contract,
  ContractFunctionInteraction,
  ContractMethod,
  DeployMethod,
  Wallet,
} from '@aztec/aztec.js';
import { ContractAbi } from '@aztec/foundation/abi';
import { Fr, Point } from '@aztec/foundation/fields';
import { AztecRPC, PublicKey } from '@aztec/types';

import { EcdsaAccountContractAbi } from '../artifacts/index.js';

/**
 * Type-safe interface for contract EcdsaAccount;
 */
export class EcdsaAccountContract extends Contract {
  constructor(
    /** The deployed contract's address. */
    address: AztecAddress,
    /** The wallet. */
    wallet: Wallet,
  ) {
    super(address, EcdsaAccountContractAbi, wallet);
  }

  /**
   * Creates a tx to deploy a new instance of this contract.
   */
  public static deploy(rpc: AztecRPC, signing_pub_key_x: (bigint | number)[], signing_pub_key_y: (bigint | number)[]) {
    return new DeployMethod(Point.ZERO, rpc, EcdsaAccountContractAbi, Array.from(arguments).slice(1));
  }

  /**
   * Creates a tx to deploy a new instance of this contract using the specified public key to derive the address.
   */
  public static deployWithPublicKey(
    rpc: AztecRPC,
    publicKey: PublicKey,
    signing_pub_key_x: (bigint | number)[],
    signing_pub_key_y: (bigint | number)[],
  ) {
    return new DeployMethod(publicKey, rpc, EcdsaAccountContractAbi, Array.from(arguments).slice(2));
  }

  /**
   * Returns this contract's ABI.
   */
  public static get abi(): ContractAbi {
    return EcdsaAccountContractAbi;
  }

  /** Type-safe wrappers for the public methods exposed by the contract. */
  public methods!: {
    /** compute_note_hash_and_nullifier(contract_address: field, nonce: field, storage_slot: field, preimage: array) */
    compute_note_hash_and_nullifier: ((
      contract_address: Fr | bigint | number | { toField: () => Fr },
      nonce: Fr | bigint | number | { toField: () => Fr },
      storage_slot: Fr | bigint | number | { toField: () => Fr },
      preimage: (Fr | bigint | number | { toField: () => Fr })[],
    ) => ContractFunctionInteraction) &
      Pick<ContractMethod, 'selector'>;

    /** entrypoint(payload: struct, signature: array) */
    entrypoint: ((
      payload: {
        flattened_args_hashes: (Fr | bigint | number | { toField: () => Fr })[];
        flattened_selectors: (Fr | bigint | number | { toField: () => Fr })[];
        flattened_targets: (Fr | bigint | number | { toField: () => Fr })[];
        nonce: Fr | bigint | number | { toField: () => Fr };
      },
      signature: (bigint | number)[],
    ) => ContractFunctionInteraction) &
      Pick<ContractMethod, 'selector'>;
  };
}
