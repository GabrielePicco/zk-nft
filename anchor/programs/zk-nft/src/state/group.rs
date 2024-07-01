use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Group {
    pub size: u64,
    pub max_size: u64,
    pub authority: Pubkey,
}
