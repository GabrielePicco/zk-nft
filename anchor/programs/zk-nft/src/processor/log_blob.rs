use anchor_lang::prelude::*;
#[allow(unused_imports)]
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::pubkey::Pubkey;
#[allow(unused_imports)]
use crate::constants::UPLOADED_BLOB_BUFFER_START;
use crate::UploadedBlob;

#[allow(dead_code)]
const MAX_CPI_BYTES: usize = 10_240;

#[allow(unused_variables)]
pub fn log_blob(ctx: Context<LogBlob>) -> Result<()> {
    let account_info = ctx.accounts.uploaded_blob.to_account_info();
    let account_data = account_info.data.borrow();

    #[allow(dead_code)]
    #[cfg(target_os = "solana")]
    {
        for i in (UPLOADED_BLOB_BUFFER_START..account_data.len()).step_by(MAX_CPI_BYTES) {
            let left = i;
            let right = std::cmp::min(i + MAX_CPI_BYTES, account_data.len());

            let pre_cpi_pos = light_heap::GLOBAL_ALLOCATOR.get_heap_pos();

            invoke(
                &spl_noop::instruction(account_data[left..right].to_vec()),
                &[ctx.accounts.noop_program.to_account_info()],
            )?;

            light_heap::GLOBAL_ALLOCATOR.free_heap(pre_cpi_pos)?;
        }
    }

    Ok(())
}

#[derive(Accounts)]
pub struct LogBlob<'info> {
    #[account(
        has_one = authority,
    )]
    pub uploaded_blob: Account<'info, UploadedBlob>,
    pub authority: Signer<'info>,
    /// CHECK: account is checked in the account constraint
    #[account(address = spl_noop::ID)]
    pub noop_program: UncheckedAccount<'info>,
}
