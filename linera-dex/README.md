# Velocity DEX - Linera Smart Contract

A simple Automated Market Maker (AMM) / DEX built on Linera protocol.

## Features

- **Swap**: Exchange between two tokens using constant product formula (x*y=k)
- **Add Liquidity**: Provide liquidity to the pool and earn LP shares
- **Remove Liquidity**: Withdraw your liquidity and burn LP shares
- **0.3% Trading Fee**: Standard AMM fee model

## Prerequisites

Before building, ensure you have:
- Rust toolchain installed
- Linera CLI tools (`linera*`) in your PATH
- `wasm32-unknown-unknown` target: `rustup target add wasm32-unknown-unknown`

## Building

```bash
cd linera-dex
cargo build --release --target wasm32-unknown-unknown
```

The compiled WebAssembly binaries will be in:
- `target/wasm32-unknown-unknown/release/velocity_dex_contract.wasm`
- `target/wasm32-unknown-unknown/release/velocity_dex_service.wasm`

## Deployment

### 1. Setup Local Network

```bash
# Set up environment
export PATH="$PWD/target/debug:$PATH"
source /dev/stdin <<<"$(linera net helper 2>/dev/null)"

# Start local network with faucet
FAUCET_PORT=8079
FAUCET_URL=http://localhost:$FAUCET_PORT
linera_spawn linera net up --with-faucet --faucet-port $FAUCET_PORT
```

### 2. Create Wallet and Chains

```bash
export LINERA_WALLET="$HOME/.config/linera/wallet.json"
export LINERA_KEYSTORE="$HOME/.config/linera/keystore.json"
export LINERA_STORAGE="rocksdb:$HOME/.config/linera/client.db"

linera wallet init --faucet $FAUCET_URL

# Create chains
INFO_DEX=($(linera wallet request-chain --faucet $FAUCET_URL))
INFO_1=($(linera wallet request-chain --faucet $FAUCET_URL))
INFO_2=($(linera wallet request-chain --faucet $FAUCET_URL))

CHAIN_DEX="${INFO_DEX[0]}"
CHAIN_1="${INFO_1[0]}"
CHAIN_2="${INFO_2[0]}"
OWNER_DEX="${INFO_DEX[1]}"
OWNER_1="${INFO_1[1]}"
OWNER_2="${INFO_2[1]}"
```

### 3. Deploy Fungible Tokens

First, you need two fungible token applications:

```bash
# Build fungible token example (from linera-protocol repo)
(cd examples/fungible && cargo build --release --target wasm32-unknown-unknown)

# Create Token 1
TOKEN1_APP_ID=$(linera --wait-for-outgoing-messages \
  publish-and-create examples/target/wasm32-unknown-unknown/release/fungible_{contract,service}.wasm \
    --json-argument "{ \"accounts\": {
        \"$OWNER_DEX\": \"1000.\",
        \"$OWNER_1\": \"500.\"
    } }" \
    --json-parameters "{ \"ticker_symbol\": \"TKN1\" }" \
)

# Create Token 2
TOKEN2_APP_ID=$(linera --wait-for-outgoing-messages \
  publish-and-create examples/target/wasm32-unknown-unknown/release/fungible_{contract,service}.wasm \
    --json-argument "{ \"accounts\": {
        \"$OWNER_DEX\": \"1000.\",
        \"$OWNER_1\": \"500.\"
    } }" \
    --json-parameters "{ \"ticker_symbol\": \"TKN2\" }" \
)
```

### 4. Deploy DEX Application

```bash
# Build the DEX
(cd linera-dex && cargo build --release --target wasm32-unknown-unknown)

# Deploy DEX
DEX_APP_ID=$(linera --wait-for-outgoing-messages \
  publish-and-create target/wasm32-unknown-unknown/release/velocity_dex_{contract,service}.wasm \
  --json-parameters "{\"tokens\":[\"$TOKEN1_APP_ID\",\"$TOKEN2_APP_ID\"]}" \
  --required-application-ids $TOKEN1_APP_ID $TOKEN2_APP_ID)

echo "DEX Application ID: $DEX_APP_ID"
```

### 5. Start Node Service

```bash
PORT=8080
linera service --port $PORT &
```

## Using the DEX

### Via GraphiQL

Navigate to: `http://localhost:8080/chains/$CHAIN_1/applications/$DEX_APP_ID`

#### Add Liquidity

```graphql
mutation {
  addLiquidity(
    owner: "<OWNER_ADDRESS>",
    maxToken0Amount: "100",
    maxToken1Amount: "100"
  )
}
```

#### Swap Tokens

```graphql
mutation {
  swap(
    owner: "<OWNER_ADDRESS>",
    inputTokenIdx: 0,
    inputAmount: "10"
  )
}
```

#### Check Pool Balances

```graphql
query {
  token0Balance
  token1Balance
}
```

#### Calculate Swap Output

```graphql
query {
  calculateSwapOutput(
    inputTokenIdx: 0,
    inputAmount: "10"
  )
}
```

### Via Frontend

See the Next.js frontend in the parent directory for a user-friendly web interface.

## Architecture

- **Contract (`contract.rs`)**: Core DEX logic, handles operations and messages
- **Service (`service.rs`)**: GraphQL API for querying and executing operations
- **State (`state.rs`)**: Persistent storage for pool balances and LP shares
- **Lib (`lib.rs`)**: Type definitions and interfaces

## How It Works

1. **Constant Product AMM**: Uses the formula `x * y = k` where x and y are token reserves
2. **Liquidity Provision**: Users deposit tokens proportionally to get LP shares
3. **Trading Fee**: 0.3% fee on swaps, stays in the pool to benefit LPs
4. **Cross-Chain**: Operations are executed remotely from different chains

## Testing

```bash
cargo test
```

## License

MIT
