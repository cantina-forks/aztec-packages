use dep::aztec::{
    prelude::{NoteInterface, NoteHeader, PrivateContext},
    note::{utils::compute_note_hash_for_nullify}, keys::getters::get_nsk_app,
    protocol_types::{
    constants::GENERATOR_INDEX__NOTE_NULLIFIER,
    hash::poseidon2_hash_with_separator,
    oracle::unsafe_rand::unsafe_rand
}
};

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
}

impl NFTNote {
    pub new(token_id: Field, npk_m_hash: Field) -> Self {
        NFTNote {
            token_id,
            npk_m_hash,
            randomness: unsafe_rand(),
            header: NoteHeader::empty(),
        }
    }

    pub fn properties() -> NFTNoteProperties {
        NFTNoteProperties {
            token_id: PropertySelector { index: 0, offset: 0, length: 32 },
        }
    }
}