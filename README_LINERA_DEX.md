# Velocity DEX - Simple Trading on Linera

A complete decentralized exchange (DEX) implementation on Linera protocol featuring:
- ✅ Smart contract with liquidity pool
- ✅ Token swap functionality (constant product AMM)
- ✅ Modern Next.js web interface
- ✅ Wallet connection and balance display

## Project Structure

```
velocity-app/
├── linera-dex/                 # Rust smart contract
│   ├── src/
│   │   ├── contract.rs         # Core AMM logic
│   │   ├── service.rs          # GraphQL API
│   │   ├── state.rs            # State management
│   │   └── lib.rs              # Type definitions
│   ├── Cargo.toml
│   └── README.md
│
└── app/dex/                    # Next.js frontend
    └── page.tsx                # DEX UI
```

## Quick Start

### 1. Install Linera CLI

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add wasm32 target
rustup target add wasm32-unknown-unknown

# Install Linera (from source)
git clone https://github.com/linera-io/linera-protocol.git
cd linera-protocol
cargo install --path linera-service
```

### 2. Build Smart Contract

```bash
cd velocity-app/linera-dex
cargo build --release --target wasm32-unknown-unknown
```

Binaries will be at:
- `target/wasm32-unknown-unknown/release/velocity_dex_contract.wasm`
- `target/wasm32-unknown-unknown/release/velocity_dex_service.wasm`

### 3. Deploy to Linera Network

#### Start Local Network

```bash
# Terminal 1: Start local test network
linera net up --with-faucet --faucet-port 8079

# Terminal 2: Initialize wallet
export LINERA_WALLET="$HOME/.config/linera/wallet.json"
export LINERA_KEYSTORE="$HOME/.config/linera/keystore.json"
export LINERA_STORAGE="rocksdb:$HOME/.config/linera/client.db"

linera wallet init --faucet http://localhost:8079
linera wallet request-chain --faucet http://localhost:8079
```

#### Deploy Fungible Tokens (Prerequisites)

You need two fungible token apps. Use the example from linera-protocol:

```bash
# Clone and build fungible example
git clone https://github.com/linera-io/linera-protocol.git
cd linera-protocol/examples/fungible
cargo build --release --target wasm32-unknown-unknown

# Deploy Token 1
TOKEN1_APP=$(linera publish-and-create \
  target/wasm32-unknown-unknown/release/fungible_{contract,service}.wasm \
  --json-argument '{"accounts":{"<YOUR_OWNER>":"1000."}}' \
  --json-parameters '{"ticker_symbol":"TKN1"}')

# Deploy Token 2
TOKEN2_APP=$(linera publish-and-create \
  target/wasm32-unknown-unknown/release/fungible_{contract,service}.wasm \
  --json-argument '{"accounts":{"<YOUR_OWNER>":"1000."}}' \
  --json-parameters '{"ticker_symbol":"TKN2"}')
```

#### Deploy DEX

```bash
cd velocity-app/linera-dex

DEX_APP=$(linera publish-and-create \
  target/wasm32-unknown-unknown/release/velocity_dex_{contract,service}.wasm \
  --json-parameters "{\"tokens\":[\"$TOKEN1_APP\",\"$TOKEN2_APP\"]}" \
  --required-application-ids $TOKEN1_APP $TOKEN2_APP)

echo "DEX deployed at: $DEX_APP"
```

#### Start Node Service

```bash
linera service --port 8080 &
```

### 4. Run Frontend

```bash
cd velocity-app
npm install
npm run dev
```

Visit: `http://localhost:3000/dex`

## Features

### Smart Contract (`linera-dex/`)

**Swap Tokens**
- Constant product formula: `x * y = k`
- 0.3% trading fee
- Automatic price calculation
- Cross-chain execution

**Add Liquidity**
- Proportional token deposits
- LP share minting
- Automatic ratio balancing
- Refunds for excess tokens

**Remove Liquidity**
- Withdraw proportional amounts
- LP share burning
- Maintains pool ratio

### Frontend (`app/dex/page.tsx`)

**Wallet Connection**
- Connect to Linera wallet
- Display wallet address
- Show token balances

**Swap Interface**
- Input/output token selection
- Real-time price calculation
- Rate display
- One-click swap

**Liquidity Management**
- Add liquidity form
- Remove liquidity form
- Pool statistics display
- Live balance updates

## GraphQL API

### Queries

```graphql
# Get pool balances
query {
  token0Balance
  token1Balance
}

# Get user shares
query {
  shares(owner: "<ACCOUNT_OWNER>")
}

# Calculate swap output
query {
  calculateSwapOutput(
    inputTokenIdx: 0,
    inputAmount: "100"
  )
}
```

### Mutations

```graphql
# Swap tokens
mutation {
  swap(
    owner: "<ACCOUNT_OWNER>",
    inputTokenIdx: 0,
    inputAmount: "10"
  )
}

# Add liquidity
mutation {
  addLiquidity(
    owner: "<ACCOUNT_OWNER>",
    maxToken0Amount: "100",
    maxToken1Amount: "100"
  )
}

# Remove liquidity
mutation {
  removeLiquidity(
    owner: "<ACCOUNT_OWNER>",
    tokenToRemoveIdx: 0,
    tokenToRemoveAmount: "50"
  )
}
```

## How It Works

### Constant Product AMM

The DEX uses the constant product market maker formula:

```
x * y = k
```

Where:
- `x` = Token 0 reserves
- `y` = Token 1 reserves
- `k` = Constant product

When swapping, the formula ensures:
```
(x + Δx) * (y - Δy) = k
```

With 0.3% fee:
```
Δy = (997 * Δx * y) / (1000 * x + 997 * Δx)
```

### Liquidity Provision

**Initial Liquidity:**
- Any ratio accepted
- Shares = √(token0_amount * token1_amount)

**Subsequent Additions:**
- Must match current pool ratio
- Shares = (token0_added * total_shares) / current_token0

### Cross-Chain Operations

1. User calls operation from Chain A
2. Tokens transferred to DEX chain (Chain B)
3. Operation executed on Chain B
4. Results sent back to Chain A
5. User receives tokens on Chain A

## Testing

### Test Swap Locally

```bash
# Start GraphiQL
# Navigate to: http://localhost:8080/chains/<CHAIN_ID>/applications/<DEX_APP_ID>

# Execute swap
mutation {
  swap(
    owner: "<YOUR_OWNER>",
    inputTokenIdx: 0,
    inputAmount: "10"
  )
}
```

### Test via Frontend

1. Open `http://localhost:3000/dex`
2. Click "Connect Wallet"
3. Enter swap amount
4. Click "Swap"
5. Check updated balances

## Configuration

### Smart Contract Parameters

Set in deployment `--json-parameters`:

```json
{
  "tokens": [
    "<TOKEN_0_APPLICATION_ID>",
    "<TOKEN_1_APPLICATION_ID>"
  ]
}
```

### Frontend Environment

Create `.env.local`:

```env
NEXT_PUBLIC_LINERA_RPC=http://localhost:8080
NEXT_PUBLIC_DEX_APP_ID=<YOUR_DEX_APP_ID>
NEXT_PUBLIC_CHAIN_ID=<YOUR_CHAIN_ID>
```

## Architecture

### Smart Contract Flow

```
User → Operation → Contract
                      ↓
              Check if local chain
                      ↓
                 Send message
                      ↓
              Execute on DEX chain
                      ↓
              Update pool state
                      ↓
              Transfer tokens
                      ↓
              Return to user
```

### State Management

```rust
pub struct VelocityDex {
    shares: MapView<AccountOwner, Amount>,      // LP shares per user
    token0_balance: RegisterView<Amount>,        // Pool token 0
    token1_balance: RegisterView<Amount>,        // Pool token 1
}
```

## Security Considerations

⚠️ **This is a demo implementation. For production:**

1. Add slippage protection
2. Implement deadline checks
3. Add reentrancy guards
4. Audit smart contract code
5. Test extensively on testnet
6. Add price oracle integration
7. Implement emergency pause
8. Add access controls

## Troubleshooting

### Contract Build Fails

```bash
# Ensure wasm32 target installed
rustup target add wasm32-unknown-unknown

# Update Rust
rustup update

# Clean and rebuild
cargo clean
cargo build --release --target wasm32-unknown-unknown
```

### Deployment Fails

```bash
# Check wallet balance
linera query-balance

# Request more tokens from faucet
linera wallet request-chain --faucet http://localhost:8079

# Verify token apps exist
linera wallet show
```

### Frontend Connection Issues

```bash
# Verify node service running
curl http://localhost:8080

# Check application deployed
linera wallet show

# Verify GraphQL endpoint
curl http://localhost:8080/chains/<CHAIN>/applications/<APP>
```

## Resources

- [Linera Documentation](https://linera.dev)
- [Linera Protocol GitHub](https://github.com/linera-io/linera-protocol)
- [Linera SDK Reference](https://docs.rs/linera-sdk)
- [AMM Example](https://github.com/linera-io/linera-protocol/tree/main/examples/amm)
- [Fungible Token Tutorial](https://github.com/linera-io/fungible-app-tutorial)

## License

MIT

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

## Next Steps

### Enhancements

- [ ] Add price charts
- [ ] Implement multi-token support (>2 tokens)
- [ ] Add transaction history
- [ ] Implement liquidity mining rewards
- [ ] Add governance token
- [ ] Create mobile app
- [ ] Add limit orders
- [ ] Implement flash swaps

### Optimizations

- [ ] Gas optimization
- [ ] Batch operations
- [ ] Off-chain price calculations
- [ ] Caching layer
- [ ] WebSocket live updates

---

**Built with ❤️ on Linera Protocol**
