use anchor_lang::prelude::*;
use light_system_program::sdk::compressed_account::PackedMerkleContext;

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct PackedInputCompressedPda {
    pub merkle_context: PackedMerkleContext,
    pub root_index: u16,
}
