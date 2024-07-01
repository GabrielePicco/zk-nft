use crate::errors::ZkNftError;
use crate::state::BaseData;
use crate::{constants::CPI_AUTHORITY_SEED, state::State};
use crate::{DelegateRole, OwnerUpdatedEvent, PackedInputCompressedPda};
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
    sdk::compressed_account::{CompressedAccount, CompressedAccountData},
    OutputCompressedAccountWithPackedContext,
};

pub fn transfer<'info>(
    ctx: Context<'_, '_, '_, 'info, Transfer<'info>>,
    proof: CompressedProof,
    asset_id: [u8; 32],
    base_data: BaseData,
    base_data_input: PackedInputCompressedPda,
) -> Result<()> {
    require!(
        base_data.state == State::Unlocked,
        ZkNftError::AssetIsLocked
    );
    if ctx.accounts.authority.key() != base_data.owner {
        require!(
            Some(ctx.accounts.authority.key()) == base_data.delegate
                && (base_data.delegate_role == DelegateRole::All
                    || base_data.delegate_role == DelegateRole::Transfer
                    || base_data.delegate_role == DelegateRole::TransferAndLock
                    || base_data.delegate_role == DelegateRole::TransferAndBurn),
            ZkNftError::InvalidAuthority
        );
    }

    emit_cpi!(OwnerUpdatedEvent {
        asset_id: asset_id.into(),
        owner: *ctx.accounts.recipient.key,
    });

    let (old_state, new_state) = get_old_and_new_base_data_compressed_pda(
        asset_id,
        &base_data_input,
        &base_data,
        BaseData {
            owner: ctx.accounts.recipient.key(),
            state: base_data.state,
            delegate: base_data.delegate,
            delegate_role: base_data.delegate_role,
        },
    )?;

    // make light system program cpi
    let bump_seed = &[254];
    let signer_seeds: [&[u8]; 2] = [CPI_AUTHORITY_SEED.as_bytes(), bump_seed];
    let inputs_struct = InstructionDataInvokeCpi {
        proof: Some(proof),
        new_address_params: Vec::new(),
        relay_fee: None,
        input_compressed_accounts_with_merkle_context: vec![old_state],
        output_compressed_accounts: vec![new_state],
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

fn get_old_and_new_base_data_compressed_pda<'info>(
    base_data_address: [u8; 32],
    base_data_input: &PackedInputCompressedPda,
    old_base_data: &BaseData,
    new_base_data: BaseData,
) -> Result<(
    PackedCompressedAccountWithMerkleContext,
    OutputCompressedAccountWithPackedContext,
)> {
    // restore old base data
    let old_compressed_account_data = CompressedAccountData {
        discriminator: BaseData::discriminator(),
        data: old_base_data.try_to_vec().unwrap(),
        data_hash: old_base_data
            .hash::<Poseidon>()
            .map_err(ProgramError::from)?,
    };
    let old_compressed_account_with_context = PackedCompressedAccountWithMerkleContext {
        compressed_account: CompressedAccount {
            owner: crate::ID,
            lamports: 0,
            address: Some(base_data_address),
            data: Some(old_compressed_account_data),
        },
        merkle_context: base_data_input.merkle_context,
        root_index: base_data_input.root_index,
    };

    // get new base data
    let new_compressed_account_data = CompressedAccountData {
        discriminator: BaseData::discriminator(),
        data: new_base_data.try_to_vec().unwrap(),
        data_hash: new_base_data
            .hash::<Poseidon>()
            .map_err(ProgramError::from)?,
    };
    let new_compressed_account = OutputCompressedAccountWithPackedContext {
        compressed_account: CompressedAccount {
            owner: crate::ID,
            lamports: 0,
            address: Some(base_data_address),
            data: Some(new_compressed_account_data),
        },
        merkle_tree_index: base_data_input.merkle_context.merkle_tree_pubkey_index,
    };

    Ok((old_compressed_account_with_context, new_compressed_account))
}

#[light_accounts]
#[event_cpi]
#[derive(Accounts, LightTraits)]
pub struct Transfer<'info> {
    #[account(mut)]
    #[fee_payer]
    pub payer: Signer<'info>,
    pub authority: Signer<'info>,
    /// CHECK: This can be any valid public key.
    pub recipient: UncheckedAccount<'info>,

    #[authority]
    #[account(
        seeds = [CPI_AUTHORITY_SEED.as_bytes()],
        bump = 254,
    )]
    pub cpi_authority_pda: SystemAccount<'info>,
    #[self_program]
    pub self_program: Program<'info, crate::program::ZkNft>,
}
