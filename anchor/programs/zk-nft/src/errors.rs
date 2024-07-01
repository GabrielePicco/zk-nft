use anchor_lang::prelude::*;

#[error_code]
pub enum ZkNftError {
    #[msg("GroupMaxSizeExceeded")]
    GroupMaxSizeExceeded,
    #[msg("AssetNotMutable")]
    AssetNotMutable,
    #[msg("AssetIsLocked")]
    AssetIsLocked,
    #[msg("Authority is not the owner or delegate")]
    InvalidAuthority,
}
