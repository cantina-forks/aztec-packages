mod types;

// Minimal NFT implementation with `AuthWit` support that allows minting in public-only and transfers in both public
// and private.
contract NFT {
    use dep::compressed_string::FieldCompressedString;
    use dep::aztec::{
        prelude::{NoteGetterOptions, NoteViewerOptions, Map, PublicMutable, SharedImmutable, PrivateSet, AztecAddress},
        encrypted_logs::{encrypted_note_emission::encode_and_encrypt_note_with_keys},
        hash::pedersen_hash, keys::getters::get_current_public_keys,
        note::constants::MAX_NOTES_PER_PAGE, protocol_types::traits::is_empty
    };
    use dep::authwit::auth::{assert_current_call_valid_authwit, assert_current_call_valid_authwit_public, compute_authwit_nullifier};
    use crate::types::nft_note::{NFTNote, NFTNoteHidingPoint};

    global TRANSIENT_STORAGE_SLOT_PEDERSEN_INDEX = 3;

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
    fn constructor(admin: AztecAddress, name: str<31>, symbol: str<31>) {
        assert(!admin.is_zero(), "invalid admin");
        storage.admin.write(admin);
        storage.minters.at(admin).write(true);
        storage.name.initialize(FieldCompressedString::from_string(name));
        storage.symbol.initialize(FieldCompressedString::from_string(symbol));
    }

    #[aztec(public)]
    fn set_admin(new_admin: AztecAddress) {
        assert(storage.admin.read().eq(context.msg_sender()), "caller is not an admin");
        storage.admin.write(new_admin);
    }

    #[aztec(public)]
    fn set_minter(minter: AztecAddress, approve: bool) {
        assert(storage.admin.read().eq(context.msg_sender()), "caller is not an admin");
        storage.minters.at(minter).write(approve);
    }

    #[aztec(public)]
    fn mint(to: AztecAddress, token_id: Field) {
        assert(token_id != 0, "zero token ID not supported");
        assert(storage.minters.at(context.msg_sender()).read(), "caller is not a minter");
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

    // We have only public burn flow because the flow is not that common for it to be worth it to clutter
    // the contract with a private one.
    #[aztec(public)]
    fn burn(from: AztecAddress, token_id: Field, nonce: Field) {
        if (!from.eq(context.msg_sender())) {
            assert_current_call_valid_authwit_public(&mut context, from);
        } else {
            assert(nonce == 0, "invalid nonce");
        }

        let public_owner = storage.public_owners.at(token_id).read();
        assert(public_owner.eq(from), "invalid owner");

        storage.nft_exists.at(token_id).write(false);
        storage.public_owners.at(token_id).write(AztecAddress::zero());
    }

    /// Prepares a shield partial note which can later on be finalized by the `finalizer`.
    // TODO(#8238): Remove the `note_randomness` argument below once we have partial notes delivery (then we can just
    // fetch the randomness from oracle).
    #[aztec(private)]
    fn prepare_shield(
        finalizer: AztecAddress,
        note_randomness: Field,
        transient_storage_slot_randomness: Field
    ) {
        // We create a partial NFT note with unpopulated/zero token id for msg_sender
        let shield_owner = context.msg_sender();
        let shield_owner_npk_m_hash = get_current_public_keys(&mut context, shield_owner).npk_m.hash();
        let shield_note_slot = storage.private_nfts.at(shield_owner).storage_slot;
        let hiding_point = NFTNoteHidingPoint::new(shield_owner_npk_m_hash, shield_note_slot, note_randomness);

        // We make the owner part of the slot preimage to ensure he cannot interfere with non-owner's slots
        let owner_storage_slot_commitment: Field = pedersen_hash(
            [shield_owner.to_field(), transient_storage_slot_randomness],
            TRANSIENT_STORAGE_SLOT_PEDERSEN_INDEX
        );
        // Then we hash the owner storage slot commitment with finalizer and use that as the final shield slot
        // --> by hashing it with a finalizer we ensure that finalizer cannot interfere with slots not assigned to him.
        let slot: Field = pedersen_hash(
            [finalizer.to_field(), owner_storage_slot_commitment],
            TRANSIENT_STORAGE_SLOT_PEDERSEN_INDEX
        );

        NFT::at(context.this_address()).store_shield_in_transient_storage(hiding_point, slot).enqueue(&mut context);
    }

    #[aztec(public)]
    #[aztec(internal)]
    fn store_shield_in_transient_storage(point: NFTNoteHidingPoint, slot: Field) {
        // We don't perform check for the overwritten value to be non-zero because the slots are siloed to the shield
        // owner and hence the owner can interfere only with his own execution.
        context.storage_write(slot, point);
    }

    #[aztec(public)]
    fn send_to_shield(
        from: AztecAddress,
        token_id: Field,
        owner_storage_slot_commitment: Field,
        nonce: Field
    ) {
        // Perform authwit, owner and prepared shield checks
        if (!from.eq(context.msg_sender())) {
            assert_current_call_valid_authwit_public(&mut context, from);
        } else {
            assert(nonce == 0, "invalid nonce");
        }

        let current_owner = storage.public_owners.at(token_id).read();
        assert(current_owner.eq(from), "invalid NFT owner");

        // Derive the shield slot from the owner storage slot commitment and the finalizer address (declared
        // as `from` in this function)
        let shield_slot = pedersen_hash(
            [from.to_field(), owner_storage_slot_commitment],
            TRANSIENT_STORAGE_SLOT_PEDERSEN_INDEX
        );

        // Read the hiding point from "transient" storage and check it's not empty to ensure the shield was prepared
        let mut hiding_point: NFTNoteHidingPoint = context.storage_read(shield_slot);
        assert(!is_empty(hiding_point), "shield not prepared");

        // Set the original NFT owner to zero
        storage.public_owners.at(token_id).write(AztecAddress::zero());

        // Read the NFT hiding point from "transient" storage and add the token ID to it
        hiding_point.add_token_id(token_id);

        // Insert the finalized note
        let note_hash = hiding_point.finalize();
        context.push_note_hash(note_hash);

        // At last we reset the shield to zero to achieve the effect of transient storage - kernels will squash the writes
        context.storage_write(shield_slot, NFTNoteHidingPoint::empty());
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
        assert(notes.len() == 1, "NFT not found when transferring");

        let from_ovpk_m = get_current_public_keys(&mut context, from).ovpk_m;
        let to_keys = get_current_public_keys(&mut context, to);

        let note = NFTNote::new(token_id, to_keys.npk_m.hash());
        nfts.at(to).insert(&mut note).emit(encode_and_encrypt_note_with_keys(&mut context, from_ovpk_m, to_keys.ivpk_m, to));
    }

    #[aztec(private)]
    fn unshield(from: AztecAddress, to: AztecAddress, token_id: Field, nonce: Field) {
        if (!from.eq(context.msg_sender())) {
            assert_current_call_valid_authwit(&mut context, from);
        } else {
            assert(nonce == 0, "invalid nonce");
        }

        let mut options = NoteGetterOptions::new();
        options = options.select(NFTNote::properties().token_id, token_id, Option::none()).set_limit(1);
        let notes = storage.private_nfts.at(from).pop_notes(options);
        assert(notes.len() == 1, "NFT not found when unshielding");

        NFT::at(context.this_address())._finish_unshield(to, token_id).enqueue(&mut context);
    }

    #[aztec(public)]
    #[aztec(internal)]
    fn _finish_unshield(to: AztecAddress, token_id: Field) {
        storage.public_owners.at(token_id).write(to);
    }

    // Returns zero address when the token does not have a public owner. Reverts if the token does not exist.
    #[aztec(public)]
    #[aztec(view)]
    fn owner_of(token_id: Field) -> AztecAddress {
        assert(storage.nft_exists.at(token_id).read(), "token does not exist");
        storage.public_owners.at(token_id).read()
    }

    /// Returns an array of token IDs owned by `owner` in private and a flag indicating whether a page limit was
    /// reached. Starts getting the notes from page with index `page_index`. Zero values in the array are placeholder
    /// values for non-existing notes.
    unconstrained fn get_private_nfts(
        owner: AztecAddress,
        page_index: u32
    ) -> pub ([Field; MAX_NOTES_PER_PAGE], bool) {
        let offset = page_index * MAX_NOTES_PER_PAGE;
        let mut options = NoteViewerOptions::new();
        let notes = storage.private_nfts.at(owner).view_notes(options.set_offset(offset));

        let mut owned_nft_ids = [0; MAX_NOTES_PER_PAGE];
        for i in 0..options.limit {
            if i < notes.len() {
                owned_nft_ids[i] = notes.get_unchecked(i).token_id;
            }
        }

        let page_limit_reached = notes.len() == options.limit;
        (owned_nft_ids, page_limit_reached)
    }
}
