mod types;

// Minimal NFT implementation with `AuthWit` support that allows minting in public-only and transfers in both public
// and private.
contract NFT {
    use dep::compressed_string::FieldCompressedString;
    use dep::aztec::{
        prelude::{NoteGetterOptions, Map, PublicMutable, SharedImmutable, PrivateSet, AztecAddress},
        encrypted_logs::{encrypted_note_emission::encode_and_encrypt_note_with_keys},
        keys::getters::get_current_public_keys, protocol_types::traits::is_empty
    };
    use dep::authwit::auth::{assert_current_call_valid_authwit, assert_current_call_valid_authwit_public, compute_authwit_nullifier};
    use crate::types::nft_note::{NFTNote, NFTNoteHidingPoint};

    global POINT_TRANSIENT_STORAGE_SLOT = 6000;
    global FINALIZER_TRANSIENT_STORAGE_SLOT = 7000;

    // TODO: Rename this to Transfer - calling this Transfer2 to avoid export conflict with the Transfer event in
    // the Token contract
    #[aztec(event)]
    struct Transfer2 {
        from: AztecAddress,
        to: AztecAddress,
        token_id: Field,
    }

    #[aztec(storage)]
    struct Storage {
        // The symbol of the NFT
        symbol: SharedImmutable<FieldCompressedString>,
        // The name of the NFT
        name: SharedImmutable<FieldCompressedString>,
        // The admin of the contract
        admin: PublicMutable<AztecAddress>,
        // Addresses that can mint
        minters: Map<AztecAddress, PublicMutable<bool>>,
        // Contains the NFTs owned by each address in private.
        private_nfts: Map<AztecAddress, PrivateSet<NFTNote>>,
        // A map from token ID to a boolean indicating if the NFT exists.
        nft_exists: Map<Field, PublicMutable<bool>>,
        // A map from token ID to the public owner of the NFT.
        public_owners: Map<Field, PublicMutable<AztecAddress>>,
    }

    #[aztec(public)]
    #[aztec(initializer)]
    fn constructor(admin: AztecAddress, name: str<31>, symbol: str<31>, decimals: u8) {
        assert(!admin.is_zero(), "invalid admin");
        storage.admin.write(admin);
        storage.minters.at(admin).write(true);
        storage.name.initialize(FieldCompressedString::from_string(name));
        storage.symbol.initialize(FieldCompressedString::from_string(symbol));
    }

    #[aztec(public)]
    fn set_admin(new_admin: AztecAddress) {
        assert(storage.admin.read().eq(context.msg_sender()), "caller is not admin");
        storage.admin.write(new_admin);
    }

    #[aztec(public)]
    fn set_minter(minter: AztecAddress, approve: bool) {
        assert(storage.admin.read().eq(context.msg_sender()), "caller is not admin");
        storage.minters.at(minter).write(approve);
    }

    #[aztec(public)]
    fn mint_public(to: AztecAddress, token_id: Field) {
        assert(storage.minters.at(context.msg_sender()).read(), "caller is not minter");
        assert(storage.nft_exists.at(token_id).read() == false, "token already exists");

        storage.nft_exists.at(token_id).write(true);

        storage.public_owners.at(token_id).write(to);
    }

    #[aztec(public)]
    #[aztec(view)]
    fn public_get_name() -> pub FieldCompressedString {
        storage.name.read_public()
    }

    #[aztec(private)]
    #[aztec(view)]
    fn private_get_name() -> pub FieldCompressedString {
        storage.name.read_private()
    }

    #[aztec(public)]
    #[aztec(view)]
    fn public_get_symbol() -> pub FieldCompressedString {
        storage.symbol.read_public()
    }

    #[aztec(private)]
    #[aztec(view)]
    fn private_get_symbol() -> pub FieldCompressedString {
        storage.symbol.read_private()
    }

    #[aztec(public)]
    #[aztec(view)]
    fn admin() -> Field {
        storage.admin.read().to_field()
    }

    #[aztec(public)]
    #[aztec(view)]
    fn is_minter(minter: AztecAddress) -> bool {
        storage.minters.at(minter).read()
    }

    #[aztec(public)]
    fn transfer_public(from: AztecAddress, to: AztecAddress, token_id: Field, nonce: Field) {
        if (!from.eq(context.msg_sender())) {
            assert_current_call_valid_authwit_public(&mut context, from);
        } else {
            assert(nonce == 0, "invalid nonce");
        }

        let public_owner = storage.public_owners.at(token_id).read();
        assert(public_owner.eq(from), "invalid owner");

        storage.public_owners.at(token_id).write(to);
    }

    #[aztec(private)]
    fn prepare_shield(from: AztecAddress, token_id: Field, finalizer: AztecAddress, nonce: Field) {
        if (!from.eq(context.msg_sender())) {
            assert_current_call_valid_authwit(&mut context, from);
        } else {
            assert(nonce == 0, "invalid nonce");
        }
        // We create a partial NFT note with unpopulated/zero token id
        let from_npk_m_hash = get_current_public_keys(&mut context, from).npk_m.hash();
        let hiding_point = NFTNoteHidingPoint::new(from_npk_m_hash);
        NFT::at(context.this_address()).set_transient_storage(hiding_point, finalizer).enqueue(&mut context);
    }

    #[aztec(public)]
    #[aztec(internal)]
    fn set_transient_storage(point: NFTNoteHidingPoint, finalizer: AztecAddress) {
        let previous_point_value: NFTNoteHidingPoint = context.storage_read(POINT_TRANSIENT_STORAGE_SLOT);
        let previous_finalizer: AztecAddress = context.storage_read(FINALIZER_TRANSIENT_STORAGE_SLOT);
        assert(is_empty(previous_point_value), "non-zero point transient storage");
        assert(previous_finalizer.is_zero(), "non-zero finalizer transient storage");

        context.storage_write(POINT_TRANSIENT_STORAGE_SLOT, point);
        context.storage_write(FINALIZER_TRANSIENT_STORAGE_SLOT, finalizer);
    }

    #[aztec(public)]
    fn send_to_shield(from: AztecAddress, token_id: Field, nonce: Field) {
        // Perform authwit, owner and finalizer checks
        if (!from.eq(context.msg_sender())) {
            assert_current_call_valid_authwit_public(&mut context, from);
        } else {
            assert(nonce == 0, "invalid nonce");
        }

        let current_owner = storage.public_owners.at(token_id).read();
        assert(current_owner.eq(from), "invalid NFT owner");

        let expected_finalizer: AztecAddress = context.storage_read(FINALIZER_TRANSIENT_STORAGE_SLOT);
        assert(expected_finalizer.eq(from), "invalid finalizer");

        // Set the original NFT owner to zero
        storage.public_owners.at(token_id).write(AztecAddress::zero());

        // Read the NFT hiding point from "transient" storage and add the token ID to it
        let mut hiding_point: NFTNoteHidingPoint = context.storage_read(POINT_TRANSIENT_STORAGE_SLOT);
        hiding_point.add_token_id(token_id);

        // Insert the finalized note
        let note_hash = hiding_point.finalize();
        context.push_note_hash(note_hash);

        // At last we reset the values to zero to achieve the effect of transient storage - kernels will squash the writes
        context.storage_write(POINT_TRANSIENT_STORAGE_SLOT, NFTNoteHidingPoint::empty());
        context.storage_write(FINALIZER_TRANSIENT_STORAGE_SLOT, AztecAddress::zero());
    }

    /**
     * Cancel a private authentication witness.
     * @param inner_hash The inner hash of the authwit to cancel.
     */
    #[aztec(private)]
    fn cancel_authwit(inner_hash: Field) {
        let on_behalf_of = context.msg_sender();
        let nullifier = compute_authwit_nullifier(on_behalf_of, inner_hash);
        context.push_nullifier(nullifier);
    }

    #[aztec(private)]
    fn transfer_from(from: AztecAddress, to: AztecAddress, token_id: Field, nonce: Field) {
        if (!from.eq(context.msg_sender())) {
            assert_current_call_valid_authwit(&mut context, from);
        } else {
            assert(nonce == 0, "invalid nonce");
        }

        let nfts = storage.private_nfts;

        let mut options = NoteGetterOptions::new();
        options = options.select(NFTNote::properties().token_id, token_id, Option::none()).set_limit(1);
        let notes = nfts.at(from).pop_notes(options);
        assert(notes.len() == 1, "NFT not found");

        let from_ovpk_m = get_current_public_keys(&mut context, from).ovpk_m;
        let to_keys = get_current_public_keys(&mut context, to);

        let note = NFTNote::new(token_id, to_keys.npk_m.hash());
        nfts.at(to).insert(&mut note).emit(encode_and_encrypt_note_with_keys(&mut context, from_ovpk_m, to_keys.ivpk_m, to));
    }

    #[aztec(private)]
    fn unshield(from: AztecAddress, to: AztecAddress, amount: Field, nonce: Field) {
        if (!from.eq(context.msg_sender())) {
            assert_current_call_valid_authwit(&mut context, from);
        } else {
            assert(nonce == 0, "invalid nonce");
        }
        // ...
    }

    // Returns zero address when the token does not have public owner. Reverts if the token does not exist.
    #[aztec(public)]
    #[aztec(view)]
    fn owner_of(token_id: Field) -> AztecAddress {
        storage.public_owners.at(token_id).read()
    }
    // // Returns the total number of NFTs a given address owns in private.
    // unconstrained fn balance_of_private(owner: AztecAddress) -> pub Field {
    //     ...
    // }
    // unconstrained fn token_uri(token_id: Field) -> pub str<URI_LENGTH> {
    //     // concatenate the base URI with the token ID and return it
    //     ...
    // }
}
