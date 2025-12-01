# Velocity DEX Deployment Script for Linera (PowerShell)

Write-Host "🚀 Velocity DEX Deployment Script" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Configuration
$FAUCET_PORT = 8079
$FAUCET_URL = "http://localhost:$FAUCET_PORT"
$SERVICE_PORT = 8080

Write-Host "`nStep 1: Building smart contract..." -ForegroundColor Blue
cargo build --release --target wasm32-unknown-unknown

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Please check errors above." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Build successful" -ForegroundColor Green

Write-Host "`nStep 2: Checking for Linera network..." -ForegroundColor Blue

# Check if linera is installed
if (!(Get-Command linera -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Linera CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   https://linera.dev/developers/getting_started/installation.html"
    exit 1
}

Write-Host "✓ Linera CLI found" -ForegroundColor Green

Write-Host "`nStep 3: Setting up environment..." -ForegroundColor Blue

# Create config directory
$configDir = "$env:USERPROFILE\.linera"
New-Item -ItemType Directory -Force -Path $configDir | Out-Null

$env:LINERA_WALLET = "$configDir\wallet.json"
$env:LINERA_KEYSTORE = "$configDir\keystore.json"
$env:LINERA_STORAGE = "rocksdb:$configDir\client.db"

Write-Host "LINERA_WALLET=$env:LINERA_WALLET"
Write-Host "LINERA_KEYSTORE=$env:LINERA_KEYSTORE"
Write-Host "LINERA_STORAGE=$env:LINERA_STORAGE"

Write-Host "`nNote: Make sure you have a Linera network running." -ForegroundColor Yellow
Write-Host "If not, run in another terminal: linera net up --with-faucet --faucet-port $FAUCET_PORT" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter when network is ready"

Write-Host "`nStep 4: Initializing wallet..." -ForegroundColor Blue

# Check if wallet already exists
if (Test-Path $env:LINERA_WALLET) {
    Write-Host "⚠️  Wallet already exists. Skipping initialization." -ForegroundColor Yellow
    $response = Read-Host "Do you want to create a new wallet? (y/N)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Remove-Item -Force -ErrorAction SilentlyContinue $env:LINERA_WALLET
        Remove-Item -Force -ErrorAction SilentlyContinue $env:LINERA_KEYSTORE
        Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "$configDir\client.db"
        linera wallet init --faucet $FAUCET_URL
    }
} else {
    linera wallet init --faucet $FAUCET_URL
}

Write-Host "`nStep 5: Requesting chains..." -ForegroundColor Blue

# Request chains for testing
Write-Host "Creating DEX chain..."
$dexOutput = linera wallet request-chain --faucet $FAUCET_URL
$dexInfo = $dexOutput -split '\s+'
$CHAIN_DEX = $dexInfo[0]
$OWNER_DEX = $dexInfo[1]

Write-Host "Creating user chain 1..."
$user1Output = linera wallet request-chain --faucet $FAUCET_URL
$user1Info = $user1Output -split '\s+'
$CHAIN_1 = $user1Info[0]
$OWNER_1 = $user1Info[1]

Write-Host "Creating user chain 2..."
$user2Output = linera wallet request-chain --faucet $FAUCET_URL
$user2Info = $user2Output -split '\s+'
$CHAIN_2 = $user2Info[0]
$OWNER_2 = $user2Info[1]

Write-Host "✓ Chains created" -ForegroundColor Green
Write-Host "DEX Chain: $CHAIN_DEX (Owner: $OWNER_DEX)"
Write-Host "User Chain 1: $CHAIN_1 (Owner: $OWNER_1)"
Write-Host "User Chain 2: $CHAIN_2 (Owner: $OWNER_2)"

Write-Host "`n⚠️  Important: You need to deploy two fungible token applications first." -ForegroundColor Yellow
Write-Host "Please deploy them using the linera-protocol examples:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Example:"
Write-Host "  cd /path/to/linera-protocol/examples/fungible"
Write-Host "  cargo build --release --target wasm32-unknown-unknown"
Write-Host "  `$TOKEN1_APP = linera publish-and-create ..."
Write-Host "  `$TOKEN2_APP = linera publish-and-create ..."
Write-Host ""

$TOKEN1_APP = Read-Host "Enter Token 1 Application ID"
$TOKEN2_APP = Read-Host "Enter Token 2 Application ID"

if ([string]::IsNullOrWhiteSpace($TOKEN1_APP) -or [string]::IsNullOrWhiteSpace($TOKEN2_APP)) {
    Write-Host "❌ Token application IDs are required." -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 6: Deploying DEX application..." -ForegroundColor Blue

$DEX_APP_ID = linera --wait-for-outgoing-messages `
  publish-and-create `
  target/wasm32-unknown-unknown/release/velocity_dex_contract.wasm `
  target/wasm32-unknown-unknown/release/velocity_dex_service.wasm `
  --json-parameters "{`"tokens`":[`"$TOKEN1_APP`",`"$TOKEN2_APP`"]}" `
  --required-application-ids $TOKEN1_APP $TOKEN2_APP

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed." -ForegroundColor Red
    exit 1
}

Write-Host "✓ DEX deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🎉 Deployment Complete!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "DEX Application ID: $DEX_APP_ID"
Write-Host ""
Write-Host "Chain Information:"
Write-Host "  DEX Chain: $CHAIN_DEX"
Write-Host "  User Chain 1: $CHAIN_1"
Write-Host "  User Chain 2: $CHAIN_2"
Write-Host ""
Write-Host "To start the node service, run:"
Write-Host "  linera service --port $SERVICE_PORT"
Write-Host ""
Write-Host "GraphQL Endpoints:"
Write-Host "  http://localhost:$SERVICE_PORT/chains/$CHAIN_DEX/applications/$DEX_APP_ID"
Write-Host "  http://localhost:$SERVICE_PORT/chains/$CHAIN_1/applications/$DEX_APP_ID"
Write-Host ""
Write-Host "Frontend Configuration:"
Write-Host "  Add to .env.local:"
Write-Host "    NEXT_PUBLIC_LINERA_RPC=http://localhost:$SERVICE_PORT"
Write-Host "    NEXT_PUBLIC_DEX_APP_ID=$DEX_APP_ID"
Write-Host "    NEXT_PUBLIC_CHAIN_ID=$CHAIN_1"
Write-Host ""

# Save deployment info
$deploymentInfo = @"
Velocity DEX Deployment Information
====================================
Date: $(Get-Date)

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
  `$env:LINERA_WALLET="$env:LINERA_WALLET"
  `$env:LINERA_KEYSTORE="$env:LINERA_KEYSTORE"
  `$env:LINERA_STORAGE="$env:LINERA_STORAGE"
"@

$deploymentInfo | Out-File -FilePath "deployment-info.txt" -Encoding UTF8

Write-Host "📝 Deployment info saved to deployment-info.txt"
