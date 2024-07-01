use crate::constants::CPI_AUTHORITY_SEED;
use crate::errors::ZkNftError;
use crate::state::{AssetData, Blob, NewAddressParams, PackedInputCompressedPda};
use crate::utils::get_asset_resource_seed;
use account_compression::{program::AccountCompression, RegisteredProgram};
use anchor_lang::{prelude::*, Discriminator};
use light_hasher::{DataHasher, Poseidon};
use light_sdk::traits::*;
use light_sdk::verify::verify;
use light_sdk::{light_accounts, LightTraits};
use light_system_program::sdk::compressed_account::PackedCompressedAccountWithMerkleContext;
use light_system_program::InstructionDataInvokeCpi;
use light_system_program::{
    invoke::processor::CompressedProof,
    invoke_cpi::account::CpiContextAccount,
    program::LightSystemProgram,
    sdk::{
        address::derive_address,
        compressed_account::{CompressedAccount, CompressedAccountData},
    },
    NewAddressParamsPacked, OutputCompressedAccountWithPackedContext,
};

pub fn create_blob<'info>(
    ctx: Context<'_, '_, '_, 'info, CreateBlob<'info>>,
    asset_address: [u8; 32],
    asset_data: AssetData,
    blob: Blob,
    proof: CompressedProof,
    asset_data_input: PackedInputCompressedPda,
    blob_address_params: NewAddressParams,
) -> Result<()> {
    require!(asset_data.mutable, ZkNftError::AssetNotMutable);
    require_keys_eq!(asset_data.authority.unwrap(), ctx.accounts.authority.key());

    let asset_data_seed = get_asset_resource_seed(b"asset_data", &asset_address)?;
    let asset_data_address = derive_address(
        &ctx.remaining_accounts[blob_address_params.address_merkle_tree_account_index as usize]
            .key(),
        &asset_data_seed,
    )
    .map_err(|_| ProgramError::InvalidArgument)?;

    let (old_state, new_state) = get_old_and_new_asset_data_compressed_pda(
        asset_data_address,
        asset_data,
        &asset_data_input,
    )?;

    let blob_seed = get_asset_resource_seed(b"blob", &asset_address)?;
    let blob_address = derive_address(
        &ctx.remaining_accounts[blob_address_params.address_merkle_tree_account_index as usize]
            .key(),
        &blob_seed,
    )
    .map_err(|_| ProgramError::InvalidArgument)?;

    let blob_compressed_pda = get_blob_compressed_pda(blob_address, blob, asset_data_input)?;

    // make light system program cpi
    let bump_seed = &[254];
    let signer_seeds: [&[u8]; 2] = [CPI_AUTHORITY_SEED.as_bytes(), bump_seed];
    let inputs_struct = InstructionDataInvokeCpi {
        proof: Some(proof),
        new_address_params: vec![NewAddressParamsPacked {
            seed: blob_seed,
            address_merkle_tree_account_index: blob_address_params
                .address_merkle_tree_account_index,
            address_queue_account_index: blob_address_params.address_queue_account_index,
            address_merkle_tree_root_index: blob_address_params.address_merkle_tree_root_index,
        }],
        relay_fee: None,
        input_compressed_accounts_with_merkle_context: vec![old_state],
        output_compressed_accounts: vec![blob_compressed_pda, new_state],
        compress_or_decompress_lamports: None,
        is_compress: false,
        signer_seeds: signer_seeds
            .iter()
            .map(|x| x.to_vec())
            .collect::<Vec<Vec<u8>>>(),
        cpi_context: None,
    };

    verify(ctx, &inputs_struct, &[&signer_seeds])?;

    Ok(())
}

fn get_old_and_new_asset_data_compressed_pda<'info>(
    asset_data_address: [u8; 32],
    old_asset_data: AssetData,
    asset_data_input: &PackedInputCompressedPda,
) -> Result<(
    PackedCompressedAccountWithMerkleContext,
    OutputCompressedAccountWithPackedContext,
)> {
    // restore old asset data
    let old_compressed_account_data = CompressedAccountData {
        discriminator: AssetData::discriminator(),
        data: old_asset_data.try_to_vec().unwrap(),
        data_hash: old_asset_data
            .hash::<Poseidon>()
            .map_err(ProgramError::from)?,
    };
    let old_compressed_account = OutputCompressedAccountWithPackedContext {
        compressed_account: CompressedAccount {
            owner: crate::ID,
            lamports: 0,
            address: Some(asset_data_address),
            data: Some(old_compressed_account_data),
        },
        merkle_tree_index: asset_data_input.merkle_context.merkle_tree_pubkey_index,
    };
    let old_compressed_account_with_context = PackedCompressedAccountWithMerkleContext {
        compressed_account: old_compressed_account.compressed_account,
        merkle_context: asset_data_input.merkle_context,
        root_index: asset_data_input.root_index,
    };

    // get new asset data
    let new_asset_data = AssetData {
        authority: Some(old_asset_data.authority.unwrap()),
        mutable: old_asset_data.mutable,
        group: old_asset_data.group,
        has_attributes: old_asset_data.has_attributes,
        has_blob: true,
    };
    let new_compressed_account_data = CompressedAccountData {
        discriminator: AssetData::discriminator(),
        data: new_asset_data.try_to_vec().unwrap(),
        data_hash: new_asset_data
            .hash::<Poseidon>()
            .map_err(ProgramError::from)?,
    };
    let new_state = OutputCompressedAccountWithPackedContext {
        compressed_account: CompressedAccount {
            owner: crate::ID,
            lamports: 0,
            address: Some(asset_data_address),
            data: Some(new_compressed_account_data),
        },
        merkle_tree_index: asset_data_input.merkle_context.merkle_tree_pubkey_index,
    };

    Ok((old_compressed_account_with_context, new_state))
}

fn get_blob_compressed_pda<'info>(
    blob_address: [u8; 32],
    blob: Blob,
    asset_data_input: PackedInputCompressedPda,
) -> Result<OutputCompressedAccountWithPackedContext> {
    let compressed_account_data = CompressedAccountData {
        discriminator: Blob::discriminator(),
        data: blob.try_to_vec().unwrap(),
        data_hash: blob.hash::<Poseidon>().map_err(ProgramError::from)?,
    };
    let compressed_pda = OutputCompressedAccountWithPackedContext {
        compressed_account: CompressedAccount {
            owner: crate::ID,
            lamports: 0,
            address: Some(blob_address),
            data: Some(compressed_account_data),
        },
        merkle_tree_index: asset_data_input.merkle_context.merkle_tree_pubkey_index,
    };

    Ok(compressed_pda)
}

#[light_accounts]
#[event_cpi]
#[derive(Accounts, LightTraits)]
pub struct CreateBlob<'info> {
    #[account(mut)]
    #[fee_payer]
    pub payer: Signer<'info>,
    pub authority: Signer<'info>,

    #[authority]
    #[account(
        seeds = [CPI_AUTHORITY_SEED.as_bytes()],
        bump = 254,
    )]
    pub cpi_authority_pda: SystemAccount<'info>,
    #[self_program]
    pub self_program: Program<'info, crate::program::ZkNft>,
}
