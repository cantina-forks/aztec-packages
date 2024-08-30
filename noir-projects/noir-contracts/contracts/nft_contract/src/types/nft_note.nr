use dep::aztec::{
    generators::{Ga1 as G_tid, Ga2 as G_npk, Ga3 as G_rnd, G_slot},
    note::{note_getter_options::PropertySelector, utils::compute_note_hash_for_nullify},
    keys::getters::get_nsk_app, oracle::unsafe_rand::unsafe_rand,
    prelude::{NoteInterface, NoteHeader, PrivateContext},
    protocol_types::{
    constants::GENERATOR_INDEX__NOTE_NULLIFIER, point::{Point, POINT_LENGTH},
    hash::poseidon2_hash_with_separator, traits::Serialize
}
};
use std::{embedded_curve_ops::multi_scalar_mul, hash::from_field_unsafe};

// Shows how to create a custom note

global NFT_NOTE_LEN: Field = 3;
// NFT_NOTE_LEN * 32 + 32(storage_slot as bytes) + 32(note_type_id as bytes)
global NFT_NOTE_BYTES_LEN: Field = 3 * 32 + 64;

#[aztec(note)]
struct NFTNote {
    // ID of the token
    token_id: Field,
    // The nullifying public key hash is used with the nsk_app to ensure that the note can be privately spent.
    npk_m_hash: Field,
    // Randomness of the note to hide its contents
    randomness: Field,
}

struct NFTNoteProperties {
    token_id: PropertySelector,
}

impl NoteInterface<NFT_NOTE_LEN, NFT_NOTE_BYTES_LEN> for NFTNote {
    fn compute_nullifier(self, context: &mut PrivateContext, note_hash_for_nullify: Field) -> Field {
        let secret = context.request_nsk_app(self.npk_m_hash);
        poseidon2_hash_with_separator([
            note_hash_for_nullify,
            secret
        ],
            GENERATOR_INDEX__NOTE_NULLIFIER as Field,
        )
    }

    fn compute_nullifier_without_context(self) -> Field {
        let note_hash_for_nullify = compute_note_hash_for_nullify(self);
        let secret = get_nsk_app(self.npk_m_hash);
        poseidon2_hash_with_separator([
            note_hash_for_nullify,
            secret,
        ],
            GENERATOR_INDEX__NOTE_NULLIFIER as Field,
        )
    }

    fn compute_note_hiding_point(self) -> Point {
        // We use the unsafe version because the multi_scalar_mul will constrain the scalars.
        let token_id_scalar = from_field_unsafe(self.token_id);
        let npk_m_hash_scalar = from_field_unsafe(self.npk_m_hash);
        let randomness_scalar = from_field_unsafe(self.randomness);
        let slot_scalar = from_field_unsafe(self.header.storage_slot);

        multi_scalar_mul(
            [G_tid, G_npk, G_rnd, G_slot],
            [token_id_scalar, npk_m_hash_scalar, randomness_scalar, slot_scalar]
        )
    }
}

impl NFTNote {
    pub fn new(token_id: Field, npk_m_hash: Field) -> Self {
        let randomness = unsafe {
            unsafe_rand()
        };
        NFTNote { token_id, npk_m_hash, randomness, header: NoteHeader::empty() }
    }

    pub fn properties() -> NFTNoteProperties {
        NFTNoteProperties { token_id: PropertySelector { index: 0, offset: 0, length: 32 } }
    }

    // TODO(#8290): Merge this func with `compute_note_hiding_point`
    fn to_note_hiding_point(self) -> NFTNoteHidingPoint {
        NFTNoteHidingPoint::new(self.compute_note_hiding_point())
    }
}

impl Eq for NFTNote {
    fn eq(self, other: Self) -> bool {
        (self.token_id == other.token_id) & (self.npk_m_hash == other.npk_m_hash) & (self.randomness == other.randomness)
    }
}

// TODO(#8290): Auto-generate this
struct NFTNoteHidingPoint {
  inner: Point
}

impl NFTNoteHidingPoint {
    fn new(point: Point) -> Self {
        Self { inner: point }
    }

    fn add_token_id(&mut self, token_id: Field) {
        self.inner = multi_scalar_mul([G_tid], [from_field_unsafe(token_id)]) + self.inner;
    }

    fn add_npk_m_hash(&mut self, npk_m_hash: Field) {
        self.inner = multi_scalar_mul([G_npk], [from_field_unsafe(npk_m_hash)]) + self.inner;
    }

    fn add_randomness(&mut self, randomness: Field) {
        self.inner = multi_scalar_mul([G_rnd], [from_field_unsafe(randomness)]) + self.inner;
    }

    fn add_slot(&mut self, slot: Field) {
        self.inner = multi_scalar_mul([G_slot], [from_field_unsafe(slot)]) + self.inner;
    }

    fn finalize(self) -> Field {
        self.inner.x
    }
}

impl Serialize<POINT_LENGTH> for NFTNoteHidingPoint {
    fn serialize(self) -> [Field; POINT_LENGTH] {
        self.inner.serialize()
    }
}
