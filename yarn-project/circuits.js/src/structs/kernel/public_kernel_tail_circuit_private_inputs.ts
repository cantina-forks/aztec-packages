import { BufferReader, type Tuple, serializeToBuffer } from '@aztec/foundation/serialize';

import { MAX_NULLIFIER_READ_REQUESTS_PER_TX, MAX_PUBLIC_DATA_HINTS } from '../../constants.gen.js';
import {
  type NullifierNonExistentReadRequestHints,
  nullifierNonExistentReadRequestHintsFromBuffer,
} from '../non_existent_read_request_hints.js';
import { PartialStateReference } from '../partial_state_reference.js';
import { PublicDataLeafHint } from '../public_data_leaf_hint.js';
import { type NullifierReadRequestHints, nullifierReadRequestHintsFromBuffer } from '../read_request_hints/index.js';
import { PublicKernelData } from './public_kernel_data.js';

export class PublicKernelTailCircuitPrivateInputs {
  constructor(
    /**
     * Kernels are recursive and this is the data from the previous kernel.
     */
    public readonly previousKernel: PublicKernelData,
    /**
     * Contains hints for the nullifier read requests to locate corresponding pending or settled nullifiers.
     */
    public readonly nullifierReadRequestHints: NullifierReadRequestHints<
      typeof MAX_NULLIFIER_READ_REQUESTS_PER_TX,
      typeof MAX_NULLIFIER_READ_REQUESTS_PER_TX
    >,
    /**
     * Contains hints for the nullifier non existent read requests.
     */
    public readonly nullifierNonExistentReadRequestHints: NullifierNonExistentReadRequestHints,
    public readonly publicDataHints: Tuple<PublicDataLeafHint, typeof MAX_PUBLIC_DATA_HINTS>,
    public readonly startState: PartialStateReference,
  ) {}

  toBuffer() {
    return serializeToBuffer(
      this.previousKernel,
      this.nullifierReadRequestHints,
      this.nullifierNonExistentReadRequestHints,
      this.publicDataHints,
      this.startState,
    );
  }

  toString() {
    return this.toBuffer().toString('hex');
  }

  static fromString(str: string) {
    return PublicKernelTailCircuitPrivateInputs.fromBuffer(Buffer.from(str, 'hex'));
  }

  static fromBuffer(buffer: Buffer | BufferReader) {
    const reader = BufferReader.asReader(buffer);
    return new PublicKernelTailCircuitPrivateInputs(
      reader.readObject(PublicKernelData),
      nullifierReadRequestHintsFromBuffer(
        reader,
        MAX_NULLIFIER_READ_REQUESTS_PER_TX,
        MAX_NULLIFIER_READ_REQUESTS_PER_TX,
      ),
      nullifierNonExistentReadRequestHintsFromBuffer(reader),
      reader.readArray(MAX_PUBLIC_DATA_HINTS, PublicDataLeafHint),
      reader.readObject(PartialStateReference),
    );
  }

  clone() {
    return PublicKernelTailCircuitPrivateInputs.fromBuffer(this.toBuffer());
  }
}
