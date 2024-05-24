import { WitnessMap } from '@noir-lang/acvm_js';

// See `complex_brillig_foreign_call` integration test in `acir/tests/test_program_serialization.rs`.
export const bytecode = Uint8Array.from([
  31, 139, 8, 0, 0, 0, 0, 0, 0, 255, 213, 84, 75, 10, 131, 64, 12, 77, 102, 90, 43, 93, 246, 4, 133, 246, 0, 211, 158,
  192, 187, 136, 59, 69, 151, 158, 94, 116, 48, 131, 241, 233, 70, 28, 65, 3, 195, 155, 79, 62, 47, 9, 25, 166, 81, 210,
  97, 177, 236, 239, 130, 70, 208, 223, 91, 154, 75, 208, 205, 4, 221, 62, 249, 113, 60, 95, 238, 40, 142, 230, 2, 28,
  237, 1, 28, 73, 245, 255, 132, 253, 142, 217, 151, 168, 245, 179, 43, 243, 115, 163, 113, 190, 18, 57, 63, 4, 83, 44,
  180, 55, 50, 180, 28, 188, 153, 224, 196, 122, 175, 111, 112, 68, 24, 65, 50, 204, 162, 100, 249, 119, 137, 226, 193,
  16, 251, 169, 50, 204, 235, 170, 41, 139, 214, 130, 42, 82, 253, 168, 253, 23, 222, 25, 236, 58, 176, 237, 20, 234,
  207, 107, 45, 78, 184, 55, 27, 124, 191, 104, 42, 111, 40, 121, 15, 148, 238, 228, 47, 65, 5, 0, 0,
]);
export const initialWitnessMap: WitnessMap = new Map([
  [1, '0x0000000000000000000000000000000000000000000000000000000000000001'],
  [2, '0x0000000000000000000000000000000000000000000000000000000000000002'],
  [3, '0x0000000000000000000000000000000000000000000000000000000000000003'],
]);

export const oracleCallName = 'complex';
export const oracleCallInputs = [
  [
    '0x0000000000000000000000000000000000000000000000000000000000000001',
    '0x0000000000000000000000000000000000000000000000000000000000000002',
    '0x0000000000000000000000000000000000000000000000000000000000000003',
  ],
  ['0x0000000000000000000000000000000000000000000000000000000000000006'],
];

export const oracleResponse = [
  [
    '0x0000000000000000000000000000000000000000000000000000000000000002',
    '0x0000000000000000000000000000000000000000000000000000000000000006',
    '0x000000000000000000000000000000000000000000000000000000000000000c',
  ],
  '0x0000000000000000000000000000000000000000000000000000000000000006',
  '0x000000000000000000000000000000000000000000000000000000000000000c',
];

export const expectedWitnessMap = new Map([
  [1, '0x0000000000000000000000000000000000000000000000000000000000000001'],
  [2, '0x0000000000000000000000000000000000000000000000000000000000000002'],
  [3, '0x0000000000000000000000000000000000000000000000000000000000000003'],
  [4, '0x0000000000000000000000000000000000000000000000000000000000000002'],
  [5, '0x0000000000000000000000000000000000000000000000000000000000000006'],
  [6, '0x000000000000000000000000000000000000000000000000000000000000000c'],
  [7, '0x0000000000000000000000000000000000000000000000000000000000000006'],
  [8, '0x000000000000000000000000000000000000000000000000000000000000000c'],
]);
