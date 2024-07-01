use anchor_lang::prelude::*;

use crate::state::Group;

pub fn create_group<'info>(
    ctx: Context<CreateGroup<'info>>,
    max_size: u64,
) -> Result<()> {
    let group = &mut ctx.accounts.group;
    group.size = 0;
    group.max_size = max_size;
    group.authority = ctx.accounts.group_authority.key();

    Ok(())
}

#[derive(Accounts)]
pub struct CreateGroup<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub group_authority: Signer<'info>,
    #[account(init, payer = payer, space = 8 + Group::INIT_SPACE)]
    pub group: Box<Account<'info, Group>>,
    pub system_program: Program<'info, System>,
}
