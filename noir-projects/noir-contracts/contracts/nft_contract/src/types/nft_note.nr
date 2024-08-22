#[aztec(note)]
struct NFTNote {
    // The amount of tokens in the note
    token_id: Field,
    // The nullifying public key hash is used with the nsk_app to ensure that the note can be privately spent.
    npk_m_hash: Field,
    // Randomness of the note to hide its contents
    randomness: Field,
}