use async_graphql::{Request, Response, SimpleObject};
use linera_sdk::{
    abis::fungible::FungibleTokenAbi,
    linera_base_types::{AccountOwner, Amount, ApplicationId, ChainId, WithContractAbi},
    views::{linera_views, MapView, RegisterView, RootView, ViewStorageContext},
};
use serde::{Deserialize, Serialize};

pub struct VelocityDexAbi;

impl WithContractAbi for VelocityDexAbi {
    type Operation = Operation;
    type Response = ();
}

/// The application state.
#[derive(RootView, SimpleObject)]
#[view(context = "ViewStorageContext")]
pub struct VelocityDex {
    /// Shares for each liquidity provider
    pub shares: MapView<AccountOwner, Amount>,
    /// Total pool balance for token0
    pub token0_balance: RegisterView<Amount>,
    /// Total pool balance for token1
    pub token1_balance: RegisterView<Amount>,
}

/// Parameters for the DEX application
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Parameters {
    /// The two fungible tokens supported by this AMM
    pub tokens: [ApplicationId<FungibleTokenAbi>; 2],
}

/// Operations that can be executed on the DEX
#[derive(Debug, Serialize, Deserialize)]
pub enum Operation {
    /// Swap tokens
    Swap {
        owner: AccountOwner,
        input_token_idx: usize,
        input_amount: Amount,
    },
    /// Add liquidity to the pool
    AddLiquidity {
        owner: AccountOwner,
        max_token0_amount: Amount,
        max_token1_amount: Amount,
    },
    /// Remove liquidity from the pool
    RemoveLiquidity {
        owner: AccountOwner,
        token_to_remove_idx: usize,
        token_to_remove_amount: Amount,
    },
}

/// Messages that can be sent between chains
#[derive(Debug, Serialize, Deserialize)]
pub enum Message {
    /// Execute a swap
    Swap {
        owner: AccountOwner,
        input_token_idx: usize,
        input_amount: Amount,
    },
    /// Add liquidity
    AddLiquidity {
        owner: AccountOwner,
        max_token0_amount: Amount,
        max_token1_amount: Amount,
    },
    /// Remove liquidity
    RemoveLiquidity {
        owner: AccountOwner,
        token_to_remove_idx: usize,
        token_to_remove_amount: Amount,
    },
}
