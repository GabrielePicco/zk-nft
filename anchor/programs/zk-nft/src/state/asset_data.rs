use anchor_lang::prelude::*;
use light_hasher::{errors::HasherError, Hasher};

#[derive(Debug)]
#[account]
pub struct AssetData {
    pub mutable: bool,
    pub group: Option<Pubkey>,
    pub authority: Option<Pubkey>,

    pub has_attributes: bool,
    pub has_blob: bool,
}

impl light_hasher::DataHasher for AssetData {
    fn hash<H: Hasher>(&self) -> std::result::Result<[u8; 32], HasherError> {
        let mut hash_inputs = Vec::new();

        let mutable_bytes = [self.mutable as u8];
        hash_inputs.push(&mutable_bytes[..]);

        let hashed_group;
        if let Some(group) = &self.group {
            hashed_group = light_utils::hash_to_bn254_field_size_be(group.to_bytes().as_slice())
                .unwrap()
                .0;
            hash_inputs.push(hashed_group.as_slice());
        };

        let hashed_authority;
        if let Some(authority) = &self.authority {
            hashed_authority =
                light_utils::hash_to_bn254_field_size_be(authority.to_bytes().as_slice())
                    .unwrap()
                    .0;
            hash_inputs.push(hashed_authority.as_slice());
        };

        let has_attributes_bytes = [self.has_attributes as u8];
        hash_inputs.push(&has_attributes_bytes[..]);

        let has_blob_bytes = [self.has_blob as u8];
        hash_inputs.push(&has_blob_bytes[..]);

        H::hashv(hash_inputs.as_slice())
    }
}
