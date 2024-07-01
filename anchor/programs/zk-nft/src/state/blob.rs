use anchor_lang::prelude::*;
use light_hasher::{errors::HasherError, Hasher};

#[derive(Debug)]
#[account]
pub struct Blob {
    pub content_type: String,
    pub tx_sig: [u8; 64],
}

impl light_hasher::DataHasher for Blob {
    fn hash<H: Hasher>(&self) -> std::result::Result<[u8; 32], HasherError> {
        let hashed_content_type =
            light_utils::hash_to_bn254_field_size_be(self.content_type.as_bytes())
                .unwrap()
                .0;
        let hashed_tx_sig = light_utils::hash_to_bn254_field_size_be(self.tx_sig.as_slice())
            .unwrap()
            .0;

        H::hashv(vec![hashed_content_type.as_slice(), hashed_tx_sig.as_slice()].as_slice())
    }
}
