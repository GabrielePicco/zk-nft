use std::vec;

use crate::errors::ZkNftError;
use crate::state::{AssetData, BaseData, DelegateRole, Group, OwnerUpdatedEvent};
use crate::utils::get_asset_resource_seed;
use crate::{constants::CPI_AUTHORITY_SEED, state::State};
use crate::{Attribute, Attributes, Blob, NewAddressParams};
use account_compression::{program::AccountCompression, RegisteredProgram};
use anchor_lang::{prelude::*, Discriminator};
use light_hasher::{DataHasher, Poseidon};
use light_sdk::traits::*;
use light_sdk::verify::{invoke_cpi, setup_cpi_accounts};
use light_sdk::{light_accounts, LightTraits};
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

pub fn create_asset<'info>(
    ctx: Context<'_, '_, '_, 'info, CreateAsset<'info>>,
    proof: CompressedProof,
    base_data_seed: [u8; 32],
    new_address_params_packed: NewAddressParams,
    blob_params: Option<BlobParams>,
    attributes_params: Option<AttributesParams>,
) -> Result<()> {
    if let Some(group) = &mut ctx.accounts.group {
        require_keys_eq!(
            group.authority,
            ctx.accounts.group_authority.clone().unwrap().key()
        );
        if group.max_size > 0 && group.size >= group.max_size {
            return Err(ZkNftError::GroupMaxSizeExceeded.into());
        }

        group.size = group.size.checked_add(1).unwrap();
    }

    if let Some(authority) = &ctx.accounts.authority {
        if let Some(group_authority) = &ctx.accounts.group_authority {
            require_keys_eq!(group_authority.key(), authority.key());
        }
    }

    let asset_id = derive_address(
        &ctx.remaining_accounts
            [new_address_params_packed.address_merkle_tree_account_index as usize]
            .key(),
        &base_data_seed,
    )
    .map_err(|_| ProgramError::InvalidArgument)?;

    emit_cpi!(OwnerUpdatedEvent {
        asset_id: asset_id.into(),
        owner: *ctx.accounts.recipient.key,
    });

    create_compressed_pdas(
        &ctx,
        proof,
        new_address_params_packed,
        asset_id,
        base_data_seed,
        blob_params,
        attributes_params,
    )?;

    Ok(())
}

fn create_compressed_pdas<'info>(
    ctx: &Context<'_, '_, '_, 'info, CreateAsset<'info>>,
    proof: CompressedProof,
    new_address_params_packed: NewAddressParams,
    asset_id: [u8; 32],
    base_data_seed: [u8; 32],
    blob_params: Option<BlobParams>,
    attributes_params: Option<AttributesParams>,
) -> Result<()> {
    let mut new_address_params: Vec<NewAddressParamsPacked> = Vec::new();
    let mut output_compressed_accounts: Vec<OutputCompressedAccountWithPackedContext> = Vec::new();

    // create base data
    let base_data = BaseData {
        owner: ctx.accounts.recipient.key(),
        state: State::Unlocked,
        delegate: None,
        delegate_role: DelegateRole::All,
    };

    let base_data_compressed_account_data = CompressedAccountData {
        discriminator: BaseData::discriminator(),
        data: base_data.try_to_vec().unwrap(),
        data_hash: base_data.hash::<Poseidon>().map_err(ProgramError::from)?,
    };

    let base_data_compressed_pda = OutputCompressedAccountWithPackedContext {
        compressed_account: CompressedAccount {
            owner: crate::ID,
            lamports: 0,
            address: Some(asset_id),
            data: Some(base_data_compressed_account_data),
        },
        merkle_tree_index: 0,
    };

    new_address_params.push(NewAddressParamsPacked {
        seed: base_data_seed,
        address_merkle_tree_account_index: new_address_params_packed
            .address_merkle_tree_account_index,
        address_queue_account_index: new_address_params_packed.address_queue_account_index,
        address_merkle_tree_root_index: new_address_params_packed.address_merkle_tree_root_index,
    });
    output_compressed_accounts.push(base_data_compressed_pda);

    // Create asset data
    let asset_data = AssetData {
        authority: match &ctx.accounts.authority {
            Some(authority) => Some(authority.key()),
            None => None,
        },
        group: match &ctx.accounts.group {
            Some(group) => Some(group.key()),
            None => None,
        },
        has_attributes: false,
        has_blob: blob_params.is_some(),
        mutable: true,
    };

    let asset_data_compressed_account_data = CompressedAccountData {
        discriminator: AssetData::discriminator(),
        data: asset_data.try_to_vec().unwrap(),
        data_hash: asset_data.hash::<Poseidon>().map_err(ProgramError::from)?,
    };

    let asset_data_seed = get_asset_resource_seed(b"asset_data", &asset_id)?;
    let asset_data_address = derive_address(
        &ctx.remaining_accounts
            [new_address_params_packed.address_merkle_tree_account_index as usize]
            .key(),
        &asset_data_seed,
    )
    .map_err(|_| ProgramError::InvalidArgument)?;

    let asset_data_compressed_pda = OutputCompressedAccountWithPackedContext {
        compressed_account: CompressedAccount {
            owner: crate::ID,
            lamports: 0,
            address: Some(asset_data_address),
            data: Some(asset_data_compressed_account_data),
        },
        merkle_tree_index: 0,
    };

    new_address_params.push(NewAddressParamsPacked {
        seed: asset_data_seed,
        address_merkle_tree_account_index: new_address_params_packed
            .address_merkle_tree_account_index,
        address_queue_account_index: new_address_params_packed.address_queue_account_index,
        address_merkle_tree_root_index: new_address_params_packed.address_merkle_tree_root_index,
    });
    output_compressed_accounts.push(asset_data_compressed_pda);

    let bump_seed = &[254];
    let signer_seeds: [&[u8]; 2] = [CPI_AUTHORITY_SEED.as_bytes(), bump_seed];

    // Create inputs struct
    let inputs_struct = InstructionDataInvokeCpi {
        proof: Some(proof),
        new_address_params,
        relay_fee: None,
        input_compressed_accounts_with_merkle_context: Vec::new(),
        output_compressed_accounts,
        compress_or_decompress_lamports: None,
        is_compress: false,
        signer_seeds: signer_seeds
            .iter()
            .map(|x| x.to_vec())
            .collect::<Vec<Vec<u8>>>(),
        cpi_context: None,
    };
    let mut inputs: Vec<u8> = Vec::new();
    InstructionDataInvokeCpi::serialize(&inputs_struct, &mut inputs).unwrap();
    let cpi_accounts = setup_cpi_accounts(ctx);
    invoke_cpi(&ctx, cpi_accounts, inputs, &[&signer_seeds])?;

    // Create blob if needed
    if let Some(blob_params) = blob_params {
        let blob_seed = get_asset_resource_seed(b"blob", &asset_id)?;
        let blob_address = derive_address(
            &ctx.remaining_accounts
                [new_address_params_packed.address_merkle_tree_account_index as usize]
                .key(),
            &blob_seed,
        )
        .map_err(|_| ProgramError::InvalidArgument)?;

        let blob_compressed_pda = OutputCompressedAccountWithPackedContext {
            compressed_account: CompressedAccount {
                owner: crate::ID,
                lamports: 0,
                address: Some(blob_address),
                data: Some(CompressedAccountData {
                    discriminator: Blob::discriminator(),
                    data: blob_params.data.try_to_vec().unwrap(),
                    data_hash: blob_params
                        .data
                        .hash::<Poseidon>()
                        .map_err(ProgramError::from)?,
                }),
            },
            merkle_tree_index: 0,
        };

        let blob_new_address_params = NewAddressParamsPacked {
            seed: blob_seed,
            address_merkle_tree_account_index: new_address_params_packed
                .address_merkle_tree_account_index,
            address_queue_account_index: new_address_params_packed.address_queue_account_index,
            address_merkle_tree_root_index: new_address_params_packed
                .address_merkle_tree_root_index,
        };

        let inputs_struct = InstructionDataInvokeCpi {
            proof: Some(blob_params.proof),
            new_address_params: vec![blob_new_address_params],
            relay_fee: None,
            input_compressed_accounts_with_merkle_context: Vec::new(),
            output_compressed_accounts: vec![blob_compressed_pda],
            compress_or_decompress_lamports: None,
            is_compress: false,
            signer_seeds: signer_seeds
                .iter()
                .map(|x| x.to_vec())
                .collect::<Vec<Vec<u8>>>(),
            cpi_context: None,
        };
        let mut inputs: Vec<u8> = Vec::new();
        InstructionDataInvokeCpi::serialize(&inputs_struct, &mut inputs).unwrap();
        let cpi_accounts = setup_cpi_accounts(ctx);
        invoke_cpi(&ctx, cpi_accounts, inputs, &[&signer_seeds])?;
    }

    // Create attributes if needed
    if let Some(attributes_params) = attributes_params {
        let attributes_seed = get_asset_resource_seed(b"attributes", &asset_id)?;
        let attributes_address = derive_address(
            &ctx.remaining_accounts
                [new_address_params_packed.address_merkle_tree_account_index as usize]
                .key(),
            &attributes_seed,
        )
        .map_err(|_| ProgramError::InvalidArgument)?;

        let attributes = Attributes {
            group: match &ctx.accounts.group {
                Some(group) => Some(group.key()),
                None => None,
            },
            attributes: attributes_params.data,
        };
        let attributes_compressed_pda = OutputCompressedAccountWithPackedContext {
            compressed_account: CompressedAccount {
                owner: crate::ID,
                lamports: 0,
                address: Some(attributes_address),
                data: Some(CompressedAccountData {
                    discriminator: Blob::discriminator(),
                    data: attributes.try_to_vec().unwrap(),
                    data_hash: attributes.hash::<Poseidon>().map_err(ProgramError::from)?,
                }),
            },
            merkle_tree_index: 0,
        };

        let attributes_new_address_params = NewAddressParamsPacked {
            seed: attributes_seed,
            address_merkle_tree_account_index: new_address_params_packed
                .address_merkle_tree_account_index,
            address_queue_account_index: new_address_params_packed.address_queue_account_index,
            address_merkle_tree_root_index: new_address_params_packed
                .address_merkle_tree_root_index,
        };

        let inputs_struct = InstructionDataInvokeCpi {
            proof: Some(attributes_params.proof),
            new_address_params: vec![attributes_new_address_params],
            relay_fee: None,
            input_compressed_accounts_with_merkle_context: Vec::new(),
            output_compressed_accounts: vec![attributes_compressed_pda],
            compress_or_decompress_lamports: None,
            is_compress: false,
            signer_seeds: signer_seeds
                .iter()
                .map(|x| x.to_vec())
                .collect::<Vec<Vec<u8>>>(),
            cpi_context: None,
        };
        let mut inputs: Vec<u8> = Vec::new();
        InstructionDataInvokeCpi::serialize(&inputs_struct, &mut inputs).unwrap();
        let cpi_accounts = setup_cpi_accounts(ctx);
        invoke_cpi(&ctx, cpi_accounts, inputs, &[&signer_seeds])?;
    }

    Ok(())
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct BlobParams {
    pub data: Blob,
    pub proof: CompressedProof,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct AttributesParams {
    pub data: Vec<Attribute>,
    pub proof: CompressedProof,
}

#[light_accounts]
#[event_cpi]
#[derive(Accounts, LightTraits)]
pub struct CreateAsset<'info> {
    #[account(mut)]
    #[fee_payer]
    pub payer: Signer<'info>,
    pub group_authority: Option<Signer<'info>>,
    /// CHECK: This can be any valid public key, but it must be the same as the group authority if group authority is provided.
    pub authority: Option<UncheckedAccount<'info>>,
    /// CHECK: This can be any valid public key.
    pub recipient: UncheckedAccount<'info>,
    #[account(mut)]
    pub group: Option<Box<Account<'info, Group>>>,

    #[authority]
    #[account(
        seeds = [CPI_AUTHORITY_SEED.as_bytes()],
        bump = 254,
    )]
    pub cpi_authority_pda: SystemAccount<'info>,
    #[self_program]
    pub self_program: Program<'info, crate::program::ZkNft>,
}
