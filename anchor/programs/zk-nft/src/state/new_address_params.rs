use anchor_lang::prelude::*;

#[derive(Debug, PartialEq, Default, Clone, Copy, AnchorSerialize, AnchorDeserialize)]
pub struct NewAddressParams {
    pub address_queue_account_index: u8,
    pub address_merkle_tree_account_index: u8,
    pub address_merkle_tree_root_index: u16,
}
