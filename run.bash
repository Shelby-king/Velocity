#!/usr/bin/env bash

set -eu

echo "🚀 Starting Velocity DEX Deployment..."
echo "======================================="

# Start Linera network using helper
eval "$(linera net helper)"
echo "📡 Starting Linera localnet..."
linera_spawn linera net up --with-faucet

# Set faucet URL
export LINERA_FAUCET_URL=http://localhost:8080

# Initialize wallet
echo "💼 Initializing wallet..."
linera wallet init --faucet="$LINERA_FAUCET_URL"
linera wallet request-chain --faucet="$LINERA_FAUCET_URL"

# Get the default chain ID and owner
DEFAULT_CHAIN=$(linera wallet show | grep -m1 "Chain ID" | awk '{print $3}')
OWNER=$(linera wallet show | grep -m1 "Public Key" | awk '{print $3}')

echo "✅ Wallet initialized"
echo "   Chain ID: $DEFAULT_CHAIN"
echo "   Owner: $OWNER"

# Build the smart contract
echo "🔨 Building Velocity DEX smart contract..."
cd /build/linera-dex
cargo build --release --target wasm32-unknown-unknown

if [ $? -ne 0 ]; then
    echo "❌ Contract build failed"
    exit 1
fi

echo "✅ Contract built successfully"

# Deploy fungible token applications (required for DEX)
echo "🪙 Deploying fungible tokens..."

# Check if linera-protocol exists, clone if not
if [ ! -d "/build/linera-protocol" ]; then
    echo "📥 Cloning linera-protocol repository..."
    cd /build
    git clone https://github.com/linera-io/linera-protocol.git
fi

cd /build/linera-protocol/examples/fungible
cargo build --release --target wasm32-unknown-unknown

echo "Deploying Token 1 (TKN1)..."
TOKEN1_APP=$(linera --wait-for-outgoing-messages publish-and-create \
    ../../target/wasm32-unknown-unknown/release/fungible_{contract,service}.wasm \
    --json-argument "{\"accounts\":{\"$OWNER\":\"1000000.\"}}" \
    --json-parameters '{"ticker_symbol":"TKN1"}')

echo "Deploying Token 2 (TKN2)..."
TOKEN2_APP=$(linera --wait-for-outgoing-messages publish-and-create \
    ../../target/wasm32-unknown-unknown/release/fungible_{contract,service}.wasm \
    --json-argument "{\"accounts\":{\"$OWNER\":\"1000000.\"}}" \
    --json-parameters '{"ticker_symbol":"TKN2"}')

echo "✅ Tokens deployed"
echo "   Token 1: $TOKEN1_APP"
echo "   Token 2: $TOKEN2_APP"

# Deploy DEX application
echo "🔄 Deploying Velocity DEX..."
cd /build/linera-dex

DEX_APP=$(linera --wait-for-outgoing-messages publish-and-create \
    target/wasm32-unknown-unknown/release/velocity_dex_{contract,service}.wasm \
    --json-parameters "{\"tokens\":[\"$TOKEN1_APP\",\"$TOKEN2_APP\"]}" \
    --required-application-ids $TOKEN1_APP $TOKEN2_APP)

echo "✅ DEX deployed successfully!"
echo "   DEX App: $DEX_APP"

# Start Linera node service
echo "🌐 Starting Linera node service..."
linera_spawn linera service --port 8080

# Save deployment info
cat > /build/deployment-info.txt <<EOF
Velocity DEX Deployment Information
====================================
Date: $(date)

Application IDs:
  DEX: $DEX_APP
  Token 1: $TOKEN1_APP
  Token 2: $TOKEN2_APP

Chain:
  Chain ID: $DEFAULT_CHAIN
  Owner: $OWNER

Endpoints:
  Node Service: http://localhost:8080
  GraphQL: http://localhost:8080/chains/$DEFAULT_CHAIN/applications/$DEX_APP
  Frontend: http://localhost:5173

Environment:
  export LINERA_WALLET=$LINERA_WALLET
  export LINERA_KEYSTORE=$LINERA_KEYSTORE
  export LINERA_STORAGE=$LINERA_STORAGE
EOF

echo "📝 Deployment info saved to deployment-info.txt"

# Create .env.local for frontend
cat > /build/.env.local <<EOF
NEXT_PUBLIC_LINERA_RPC=http://localhost:8080
NEXT_PUBLIC_CHAIN_ID=$DEFAULT_CHAIN
NEXT_PUBLIC_DEX_APP_ID=$DEX_APP
NEXT_PUBLIC_TOKEN0_APP_ID=$TOKEN1_APP
NEXT_PUBLIC_TOKEN1_APP_ID=$TOKEN2_APP
EOF

echo "✅ Frontend configuration created"

# Install frontend dependencies and build
echo "📦 Installing frontend dependencies..."
cd /build
. ~/.nvm/nvm.sh

# Install pnpm if needed
npm install -g pnpm

# Install dependencies
pnpm install

# Build the frontend for production
echo "🎨 Building frontend..."
pnpm build

# Start the frontend on port 5173 (for buildathon compatibility)
echo "🚀 Starting frontend on port 5173..."
pnpm start -p 5173 &

# Wait a bit for the server to start
sleep 10

echo ""
echo "================================================"
echo "🎉 Velocity DEX is ready!"
echo "================================================"
echo ""
echo "Frontend:  http://localhost:5173"
echo "GraphQL:   http://localhost:8080/chains/$DEFAULT_CHAIN/applications/$DEX_APP"
echo "Faucet:    http://localhost:8080"
echo ""
echo "Deployment details saved to deployment-info.txt"
echo ""

# Keep the container running
tail -f /dev/null
