# Step 1: Initialize Sui Wallet
# This script helps you set up your Sui wallet for the first time

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     ChainDrop - Sui Wallet Initialization             ║" -ForegroundColor Cyan
Write-Host "║              Step 1 of 3: Setup Wallet                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if Sui CLI is installed
Write-Host "🔍 Checking Sui CLI installation..." -ForegroundColor Yellow
try {
    $suiVersion = sui --version
    Write-Host "✅ Sui CLI found: $suiVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Sui CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Sui CLI first:" -ForegroundColor Yellow
    Write-Host "   cargo install --locked --git https://github.com/MystenLabs/sui.git --branch devnet sui" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "📋 This script will:" -ForegroundColor Yellow
Write-Host "   1. Initialize Sui client configuration" -ForegroundColor White
Write-Host "   2. Create a new wallet address" -ForegroundColor White
Write-Host "   3. Show you how to get testnet SUI tokens" -ForegroundColor White
Write-Host ""

$continue = Read-Host "Continue? (y/n)"
if ($continue -ne "y") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Step 1: Initialize Sui Client" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if wallet already exists
$configPath = "$env:USERPROFILE\.sui\sui_config\client.yaml"
if (Test-Path $configPath) {
    Write-Host "⚠️  Sui wallet already initialized!" -ForegroundColor Yellow
    Write-Host "   Config found at: $configPath" -ForegroundColor White
    Write-Host ""
    
    $recreate = Read-Host "Do you want to create a NEW address in existing wallet? (y/n)"
    if ($recreate -eq "y") {
        Write-Host ""
        Write-Host "Creating new address..." -ForegroundColor Yellow
        sui client new-address ed25519
        
        Write-Host ""
        Write-Host "✅ New address created!" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  IMPORTANT: Save the recovery phrase shown above!" -ForegroundColor Red
        Write-Host ""
    }
} else {
    Write-Host "Initializing Sui client..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "When prompted:" -ForegroundColor Cyan
    Write-Host "   - 'Connect to Sui Full node?' → Type: y" -ForegroundColor White
    Write-Host "   - 'Select network' → Choose: 0 (devnet)" -ForegroundColor White
    Write-Host ""
    
    # Initialize client (interactive)
    sui client
    
    Write-Host ""
    Write-Host "✅ Sui client initialized!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Creating your first address..." -ForegroundColor Yellow
    sui client new-address ed25519
    
    Write-Host ""
    Write-Host "✅ Address created!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Save the recovery phrase shown above!" -ForegroundColor Red
    Write-Host "   You'll need it to recover your wallet." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Step 2: Get Your Address" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$address = sui client active-address
Write-Host "📍 Your active address:" -ForegroundColor Cyan
Write-Host "   $address" -ForegroundColor White
Write-Host ""

# Copy to clipboard if possible
try {
    $address | Set-Clipboard
    Write-Host "✅ Address copied to clipboard!" -ForegroundColor Green
} catch {
    Write-Host "💡 Copy the address above manually" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Step 3: Get Testnet SUI Tokens" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "You need testnet SUI tokens to deploy the contract." -ForegroundColor White
Write-Host ""
Write-Host "🎯 Option 1: Discord Faucet (Recommended)" -ForegroundColor Cyan
Write-Host "   1. Join Sui Discord: https://discord.gg/sui" -ForegroundColor White
Write-Host "   2. Go to #devnet-faucet channel" -ForegroundColor White
Write-Host "   3. Type: !faucet $address" -ForegroundColor Green
Write-Host "   4. Wait ~30 seconds" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Option 2: Web Faucet" -ForegroundColor Cyan
Write-Host "   1. Go to: https://faucet.sui.io/" -ForegroundColor White
Write-Host "   2. Select 'Devnet'" -ForegroundColor White
Write-Host "   3. Paste your address" -ForegroundColor White
Write-Host "   4. Click 'Request SUI'" -ForegroundColor White
Write-Host ""

Write-Host "Press Enter after you've requested tokens..." -ForegroundColor Yellow
Read-Host

Write-Host ""
Write-Host "Checking for gas coins..." -ForegroundColor Yellow
Write-Host ""

sui client gas

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Wallet Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Sui client initialized" -ForegroundColor Green
Write-Host "   ✅ Wallet address created" -ForegroundColor Green
Write-Host "   ✅ Address: $address" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Next Step:" -ForegroundColor Yellow
Write-Host "   Run: .\2-deploy-contract.ps1" -ForegroundColor White
Write-Host "   Or: .\deploy-contract.ps1 (automated)" -ForegroundColor White
Write-Host ""
