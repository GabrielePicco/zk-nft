mod constants;
mod errors;
mod processor;
mod state;
mod utils;

use anchor_lang::prelude::*;
use light_system_program::invoke::processor::CompressedProof;
use processor::*;
use state::*;

declare_id!("zkNFTi24GW95YYfM8jNM2tDDPmDnDm7EQuze8jJ66sn");

#[program]
pub mod zk_nft {
    use super::*;

    pub fn create_group<'info>(ctx: Context<CreateGroup<'info>>, max_size: u64) -> Result<()> {
        processor::create_group(ctx, max_size)
    }

    pub fn create_asset<'info>(
        ctx: Context<'_, '_, '_, 'info, CreateAsset<'info>>,
        proof: CompressedProof,
        base_data_seed: [u8; 32],
        new_address_params_packed: NewAddressParams,
        blob_params: Option<BlobParams>,
        attributes_params: Option<AttributesParams>,
    ) -> Result<()> {
        processor::create_asset(
            ctx,
            proof,
            base_data_seed,
            new_address_params_packed,
            blob_params,
            attributes_params,
        )
    }

    pub fn transfer<'info>(
        ctx: Context<'_, '_, '_, 'info, Transfer<'info>>,
        proof: CompressedProof,
        asset_id: [u8; 32],
        base_data: BaseData,
        base_data_input: PackedInputCompressedPda,
    ) -> Result<()> {
        processor::transfer(ctx, proof, asset_id, base_data, base_data_input)
    }

    pub fn upload_blob(ctx: Context<UploadBlob>, index: u32, bytes: Vec<u8>) -> Result<()> {
        processor::upload_blob(ctx, index, bytes)
    }

    pub fn init_blob_upload(ctx: Context<InitBlobUpload>, _total_bytes: u32) -> Result<()> {
        processor::init_blob_upload(ctx, _total_bytes)
    }

    pub fn log_blob(ctx: Context<LogBlob>) -> Result<()> {
        processor::log_blob(ctx)
    }
}
