// GENERATED FILE - DO NOT EDIT, RUN yarn remake-constants in circuits.js
// SPDX-License-Identifier: Apache-2.0
// Copyright 2023 Aztec Labs.
pragma solidity >=0.8.18;

/**
 * @title Constants Library
 * @author Aztec Labs
 * @notice Library that contains constants used throughout the Aztec protocol
 */
library Constants {
  // Prime field modulus
  uint256 internal constant P =
    21888242871839275222246405745257275088548364400416034343698204186575808495617;
  uint256 internal constant MAX_FIELD_VALUE = P - 1;

  uint256 internal constant ARGS_LENGTH = 16;
  uint256 internal constant MAX_NEW_NOTE_HASHES_PER_CALL = 16;
  uint256 internal constant MAX_NEW_NULLIFIERS_PER_CALL = 16;
  uint256 internal constant MAX_PRIVATE_CALL_STACK_LENGTH_PER_CALL = 4;
  uint256 internal constant MAX_PUBLIC_CALL_STACK_LENGTH_PER_CALL = 16;
  uint256 internal constant MAX_NEW_L2_TO_L1_MSGS_PER_CALL = 2;
  uint256 internal constant MAX_PUBLIC_DATA_UPDATE_REQUESTS_PER_CALL = 16;
  uint256 internal constant MAX_PUBLIC_DATA_READS_PER_CALL = 16;
  uint256 internal constant MAX_NOTE_HASH_READ_REQUESTS_PER_CALL = 32;
  uint256 internal constant MAX_NULLIFIER_READ_REQUESTS_PER_CALL = 32;
  uint256 internal constant MAX_NULLIFIER_NON_EXISTENT_READ_REQUESTS_PER_CALL = 32;
  uint256 internal constant MAX_NULLIFIER_KEY_VALIDATION_REQUESTS_PER_CALL = 16;
  uint256 internal constant MAX_NOTE_ENCRYPTED_LOGS_PER_CALL = 16;
  uint256 internal constant MAX_ENCRYPTED_LOGS_PER_CALL = 4;
  uint256 internal constant MAX_UNENCRYPTED_LOGS_PER_CALL = 4;
  uint256 internal constant MAX_NEW_NOTE_HASHES_PER_TX = 64;
  uint256 internal constant MAX_NEW_NULLIFIERS_PER_TX = 64;
  uint256 internal constant MAX_PRIVATE_CALL_STACK_LENGTH_PER_TX = 8;
  uint256 internal constant MAX_PUBLIC_CALL_STACK_LENGTH_PER_TX = 32;
  uint256 internal constant MAX_PUBLIC_DATA_UPDATE_REQUESTS_PER_TX = 32;
  uint256 internal constant MAX_PUBLIC_DATA_READS_PER_TX = 32;
  uint256 internal constant MAX_NEW_L2_TO_L1_MSGS_PER_TX = 2;
  uint256 internal constant MAX_NOTE_HASH_READ_REQUESTS_PER_TX = 128;
  uint256 internal constant MAX_NULLIFIER_READ_REQUESTS_PER_TX = 128;
  uint256 internal constant MAX_NULLIFIER_NON_EXISTENT_READ_REQUESTS_PER_TX = 128;
  uint256 internal constant MAX_NULLIFIER_KEY_VALIDATION_REQUESTS_PER_TX = 64;
  uint256 internal constant MAX_NOTE_ENCRYPTED_LOGS_PER_TX = 64;
  uint256 internal constant MAX_ENCRYPTED_LOGS_PER_TX = 8;
  uint256 internal constant MAX_UNENCRYPTED_LOGS_PER_TX = 8;
  uint256 internal constant NUM_ENCRYPTED_LOGS_HASHES_PER_TX = 1;
  uint256 internal constant NUM_UNENCRYPTED_LOGS_HASHES_PER_TX = 1;
  uint256 internal constant MAX_PUBLIC_DATA_HINTS = 64;
  uint256 internal constant NUMBER_OF_L1_L2_MESSAGES_PER_ROLLUP = 16;
  uint256 internal constant VK_TREE_HEIGHT = 3;
  uint256 internal constant FUNCTION_TREE_HEIGHT = 5;
  uint256 internal constant NOTE_HASH_TREE_HEIGHT = 32;
  uint256 internal constant PUBLIC_DATA_TREE_HEIGHT = 40;
  uint256 internal constant NULLIFIER_TREE_HEIGHT = 20;
  uint256 internal constant L1_TO_L2_MSG_TREE_HEIGHT = 16;
  uint256 internal constant ROLLUP_VK_TREE_HEIGHT = 8;
  uint256 internal constant ARTIFACT_FUNCTION_TREE_MAX_HEIGHT = 5;
  uint256 internal constant NULLIFIER_TREE_ID = 0;
  uint256 internal constant NOTE_HASH_TREE_ID = 1;
  uint256 internal constant PUBLIC_DATA_TREE_ID = 2;
  uint256 internal constant L1_TO_L2_MESSAGE_TREE_ID = 3;
  uint256 internal constant ARCHIVE_TREE_ID = 4;
  uint256 internal constant NOTE_HASH_SUBTREE_HEIGHT = 6;
  uint256 internal constant NOTE_HASH_SUBTREE_SIBLING_PATH_LENGTH = 26;
  uint256 internal constant NULLIFIER_SUBTREE_HEIGHT = 6;
  uint256 internal constant PUBLIC_DATA_SUBTREE_HEIGHT = 5;
  uint256 internal constant ARCHIVE_HEIGHT = 16;
  uint256 internal constant NULLIFIER_SUBTREE_SIBLING_PATH_LENGTH = 14;
  uint256 internal constant PUBLIC_DATA_SUBTREE_SIBLING_PATH_LENGTH = 35;
  uint256 internal constant L1_TO_L2_MSG_SUBTREE_HEIGHT = 4;
  uint256 internal constant L1_TO_L2_MSG_SUBTREE_SIBLING_PATH_LENGTH = 12;
  uint256 internal constant FUNCTION_SELECTOR_NUM_BYTES = 4;
  uint256 internal constant ARGS_HASH_CHUNK_LENGTH = 64;
  uint256 internal constant ARGS_HASH_CHUNK_COUNT = 64;
  uint256 internal constant MAX_ARGS_LENGTH = ARGS_HASH_CHUNK_COUNT * ARGS_HASH_CHUNK_LENGTH;
  uint256 internal constant INITIALIZATION_SLOT_SEPARATOR = 1000_000_000;
  uint256 internal constant INITIAL_L2_BLOCK_NUM = 1;
  uint256 internal constant BLOB_SIZE_IN_BYTES = 31 * 4096;
  uint256 internal constant MAX_PACKED_PUBLIC_BYTECODE_SIZE_IN_FIELDS = 20000;
  uint256 internal constant MAX_PACKED_BYTECODE_SIZE_PER_PRIVATE_FUNCTION_IN_FIELDS = 3000;
  uint256 internal constant MAX_PACKED_BYTECODE_SIZE_PER_UNCONSTRAINED_FUNCTION_IN_FIELDS = 3000;
  uint256 internal constant REGISTERER_PRIVATE_FUNCTION_BROADCASTED_ADDITIONAL_FIELDS = 19;
  uint256 internal constant REGISTERER_UNCONSTRAINED_FUNCTION_BROADCASTED_ADDITIONAL_FIELDS = 12;
  uint256 internal constant REGISTERER_CONTRACT_CLASS_REGISTERED_MAGIC_VALUE =
    0x6999d1e02b08a447a463563453cb36919c9dd7150336fc7c4d2b52f8;
  uint256 internal constant REGISTERER_PRIVATE_FUNCTION_BROADCASTED_MAGIC_VALUE =
    0x1b70e95fde0b70adc30496b90a327af6a5e383e028e7a43211a07bcd;
  uint256 internal constant REGISTERER_UNCONSTRAINED_FUNCTION_BROADCASTED_MAGIC_VALUE =
    0xe7af816635466f128568edb04c9fa024f6c87fb9010fdbffa68b3d99;
  uint256 internal constant DEPLOYER_CONTRACT_INSTANCE_DEPLOYED_MAGIC_VALUE =
    0x85864497636cf755ae7bde03f267ce01a520981c21c3682aaf82a631;
  uint256 internal constant DEPLOYER_CONTRACT_ADDRESS =
    0x2e9c386f07e22a1d24e677ab70407b2dd0adbc7cafb9c822bf249685d6a2e4cc;
  uint256 internal constant DEFAULT_GAS_LIMIT = 1_000_000_000;
  uint256 internal constant DEFAULT_TEARDOWN_GAS_LIMIT = 100_000_000;
  uint256 internal constant DEFAULT_MAX_FEE_PER_GAS = 10;
  uint256 internal constant DEFAULT_INCLUSION_FEE = 0;
  uint256 internal constant DA_BYTES_PER_FIELD = 32;
  uint256 internal constant DA_GAS_PER_BYTE = 16;
  uint256 internal constant FIXED_DA_GAS = 512;
  uint256 internal constant CANONICAL_KEY_REGISTRY_ADDRESS =
    0x1585e564a60e6ec974bc151b62705292ebfc75c33341986a47fd9749cedb567e;
  uint256 internal constant AZTEC_ADDRESS_LENGTH = 1;
  uint256 internal constant GAS_FEES_LENGTH = 2;
  uint256 internal constant GAS_LENGTH = 2;
  uint256 internal constant GAS_SETTINGS_LENGTH =
    GAS_LENGTH * 2 + GAS_FEES_LENGTH /* inclusion_fee */ + 1;
  uint256 internal constant CALL_CONTEXT_LENGTH = 6;
  uint256 internal constant CONTENT_COMMITMENT_LENGTH = 4;
  uint256 internal constant CONTRACT_INSTANCE_LENGTH = 5;
  uint256 internal constant CONTRACT_STORAGE_READ_LENGTH = 2;
  uint256 internal constant CONTRACT_STORAGE_UPDATE_REQUEST_LENGTH = 2;
  uint256 internal constant ETH_ADDRESS_LENGTH = 1;
  uint256 internal constant FUNCTION_DATA_LENGTH = 3;
  uint256 internal constant FUNCTION_LEAF_PREIMAGE_LENGTH = 5;
  uint256 internal constant GLOBAL_VARIABLES_LENGTH = 6 + GAS_FEES_LENGTH;
  uint256 internal constant APPEND_ONLY_TREE_SNAPSHOT_LENGTH = 2;
  uint256 internal constant L1_TO_L2_MESSAGE_LENGTH = 6;
  uint256 internal constant L2_TO_L1_MESSAGE_LENGTH = 3;
  uint256 internal constant SCOPED_L2_TO_L1_MESSAGE_LENGTH = L2_TO_L1_MESSAGE_LENGTH + 1;
  uint256 internal constant MAX_BLOCK_NUMBER_LENGTH = 2;
  uint256 internal constant NULLIFIER_KEY_VALIDATION_REQUEST_LENGTH = 3;
  uint256 internal constant SCOPED_NULLIFIER_KEY_VALIDATION_REQUEST_LENGTH =
    NULLIFIER_KEY_VALIDATION_REQUEST_LENGTH + 1;
  uint256 internal constant PARTIAL_STATE_REFERENCE_LENGTH = 6;
  uint256 internal constant READ_REQUEST_LENGTH = 2;
  uint256 internal constant LOG_HASH_LENGTH = 3;
  uint256 internal constant NOTE_LOG_HASH_LENGTH = 4;
  uint256 internal constant NOTE_HASH_LENGTH = 2;
  uint256 internal constant SCOPED_NOTE_HASH_LENGTH = NOTE_HASH_LENGTH + 2;
  uint256 internal constant NULLIFIER_LENGTH = 3;
  uint256 internal constant SCOPED_NULLIFIER_LENGTH = NULLIFIER_LENGTH + 1;
  uint256 internal constant CALLER_CONTEXT_LENGTH = 2 * AZTEC_ADDRESS_LENGTH + 1;
  uint256 internal constant PRIVATE_CALL_REQUEST_LENGTH = 3 + CALLER_CONTEXT_LENGTH;
  uint256 internal constant SCOPED_PRIVATE_CALL_REQUEST_LENGTH =
    PRIVATE_CALL_REQUEST_LENGTH + AZTEC_ADDRESS_LENGTH;
  uint256 internal constant SIDE_EFFECT_LENGTH = 2;
  uint256 internal constant ROLLUP_VALIDATION_REQUESTS_LENGTH = MAX_BLOCK_NUMBER_LENGTH;
  uint256 internal constant STATE_REFERENCE_LENGTH =
    APPEND_ONLY_TREE_SNAPSHOT_LENGTH + PARTIAL_STATE_REFERENCE_LENGTH;
  uint256 internal constant TX_CONTEXT_LENGTH = 2 + GAS_SETTINGS_LENGTH;
  uint256 internal constant TX_REQUEST_LENGTH = 2 + TX_CONTEXT_LENGTH + FUNCTION_DATA_LENGTH;
  uint256 internal constant TOTAL_FEES_LENGTH = 1;
  uint256 internal constant HEADER_LENGTH = APPEND_ONLY_TREE_SNAPSHOT_LENGTH
    + CONTENT_COMMITMENT_LENGTH + STATE_REFERENCE_LENGTH + GLOBAL_VARIABLES_LENGTH + TOTAL_FEES_LENGTH;
  uint256 internal constant PRIVATE_CIRCUIT_PUBLIC_INPUTS_LENGTH = CALL_CONTEXT_LENGTH + 4
    + MAX_BLOCK_NUMBER_LENGTH + (READ_REQUEST_LENGTH * MAX_NOTE_HASH_READ_REQUESTS_PER_CALL)
    + (READ_REQUEST_LENGTH * MAX_NULLIFIER_READ_REQUESTS_PER_CALL)
    + (NULLIFIER_KEY_VALIDATION_REQUEST_LENGTH * MAX_NULLIFIER_KEY_VALIDATION_REQUESTS_PER_CALL)
    + (NOTE_HASH_LENGTH * MAX_NEW_NOTE_HASHES_PER_CALL)
    + (NULLIFIER_LENGTH * MAX_NEW_NULLIFIERS_PER_CALL)
    + (PRIVATE_CALL_REQUEST_LENGTH * MAX_PRIVATE_CALL_STACK_LENGTH_PER_CALL)
    + MAX_PUBLIC_CALL_STACK_LENGTH_PER_CALL + 1
    + (L2_TO_L1_MESSAGE_LENGTH * MAX_NEW_L2_TO_L1_MSGS_PER_CALL) + 2
    + (NOTE_LOG_HASH_LENGTH * MAX_NOTE_ENCRYPTED_LOGS_PER_CALL)
    + (LOG_HASH_LENGTH * MAX_ENCRYPTED_LOGS_PER_CALL)
    + (LOG_HASH_LENGTH * MAX_UNENCRYPTED_LOGS_PER_CALL) + HEADER_LENGTH + TX_CONTEXT_LENGTH;
  uint256 internal constant PUBLIC_CIRCUIT_PUBLIC_INPUTS_LENGTH = CALL_CONTEXT_LENGTH + 2
    + (READ_REQUEST_LENGTH * MAX_NULLIFIER_READ_REQUESTS_PER_CALL)
    + (READ_REQUEST_LENGTH * MAX_NULLIFIER_NON_EXISTENT_READ_REQUESTS_PER_CALL)
    + (CONTRACT_STORAGE_UPDATE_REQUEST_LENGTH * MAX_PUBLIC_DATA_UPDATE_REQUESTS_PER_CALL)
    + (CONTRACT_STORAGE_READ_LENGTH * MAX_PUBLIC_DATA_READS_PER_CALL)
    + MAX_PUBLIC_CALL_STACK_LENGTH_PER_CALL + (NOTE_HASH_LENGTH * MAX_NEW_NOTE_HASHES_PER_CALL)
    + (NULLIFIER_LENGTH * MAX_NEW_NULLIFIERS_PER_CALL)
    + (L2_TO_L1_MESSAGE_LENGTH * MAX_NEW_L2_TO_L1_MSGS_PER_CALL) + 2
    + (LOG_HASH_LENGTH * MAX_UNENCRYPTED_LOGS_PER_CALL) + HEADER_LENGTH + GLOBAL_VARIABLES_LENGTH
    + AZTEC_ADDRESS_LENGTH /* revert_code */ + 1 + 2 * GAS_LENGTH /* transaction_fee */ + 1;
  uint256 internal constant PRIVATE_CALL_STACK_ITEM_LENGTH =
    AZTEC_ADDRESS_LENGTH + FUNCTION_DATA_LENGTH + PRIVATE_CIRCUIT_PUBLIC_INPUTS_LENGTH;
  uint256 internal constant PUBLIC_CONTEXT_INPUTS_LENGTH =
    CALL_CONTEXT_LENGTH + HEADER_LENGTH + GLOBAL_VARIABLES_LENGTH + GAS_LENGTH + 2;
  uint256 internal constant SCOPED_READ_REQUEST_LEN = READ_REQUEST_LENGTH + 1;
  uint256 internal constant PUBLIC_DATA_READ_LENGTH = 2;
  uint256 internal constant VALIDATION_REQUESTS_LENGTH = ROLLUP_VALIDATION_REQUESTS_LENGTH
    + (SCOPED_READ_REQUEST_LEN * MAX_NOTE_HASH_READ_REQUESTS_PER_TX)
    + (SCOPED_READ_REQUEST_LEN * MAX_NULLIFIER_READ_REQUESTS_PER_TX)
    + (SCOPED_READ_REQUEST_LEN * MAX_NULLIFIER_NON_EXISTENT_READ_REQUESTS_PER_TX)
    + (SCOPED_NULLIFIER_KEY_VALIDATION_REQUEST_LENGTH * MAX_NULLIFIER_KEY_VALIDATION_REQUESTS_PER_TX)
    + (PUBLIC_DATA_READ_LENGTH * MAX_PUBLIC_DATA_READS_PER_TX);
  uint256 internal constant PUBLIC_DATA_UPDATE_REQUEST_LENGTH = 2;
  uint256 internal constant COMBINED_ACCUMULATED_DATA_LENGTH = MAX_NEW_NOTE_HASHES_PER_TX
    + MAX_NEW_NULLIFIERS_PER_TX + MAX_NEW_L2_TO_L1_MSGS_PER_TX + 5
    + (MAX_PUBLIC_DATA_UPDATE_REQUESTS_PER_TX * PUBLIC_DATA_UPDATE_REQUEST_LENGTH) + GAS_LENGTH;
  uint256 internal constant COMBINED_CONSTANT_DATA_LENGTH =
    HEADER_LENGTH + TX_CONTEXT_LENGTH + GLOBAL_VARIABLES_LENGTH;
  uint256 internal constant CALL_REQUEST_LENGTH =
    1 + AZTEC_ADDRESS_LENGTH + CALLER_CONTEXT_LENGTH + 2;
  uint256 internal constant PRIVATE_ACCUMULATED_DATA_LENGTH = (
    SCOPED_NOTE_HASH_LENGTH * MAX_NEW_NOTE_HASHES_PER_TX
  ) + (SCOPED_NULLIFIER_LENGTH * MAX_NEW_NULLIFIERS_PER_TX)
    + (MAX_NEW_L2_TO_L1_MSGS_PER_TX * SCOPED_L2_TO_L1_MESSAGE_LENGTH)
    + (NOTE_LOG_HASH_LENGTH * MAX_NOTE_ENCRYPTED_LOGS_PER_TX)
    + (LOG_HASH_LENGTH * MAX_ENCRYPTED_LOGS_PER_TX) + (LOG_HASH_LENGTH * MAX_UNENCRYPTED_LOGS_PER_TX)
    + (SCOPED_PRIVATE_CALL_REQUEST_LENGTH * MAX_PRIVATE_CALL_STACK_LENGTH_PER_TX)
    + (CALL_REQUEST_LENGTH * MAX_PUBLIC_CALL_STACK_LENGTH_PER_TX);
  uint256 internal constant PRIVATE_KERNEL_CIRCUIT_PUBLIC_INPUTS_LENGTH = 1
    + VALIDATION_REQUESTS_LENGTH + PRIVATE_ACCUMULATED_DATA_LENGTH + COMBINED_CONSTANT_DATA_LENGTH
    + CALL_REQUEST_LENGTH + AZTEC_ADDRESS_LENGTH;
  uint256 internal constant PUBLIC_ACCUMULATED_DATA_LENGTH = (
    MAX_NEW_NOTE_HASHES_PER_TX * NOTE_HASH_LENGTH
  ) + (MAX_NEW_NULLIFIERS_PER_TX * NULLIFIER_LENGTH) + (MAX_NEW_L2_TO_L1_MSGS_PER_TX * 1)
    + (NOTE_LOG_HASH_LENGTH * MAX_NOTE_ENCRYPTED_LOGS_PER_TX)
    + (MAX_ENCRYPTED_LOGS_PER_TX * LOG_HASH_LENGTH) + (MAX_UNENCRYPTED_LOGS_PER_TX * LOG_HASH_LENGTH)
    + (MAX_PUBLIC_DATA_UPDATE_REQUESTS_PER_TX * PUBLIC_DATA_UPDATE_REQUEST_LENGTH)
    + (MAX_PUBLIC_CALL_STACK_LENGTH_PER_TX * CALL_REQUEST_LENGTH) + GAS_LENGTH;
  uint256 internal constant PUBLIC_KERNEL_CIRCUIT_PUBLIC_INPUTS_LENGTH = VALIDATION_REQUESTS_LENGTH
    + PUBLIC_ACCUMULATED_DATA_LENGTH + PUBLIC_ACCUMULATED_DATA_LENGTH + COMBINED_CONSTANT_DATA_LENGTH
    + 1 + (MAX_PUBLIC_CALL_STACK_LENGTH_PER_TX * CALL_REQUEST_LENGTH) + AZTEC_ADDRESS_LENGTH;
  uint256 internal constant KERNEL_CIRCUIT_PUBLIC_INPUTS_LENGTH = ROLLUP_VALIDATION_REQUESTS_LENGTH
    + COMBINED_ACCUMULATED_DATA_LENGTH + COMBINED_CONSTANT_DATA_LENGTH
    + PARTIAL_STATE_REFERENCE_LENGTH + 1 + AZTEC_ADDRESS_LENGTH;
  uint256 internal constant CONSTANT_ROLLUP_DATA_LENGTH =
    APPEND_ONLY_TREE_SNAPSHOT_LENGTH + 4 + GLOBAL_VARIABLES_LENGTH;
  uint256 internal constant BASE_OR_MERGE_PUBLIC_INPUTS_LENGTH = CONSTANT_ROLLUP_DATA_LENGTH
    + PARTIAL_STATE_REFERENCE_LENGTH + PARTIAL_STATE_REFERENCE_LENGTH + 5;
  uint256 internal constant ENQUEUE_PUBLIC_FUNCTION_CALL_RETURN_LENGTH =
    2 + FUNCTION_DATA_LENGTH + CALL_CONTEXT_LENGTH;
  uint256 internal constant GET_NOTES_ORACLE_RETURN_LENGTH = 674;
  uint256 internal constant NOTE_HASHES_NUM_BYTES_PER_BASE_ROLLUP = 2048;
  uint256 internal constant NULLIFIERS_NUM_BYTES_PER_BASE_ROLLUP = 2048;
  uint256 internal constant PUBLIC_DATA_WRITES_NUM_BYTES_PER_BASE_ROLLUP = 2048;
  uint256 internal constant CONTRACTS_NUM_BYTES_PER_BASE_ROLLUP = 32;
  uint256 internal constant CONTRACT_DATA_NUM_BYTES_PER_BASE_ROLLUP = 64;
  uint256 internal constant CONTRACT_DATA_NUM_BYTES_PER_BASE_ROLLUP_UNPADDED = 52;
  uint256 internal constant L2_TO_L1_MSGS_NUM_BYTES_PER_BASE_ROLLUP = 64;
  uint256 internal constant LOGS_HASHES_NUM_BYTES_PER_BASE_ROLLUP = 64;
  uint256 internal constant NUM_MSGS_PER_BASE_PARITY = 4;
  uint256 internal constant NUM_BASE_PARITY_PER_ROOT_PARITY = 4;
  uint256 internal constant RECURSIVE_PROOF_LENGTH = 93;
  uint256 internal constant NESTED_RECURSIVE_PROOF_LENGTH = 109;
  uint256 internal constant VERIFICATION_KEY_LENGTH_IN_FIELDS = 114;
}
