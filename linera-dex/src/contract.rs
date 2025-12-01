#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    abis::fungible::{FungibleOperation, FungibleResponse, FungibleTokenAbi},
    linera_base_types::{Account, AccountOwner, Amount, ApplicationId, ChainId, WithContractAbi},
    views::{RootView, View},
    Contract, ContractRuntime,
};
use num_bigint::BigUint;
use num_traits::{cast::FromPrimitive, ToPrimitive};
use velocity_dex::{Message, Operation, Parameters, VelocityDex, VelocityDexAbi};

use self::state::DexState;

pub struct VelocityDexContract {
    state: DexState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(VelocityDexContract);

impl WithContractAbi for VelocityDexContract {
    type Abi = VelocityDexAbi;
}

impl Contract for VelocityDexContract {
    type Message = Message;
    type InstantiationArgument = ();
    type Parameters = Parameters;
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = DexState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        VelocityDexContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: ()) {
        // Validate that the application parameters were configured correctly
        self.runtime.application_parameters();
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response {
        if self.runtime.chain_id() == self.runtime.application_creator_chain_id() {
            self.execute_order_local(operation).await;
        } else {
            self.execute_order_remote(operation).await;
        }
    }

    async fn execute_message(&mut self, message: Self::Message) {
        assert_eq!(
            self.runtime.chain_id(),
            self.runtime.application_creator_chain_id(),
            "Action can only be executed on the chain that created the DEX"
        );

        match message {
            Message::Swap {
                owner,
                input_token_idx,
                input_amount,
            } => {
                self.runtime
                    .check_account_permission(owner)
                    .expect("Permission for Swap message");
                
                assert!(
                    input_amount > Amount::ZERO,
                    "You can't swap with zero tokens"
                );
                assert!(input_token_idx < 2, "Invalid token index");

                let output_token_idx = 1 - input_token_idx;
                let input_pool_balance = self.get_pool_balance(input_token_idx);
                let output_pool_balance = self.get_pool_balance(output_token_idx);

                let output_amount = self.calculate_output_amount(
                    input_amount,
                    input_pool_balance,
                    output_pool_balance,
                );

                let dex_account = self.get_dex_account();
                self.transfer(owner, input_amount, dex_account, input_token_idx);

                let dex_app_owner = self.get_dex_app_owner();
                let message_origin_account = self.get_message_origin_account(owner);
                self.transfer(
                    dex_app_owner,
                    output_amount,
                    message_origin_account,
                    output_token_idx,
                );
            }

            Message::AddLiquidity {
                owner,
                max_token0_amount,
                max_token1_amount,
            } => {
                self.runtime
                    .check_account_permission(owner)
                    .expect("Permission for AddLiquidity message");

                assert!(
                    max_token0_amount > Amount::ZERO && max_token1_amount > Amount::ZERO,
                    "You can't add liquidity with zero tokens"
                );

                let balance0 = self.get_pool_balance(0);
                let balance1 = self.get_pool_balance(1);

                let (token0_amount, token1_amount) = if balance0 > Amount::ZERO && balance1 > Amount::ZERO {
                    self.calculate_liquidity_amounts(
                        max_token0_amount,
                        max_token1_amount,
                        balance0,
                        balance1,
                    )
                } else {
                    // First liquidity addition
                    (max_token0_amount, max_token1_amount)
                };

                let dex_account = self.get_dex_account();
                let message_origin_account = self.get_message_origin_account(owner);

                // Handle refunds if needed
                if token0_amount < max_token0_amount {
                    self.transfer(
                        owner,
                        max_token0_amount.saturating_sub(token0_amount),
                        message_origin_account,
                        0,
                    );
                }
                self.transfer(owner, token0_amount, dex_account, 0);

                if token1_amount < max_token1_amount {
                    self.transfer(
                        owner,
                        max_token1_amount.saturating_sub(token1_amount),
                        message_origin_account,
                        1,
                    );
                }
                self.transfer(owner, token1_amount, dex_account, 1);

                // Calculate and mint shares
                let shares_to_mint = self.calculate_shares(token0_amount, token1_amount, balance0);
                self.mint_shares(&message_origin_account, shares_to_mint).await;
            }

            Message::RemoveLiquidity {
                owner,
                token_to_remove_idx,
                token_to_remove_amount,
            } => {
                self.runtime
                    .check_account_permission(owner)
                    .expect("Permission for RemoveLiquidity message");

                assert!(
                    token_to_remove_amount > Amount::ZERO,
                    "You can't remove zero tokens"
                );
                assert!(token_to_remove_idx < 2, "Invalid token index");

                let other_token_idx = 1 - token_to_remove_idx;
                let balance_to_remove = self.get_pool_balance(token_to_remove_idx);
                let other_balance = self.get_pool_balance(other_token_idx);

                let other_token_amount = self.calculate_proportional_amount(
                    token_to_remove_amount,
                    balance_to_remove,
                    other_balance,
                );

                let dex_app_owner = self.get_dex_app_owner();
                let message_origin_account = self.get_message_origin_account(owner);

                self.transfer(
                    dex_app_owner,
                    token_to_remove_amount,
                    message_origin_account,
                    token_to_remove_idx,
                );
                self.transfer(
                    dex_app_owner,
                    other_token_amount,
                    message_origin_account,
                    other_token_idx,
                );

                // Burn shares
                let shares_to_burn = self.calculate_shares_to_burn(
                    token_to_remove_amount,
                    balance_to_remove,
                    &message_origin_account,
                ).await;
                self.burn_shares(&message_origin_account, shares_to_burn).await;
            }
        }
    }

    async fn finalize(&mut self) {}
}

impl VelocityDexContract {
    async fn execute_order_local(&mut self, _operation: Operation) {
        panic!("Operations must be executed from a different chain");
    }

    async fn execute_order_remote(&mut self, operation: Operation) {
        let destination = self.runtime.application_creator_chain_id();
        
        let message = match operation {
            Operation::Swap {
                owner,
                input_token_idx,
                input_amount,
            } => {
                // Transfer tokens to the DEX chain first
                self.prepare_swap_transfer(owner, input_token_idx, input_amount, destination);
                Message::Swap {
                    owner,
                    input_token_idx,
                    input_amount,
                }
            }
            Operation::AddLiquidity {
                owner,
                max_token0_amount,
                max_token1_amount,
            } => {
                // Transfer tokens to the DEX chain
                self.prepare_liquidity_transfer(
                    owner,
                    max_token0_amount,
                    max_token1_amount,
                    destination,
                );
                Message::AddLiquidity {
                    owner,
                    max_token0_amount,
                    max_token1_amount,
                }
            }
            Operation::RemoveLiquidity {
                owner,
                token_to_remove_idx,
                token_to_remove_amount,
            } => Message::RemoveLiquidity {
                owner,
                token_to_remove_idx,
                token_to_remove_amount,
            },
        };

        self.runtime
            .prepare_message(message)
            .with_authentication()
            .send_to(destination);
    }

    fn get_pool_balance(&self, token_idx: usize) -> Amount {
        match token_idx {
            0 => self.state.token0_balance.get().copied().unwrap_or(Amount::ZERO),
            1 => self.state.token1_balance.get().copied().unwrap_or(Amount::ZERO),
            _ => panic!("Invalid token index"),
        }
    }

    fn calculate_output_amount(
        &self,
        input_amount: Amount,
        input_pool: Amount,
        output_pool: Amount,
    ) -> Amount {
        // Constant product formula: x * y = k
        // With 0.3% fee
        let input_with_fee = u128::from(input_amount) * 997;
        let numerator = input_with_fee * u128::from(output_pool);
        let denominator = (u128::from(input_pool) * 1000) + input_with_fee;
        Amount::from_attos((numerator / denominator) as u128)
    }

    fn calculate_liquidity_amounts(
        &self,
        max_token0: Amount,
        max_token1: Amount,
        balance0: Amount,
        balance1: Amount,
    ) -> (Amount, Amount) {
        let max0_big = BigUint::from_u128(u128::from(max_token0)).unwrap();
        let max1_big = BigUint::from_u128(u128::from(max_token1)).unwrap();
        let bal0_big = BigUint::from_u128(u128::from(balance0)).unwrap();
        let bal1_big = BigUint::from_u128(u128::from(balance1)).unwrap();

        if &max0_big * &bal1_big > &max1_big * &bal0_big {
            let token0 = ((&bal0_big * &max1_big) / &bal1_big).to_u128().unwrap();
            (Amount::from_attos(token0), max_token1)
        } else {
            let token1 = ((&bal1_big * &max0_big) / &bal0_big).to_u128().unwrap();
            (max_token0, Amount::from_attos(token1))
        }
    }

    fn calculate_shares(
        &self,
        token0_amount: Amount,
        token1_amount: Amount,
        balance0: Amount,
    ) -> Amount {
        if balance0 > Amount::ZERO {
            // Proportional to existing liquidity
            let shares = (u128::from(token0_amount) * u128::from(self.get_total_shares()))
                / u128::from(balance0);
            Amount::from_attos(shares)
        } else {
            // Initial liquidity
            let shares = (u128::from(token0_amount) * u128::from(token1_amount))
                .checked_sqrt()
                .unwrap_or(0);
            Amount::from_attos(shares)
        }
    }

    fn calculate_proportional_amount(
        &self,
        amount: Amount,
        balance: Amount,
        other_balance: Amount,
    ) -> Amount {
        let result = (u128::from(amount) * u128::from(other_balance)) / u128::from(balance);
        Amount::from_attos(result)
    }

    async fn calculate_shares_to_burn(
        &self,
        token_amount: Amount,
        balance: Amount,
        account: &Account,
    ) -> Amount {
        let user_shares = self.state
            .shares
            .get(&account.owner)
            .await
            .unwrap_or(None)
            .unwrap_or(Amount::ZERO);
        
        let total_shares = self.get_total_shares();
        let shares_to_burn = (u128::from(token_amount) * u128::from(user_shares))
            / u128::from(balance);
        Amount::from_attos(shares_to_burn)
    }

    fn get_total_shares(&self) -> Amount {
        // This would need to iterate through all shares
        // For simplicity, returning a placeholder
        Amount::from_attos(1000000)
    }

    async fn mint_shares(&mut self, account: &Account, amount: Amount) {
        let current = self.state
            .shares
            .get(&account.owner)
            .await
            .unwrap_or(None)
            .unwrap_or(Amount::ZERO);
        
        self.state
            .shares
            .insert(&account.owner, current.saturating_add(amount))
            .expect("Failed to mint shares");
    }

    async fn burn_shares(&mut self, account: &Account, amount: Amount) {
        let current = self.state
            .shares
            .get(&account.owner)
            .await
            .unwrap_or(None)
            .unwrap_or(Amount::ZERO);
        
        self.state
            .shares
            .insert(&account.owner, current.saturating_sub(amount))
            .expect("Failed to burn shares");
    }

    fn get_dex_account(&self) -> Account {
        Account {
            chain_id: self.runtime.application_creator_chain_id(),
            owner: Some(self.runtime.application_id().creation.creator),
        }
    }

    fn get_dex_app_owner(&self) -> AccountOwner {
        self.runtime.application_id().creation.creator
    }

    fn get_message_origin_account(&self, owner: AccountOwner) -> Account {
        Account {
            chain_id: self.runtime.message_id().unwrap().chain_id,
            owner: Some(owner),
        }
    }

    fn prepare_swap_transfer(
        &mut self,
        owner: AccountOwner,
        token_idx: usize,
        amount: Amount,
        destination: ChainId,
    ) {
        let params = self.runtime.application_parameters();
        let token_app = params.tokens[token_idx];
        
        let dest_account = Account {
            chain_id: destination,
            owner: Some(owner),
        };

        self.runtime
            .call_application(
                true,
                token_app,
                FungibleOperation::Transfer {
                    owner,
                    amount,
                    target_account: dest_account,
                },
            )
            .expect("Failed to transfer tokens");
    }

    fn prepare_liquidity_transfer(
        &mut self,
        owner: AccountOwner,
        token0_amount: Amount,
        token1_amount: Amount,
        destination: ChainId,
    ) {
        let params = self.runtime.application_parameters();
        
        let dest_account = Account {
            chain_id: destination,
            owner: Some(owner),
        };

        // Transfer token0
        self.runtime
            .call_application(
                true,
                params.tokens[0],
                FungibleOperation::Transfer {
                    owner,
                    amount: token0_amount,
                    target_account: dest_account,
                },
            )
            .expect("Failed to transfer token0");

        // Transfer token1
        self.runtime
            .call_application(
                true,
                params.tokens[1],
                FungibleOperation::Transfer {
                    owner,
                    amount: token1_amount,
                    target_account: dest_account,
                },
            )
            .expect("Failed to transfer token1");
    }

    fn transfer(
        &mut self,
        owner: AccountOwner,
        amount: Amount,
        target: Account,
        token_idx: usize,
    ) {
        let params = self.runtime.application_parameters();
        let token_app = params.tokens[token_idx];

        self.runtime
            .call_application(
                true,
                token_app,
                FungibleOperation::Transfer {
                    owner,
                    amount,
                    target_account: target,
                },
            )
            .expect("Failed to transfer");
    }
}
