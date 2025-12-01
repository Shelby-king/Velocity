#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use async_graphql::{EmptySubscription, Object, Request, Response, Schema};
use linera_sdk::{
    linera_base_types::{AccountOwner, Amount, ApplicationId},
    views::{View, ViewStorageContext},
    Service, ServiceRuntime,
};
use std::sync::Arc;
use velocity_dex::{Operation, Parameters, VelocityDexAbi};

use self::state::DexState;

pub struct VelocityDexService {
    state: Arc<DexState>,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(VelocityDexService);

impl linera_sdk::abi::ServiceAbi for VelocityDexService {
    type Abi = VelocityDexAbi;
    type Parameters = Parameters;
}

impl Service for VelocityDexService {
    type Parameters = Parameters;

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = DexState::load(ViewStorageContext::from(runtime.root_view_storage_context()))
            .await
            .expect("Failed to load state");
        VelocityDexService {
            state: Arc::new(state),
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, request: Request) -> Response {
        let schema = Schema::build(
            QueryRoot {
                state: self.state.clone(),
                runtime: self.runtime.clone(),
            },
            MutationRoot {
                runtime: self.runtime.clone(),
            },
            EmptySubscription,
        )
        .finish();

        schema.execute(request).await
    }
}

struct QueryRoot {
    state: Arc<DexState>,
    runtime: Arc<ServiceRuntime<VelocityDexService>>,
}

#[Object]
impl QueryRoot {
    /// Get the balance of token0 in the pool
    async fn token0_balance(&self) -> Amount {
        self.state.token0_balance.get().copied().unwrap_or(Amount::ZERO)
    }

    /// Get the balance of token1 in the pool
    async fn token1_balance(&self) -> Amount {
        self.state.token1_balance.get().copied().unwrap_or(Amount::ZERO)
    }

    /// Get the shares owned by an account
    async fn shares(&self, owner: AccountOwner) -> Amount {
        self.state
            .shares
            .get(&owner)
            .await
            .unwrap_or(None)
            .unwrap_or(Amount::ZERO)
    }

    /// Get the application parameters
    async fn parameters(&self) -> String {
        let params: Parameters = self.runtime.application_parameters();
        serde_json::to_string(&params).unwrap_or_default()
    }

    /// Calculate output amount for a swap
    async fn calculate_swap_output(
        &self,
        input_token_idx: usize,
        input_amount: String,
    ) -> String {
        let input = input_amount.parse::<u128>().unwrap_or(0);
        let input_amt = Amount::from_attos(input);

        let (input_pool, output_pool) = if input_token_idx == 0 {
            (
                self.state.token0_balance.get().copied().unwrap_or(Amount::ZERO),
                self.state.token1_balance.get().copied().unwrap_or(Amount::ZERO),
            )
        } else {
            (
                self.state.token1_balance.get().copied().unwrap_or(Amount::ZERO),
                self.state.token0_balance.get().copied().unwrap_or(Amount::ZERO),
            )
        };

        // Constant product formula with 0.3% fee
        let input_with_fee = input * 997;
        let numerator = input_with_fee * u128::from(output_pool);
        let denominator = (u128::from(input_pool) * 1000) + input_with_fee;
        let output = numerator / denominator;

        output.to_string()
    }
}

struct MutationRoot {
    runtime: Arc<ServiceRuntime<VelocityDexService>>,
}

#[Object]
impl MutationRoot {
    /// Swap tokens
    async fn swap(
        &self,
        owner: AccountOwner,
        input_token_idx: usize,
        input_amount: String,
    ) -> Vec<u8> {
        let amount = input_amount.parse::<u128>().unwrap_or(0);
        let operation = Operation::Swap {
            owner,
            input_token_idx,
            input_amount: Amount::from_attos(amount),
        };
        bcs::to_bytes(&operation).unwrap()
    }

    /// Add liquidity to the pool
    async fn add_liquidity(
        &self,
        owner: AccountOwner,
        max_token0_amount: String,
        max_token1_amount: String,
    ) -> Vec<u8> {
        let token0 = max_token0_amount.parse::<u128>().unwrap_or(0);
        let token1 = max_token1_amount.parse::<u128>().unwrap_or(0);
        
        let operation = Operation::AddLiquidity {
            owner,
            max_token0_amount: Amount::from_attos(token0),
            max_token1_amount: Amount::from_attos(token1),
        };
        bcs::to_bytes(&operation).unwrap()
    }

    /// Remove liquidity from the pool
    async fn remove_liquidity(
        &self,
        owner: AccountOwner,
        token_to_remove_idx: usize,
        token_to_remove_amount: String,
    ) -> Vec<u8> {
        let amount = token_to_remove_amount.parse::<u128>().unwrap_or(0);
        
        let operation = Operation::RemoveLiquidity {
            owner,
            token_to_remove_idx,
            token_to_remove_amount: Amount::from_attos(amount),
        };
        bcs::to_bytes(&operation).unwrap()
    }
}
