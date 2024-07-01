use anchor_lang::prelude::*;

use crate::{constants::UPLOADED_BLOB_BUFFER_START, UploadedBlob};

pub fn upload_blob(ctx: Context<UploadBlob>, index: u32, bytes: Vec<u8>) -> Result<()> {
    let account_info = ctx.accounts.uploaded_blob.to_account_info();
    let mut account_data = account_info.data.borrow_mut();
    account_data[UPLOADED_BLOB_BUFFER_START + (index as usize)
        ..UPLOADED_BLOB_BUFFER_START + (index as usize) + bytes.len()]
        .copy_from_slice(&bytes);
    Ok(())
}

#[derive(Accounts)]
pub struct UploadBlob<'info> {
    #[account(
        mut,
        has_one = authority,
    )]
    pub uploaded_blob: Account<'info, UploadedBlob>,
    pub authority: Signer<'info>,
}
