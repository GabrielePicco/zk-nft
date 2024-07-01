use anchor_lang::prelude::*;
use light_hasher::{errors::HasherError, Hasher};

#[derive(Debug)]
#[account]
pub struct Attributes {
    pub group: Option<Pubkey>,
    pub attributes: Vec<Attribute>,
}

#[derive(Debug)]
#[account]
pub struct Attribute {
    pub trait_type: String,
    pub value: String,
}

impl light_hasher::DataHasher for Attributes {
    fn hash<H: Hasher>(&self) -> std::result::Result<[u8; 32], HasherError> {
        let mut attributes_hashes: Vec<[u8; 32]> = Vec::new();
        for attribute in &self.attributes {
            let hashed_trait_type =
                light_utils::hash_to_bn254_field_size_be(attribute.trait_type.as_bytes())
                    .unwrap()
                    .0;
            let hashed_value = light_utils::hash_to_bn254_field_size_be(attribute.value.as_bytes())
                .unwrap()
                .0;
            attributes_hashes.push(hashed_trait_type);
            attributes_hashes.push(hashed_value);
        }
        let mut hash_inputs = attributes_hashes
            .iter()
            .map(|hash| hash.as_slice())
            .collect::<Vec<&[u8]>>();

        let hashed_group;
        if let Some(group) = &self.group {
            hashed_group = light_utils::hash_to_bn254_field_size_be(group.to_bytes().as_slice())
                .unwrap()
                .0;
            hash_inputs.push(hashed_group.as_slice());
        };

        H::hashv(&hash_inputs.as_slice())
    }
}
