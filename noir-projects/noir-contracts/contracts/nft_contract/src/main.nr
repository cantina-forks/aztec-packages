// Minimal NFT implementation with `AuthWit` support.
contract NFT {
    #[aztec(event)]
    struct Transfer {
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
        private_nfts: Map<AztecAddress, PrivateSet<NFTNote>>
        // Contains number of NFTs owned by each address in public.
        public_balances: Map<AztecAddress, PublicMutable<U128>>,
        // A map from token ID to a boolean indicating if the NFT exists.
        nft_exists: Map<Field, PublicMutable<bool>>,
        // A map from token ID to the public owner of the NFT.
        public_owners: Map<Field, PublicMutable<AztecAddress>>,
        // Contains the NFTs that are pending to be shielded.
        pending_shields: PrivateSet<TransparentNote>,
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
        // assert the token_id does not exist yet and mint
        ...
    }

    #[aztec(public)]
    fn mint_private(token_id: Field, secret_hash: Field) {
        assert(storage.minters.at(context.msg_sender()).read(), "caller is not minter");
        let pending_shields = storage.pending_shields;
        let mut note = TransparentNote::new(token_id, secret_hash);
        pending_shields.insert_from_public(&mut note);
        // set that the nft exists
        ...
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

    // Returns the total number of NFTs a given address owns in public.
    #[aztec(public)]
    #[aztec(view)]
    fn balance_of_public(owner: AztecAddress) -> Field {
        storage.public_balances.at(owner).read().to_integer()
    }

    #[aztec(public)]
    fn transfer_public(from: AztecAddress, to: AztecAddress, token_id: Field, nonce: Field) {
        if (!from.eq(context.msg_sender())) {
            assert_current_call_valid_authwit_public(&mut context, from);
        } else {
            assert(nonce == 0, "invalid nonce");
        }

        ...
    }

    #[aztec(private)]
    fn transfer(to: AztecAddress, token_id: Field) {
        ...
    }

    #[aztec(private)]
    fn transfer_from(from: AztecAddress, to: AztecAddress, token_id: Field, nonce: Field) {
        ...
    }

    #[aztec(private)]
    fn burn(from: AztecAddress, token_id: Field, nonce: Field) {
        if (!from.eq(context.msg_sender())) {
            assert_current_call_valid_authwit(&mut context, from);
        } else {
            assert(nonce == 0, "invalid nonce");
        }

        ...
    }

    // Returns zero address when the token does not have public owner. Reverts if the token does not exist.
    #[aztec(public)]
    #[aztec(view)]
    fn owner_of(token_id: Field) -> AztecAddress {
        storage.public_owners.at(token_id).read()
    }

    // Returns the total number of NFTs a given address owns in private.
    unconstrained fn balance_of_private(owner: AztecAddress) -> pub Field {
        ...
    }

    unconstrained fn token_uri(token_id: Field) -> pub str<URI_LENGTH> {
        // concatenate the base URI with the token ID and return it
        ...
    }
}