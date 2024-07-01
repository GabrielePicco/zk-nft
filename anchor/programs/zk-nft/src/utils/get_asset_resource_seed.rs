use anchor_lang::prelude::*;

pub fn get_asset_resource_seed<'info>(
    resource: &[u8],
    asset_address: &[u8; 32],
) -> Result<[u8; 32]> {
    let mut hasher = anchor_lang::solana_program::hash::Hasher::default();
    hasher.hashv(&[resource, asset_address]);
    let asset_data_seed = hasher.result().to_bytes();
    Ok(asset_data_seed)
}
