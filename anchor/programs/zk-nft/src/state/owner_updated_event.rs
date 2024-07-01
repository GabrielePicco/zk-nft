use anchor_lang::prelude::*;

#[event]
pub struct OwnerUpdatedEvent {
    pub asset_id: Pubkey,
    pub owner: Pubkey,
}
