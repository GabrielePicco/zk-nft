use anchor_lang::{prelude::*, Discriminator};

use crate::{constants::UPLOADED_BLOB_BUFFER_START, UploadedBlob};

pub fn init_blob_upload(ctx: Context<InitBlobUpload>, _total_bytes: u32) -> Result<()> {
    let uploaded_blob = UploadedBlob {
        authority: ctx.accounts.authority.key(),
    };
    let mut struct_data = UploadedBlob::discriminator().try_to_vec().unwrap();
    struct_data.append(&mut uploaded_blob.try_to_vec().unwrap());

    let uploaded_blob_account = &mut ctx.accounts.uploaded_blob;

    let mut account_data = uploaded_blob_account.data.borrow_mut();
    msg!("account_data len: {:?}", account_data.len());
    account_data[0..struct_data.len()].copy_from_slice(&struct_data);

    Ok(())
}

#[derive(Accounts)]
#[instruction(total_bytes: u32)]
pub struct InitBlobUpload<'info> {
    /// CHECK: account constraints checked in account trait
    #[account(
        zero,
        rent_exempt = skip,
        constraint = uploaded_blob.to_account_info().owner == &crate::ID
            && uploaded_blob.to_account_info().data_len() >= UPLOADED_BLOB_BUFFER_START + (total_bytes as usize)
    )]
    pub uploaded_blob: UncheckedAccount<'info>,
    pub authority: Signer<'info>,
}
