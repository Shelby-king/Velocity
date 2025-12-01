#!/bin/bash
# Velocity DEX Deployment Script for Linera

set -e

echo "🚀 Velocity DEX Deployment Script"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
FAUCET_PORT=8079
FAUCET_URL="http://localhost:$FAUCET_PORT"
SERVICE_PORT=8080

echo -e "${BLUE}Step 1: Building smart contract...${NC}"
cargo build --release --target wasm32-unknown-unknown

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check errors above."
    exit 1
fi

echo -e "${GREEN}✓ Build successful${NC}"

echo -e "\n${BLUE}Step 2: Checking for Linera network...${NC}"

# Check if linera is installed
if ! command -v linera &> /dev/null; then
    echo "❌ Linera CLI not found. Please install it first:"
    echo "   https://linera.dev/developers/getting_started/installation.html"
    exit 1
fi

echo -e "${GREEN}✓ Linera CLI found${NC}"

echo -e "\n${BLUE}Step 3: Setting up environment...${NC}"

# Create config directory
mkdir -p "$HOME/.config/linera"

export LINERA_WALLET="$HOME/.config/linera/wallet.json"
export LINERA_KEYSTORE="$HOME/.config/linera/keystore.json"
export LINERA_STORAGE="rocksdb:$HOME/.config/linera/client.db"

echo "LINERA_WALLET=$LINERA_WALLET"
echo "LINERA_KEYSTORE=$LINERA_KEYSTORE"
echo "LINERA_STORAGE=$LINERA_STORAGE"

echo -e "\n${YELLOW}Note: Make sure you have a Linera network running.${NC}"
echo -e "${YELLOW}If not, run in another terminal: linera net up --with-faucet --faucet-port $FAUCET_PORT${NC}"
echo ""
read -p "Press Enter when network is ready..."

echo -e "\n${BLUE}Step 4: Initializing wallet...${NC}"

# Check if wallet already exists
if [ -f "$LINERA_WALLET" ]; then
    echo "⚠️  Wallet already exists. Skipping initialization."
    read -p "Do you want to create a new wallet? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -f "$LINERA_WALLET" "$LINERA_KEYSTORE"
        rm -rf "$HOME/.config/linera/client.db"
        linera wallet init --faucet $FAUCET_URL
    fi
else
    linera wallet init --faucet $FAUCET_URL
fi

echo -e "\n${BLUE}Step 5: Requesting chains...${NC}"

# Request chains for testing
echo "Creating DEX chain..."
INFO_DEX=($(linera wallet request-chain --faucet $FAUCET_URL))
CHAIN_DEX="${INFO_DEX[0]}"
OWNER_DEX="${INFO_DEX[1]}"

echo "Creating user chain 1..."
INFO_1=($(linera wallet request-chain --faucet $FAUCET_URL))
CHAIN_1="${INFO_1[0]}"
OWNER_1="${INFO_1[1]}"

echo "Creating user chain 2..."
INFO_2=($(linera wallet request-chain --faucet $FAUCET_URL))
CHAIN_2="${INFO_2[0]}"
OWNER_2="${INFO_2[1]}"

echo -e "${GREEN}✓ Chains created${NC}"
echo "DEX Chain: $CHAIN_DEX (Owner: $OWNER_DEX)"
echo "User Chain 1: $CHAIN_1 (Owner: $OWNER_1)"
echo "User Chain 2: $CHAIN_2 (Owner: $OWNER_2)"

echo -e "\n${YELLOW}⚠️  Important: You need to deploy two fungible token applications first.${NC}"
echo -e "${YELLOW}Please deploy them using the linera-protocol examples:${NC}"
echo ""
echo "Example:"
echo "  cd /path/to/linera-protocol/examples/fungible"
echo "  cargo build --release --target wasm32-unknown-unknown"
echo "  TOKEN1_APP=\$(linera publish-and-create ...)"
echo "  TOKEN2_APP=\$(linera publish-and-create ...)"
echo ""
read -p "Enter Token 1 Application ID: " TOKEN1_APP
read -p "Enter Token 2 Application ID: " TOKEN2_APP

if [ -z "$TOKEN1_APP" ] || [ -z "$TOKEN2_APP" ]; then
    echo "❌ Token application IDs are required."
    exit 1
fi

echo -e "\n${BLUE}Step 6: Deploying DEX application...${NC}"

DEX_APP_ID=$(linera --wait-for-outgoing-messages \
  publish-and-create \
  target/wasm32-unknown-unknown/release/velocity_dex_{contract,service}.wasm \
  --json-parameters "{\"tokens\":[\"$TOKEN1_APP\",\"$TOKEN2_APP\"]}" \
  --required-application-ids $TOKEN1_APP $TOKEN2_APP)

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed."
    exit 1
fi

echo -e "${GREEN}✓ DEX deployed successfully!${NC}"
echo ""
echo "================================================"
echo "🎉 Deployment Complete!"
echo "================================================"
echo ""
echo "DEX Application ID: $DEX_APP_ID"
echo ""
echo "Chain Information:"
echo "  DEX Chain: $CHAIN_DEX"
echo "  User Chain 1: $CHAIN_1"
echo "  User Chain 2: $CHAIN_2"
echo ""
echo "To start the node service, run:"
echo "  linera service --port $SERVICE_PORT"
echo ""
echo "GraphQL Endpoints:"
echo "  http://localhost:$SERVICE_PORT/chains/$CHAIN_DEX/applications/$DEX_APP_ID"
echo "  http://localhost:$SERVICE_PORT/chains/$CHAIN_1/applications/$DEX_APP_ID"
echo ""
echo "Frontend Configuration:"
echo "  Add to .env.local:"
echo "    NEXT_PUBLIC_LINERA_RPC=http://localhost:$SERVICE_PORT"
echo "    NEXT_PUBLIC_DEX_APP_ID=$DEX_APP_ID"
echo "    NEXT_PUBLIC_CHAIN_ID=$CHAIN_1"
echo ""
echo "Save this information for future reference!"
echo ""

# Save deployment info
cat > deployment-info.txt <<EOF
Velocity DEX Deployment Information
====================================
Date: $(date)

Application IDs:
  DEX: $DEX_APP_ID
  Token 1: $TOKEN1_APP
  Token 2: $TOKEN2_APP

Chains:
  DEX Chain: $CHAIN_DEX (Owner: $OWNER_DEX)
  User Chain 1: $CHAIN_1 (Owner: $OWNER_1)
  User Chain 2: $CHAIN_2 (Owner: $OWNER_2)

Endpoints:
  Node Service: http://localhost:$SERVICE_PORT
  GraphQL: http://localhost:$SERVICE_PORT/chains/$CHAIN_1/applications/$DEX_APP_ID

Environment Variables:
  export LINERA_WALLET=$LINERA_WALLET
  export LINERA_KEYSTORE=$LINERA_KEYSTORE
  export LINERA_STORAGE=$LINERA_STORAGE
EOF

echo "📝 Deployment info saved to deployment-info.txt"
