use anchor_lang::prelude::*;
use light_hasher::{errors::HasherError, Hasher};

#[derive(Debug)]
#[account]
pub struct BaseData {
    pub owner: Pubkey,
    pub delegate: Option<Pubkey>,
    pub delegate_role: DelegateRole,
    pub state: State,
}

impl light_hasher::DataHasher for BaseData {
    fn hash<H: Hasher>(&self) -> std::result::Result<[u8; 32], HasherError> {
        let mut hash_inputs = Vec::new();

        let hashed_owner =
            light_utils::hash_to_bn254_field_size_be(self.owner.to_bytes().as_slice())
                .unwrap()
                .0;

        hash_inputs.push(hashed_owner.as_slice());

        let state_bytes = [self.state as u8];
        hash_inputs.push(&state_bytes[..]);

        let hashed_delegate;
        if let Some(delegate) = self.delegate {
            hashed_delegate =
                light_utils::hash_to_bn254_field_size_be(delegate.to_bytes().as_slice())
                    .unwrap()
                    .0;
            hash_inputs.push(hashed_delegate.as_slice());
        };

        let delegate_role_bytes = [self.delegate_role as u8];
        hash_inputs.push(&delegate_role_bytes[..]);

        H::hashv(hash_inputs.as_slice())
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, AnchorSerialize, AnchorDeserialize, Default)]
#[repr(u8)]
pub enum State {
    #[default]
    Unlocked,
    LockedByAuthority,
    LockedByDelegate,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, AnchorSerialize, AnchorDeserialize, Default)]
#[repr(u8)]
pub enum DelegateRole {
    #[default]
    All,
    Transfer,
    Lock,
    Burn,
    TransferAndLock,
    TransferAndBurn,
    LockAndBurn,
}
