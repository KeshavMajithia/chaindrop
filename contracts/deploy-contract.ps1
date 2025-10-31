# ChainDrop Smart Contract Deployment Script
# This script deploys the file_drop.move contract to Sui Devnet

Write-Host "🚀 ChainDrop Smart Contract Deployment" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to contract directory
Set-Location -Path "$PSScriptRoot\chaindrop_contracts"

# Step 1: Check Sui CLI installation
Write-Host "📋 Step 1: Checking Sui CLI..." -ForegroundColor Yellow
try {
    $suiVersion = sui --version
    Write-Host "✅ Sui CLI found: $suiVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Sui CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   cargo install --locked --git https://github.com/MystenLabs/sui.git --branch devnet sui" -ForegroundColor White
    exit 1
}

# Step 2: Check active network
Write-Host ""
Write-Host "📋 Step 2: Checking network configuration..." -ForegroundColor Yellow
$activeEnv = sui client active-env
Write-Host "   Active environment: $activeEnv" -ForegroundColor White

if ($activeEnv -ne "devnet") {
    Write-Host "⚠️  Not on devnet. Switching to devnet..." -ForegroundColor Yellow
    sui client switch --env devnet
    Write-Host "✅ Switched to devnet" -ForegroundColor Green
} else {
    Write-Host "✅ Already on devnet" -ForegroundColor Green
}

# Step 3: Check wallet balance
Write-Host ""
Write-Host "📋 Step 3: Checking wallet balance..." -ForegroundColor Yellow
$activeAddress = sui client active-address
Write-Host "   Active address: $activeAddress" -ForegroundColor White

try {
    $gas = sui client gas
    Write-Host "✅ Wallet has gas coins" -ForegroundColor Green
} catch {
    Write-Host "❌ No gas coins found. Get testnet SUI from:" -ForegroundColor Red
    Write-Host "   https://discord.gg/sui (use !faucet command in #devnet-faucet)" -ForegroundColor White
    exit 1
}

# Step 4: Build contract
Write-Host ""
Write-Host "📋 Step 4: Building contract..." -ForegroundColor Yellow
sui move build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Contract built successfully" -ForegroundColor Green

# Step 5: Deploy contract
Write-Host ""
Write-Host "📋 Step 5: Deploying contract to Devnet..." -ForegroundColor Yellow
Write-Host "   (This may take a few seconds...)" -ForegroundColor White
Write-Host ""

$deployOutput = sui client publish --gas-budget 100000000 2>&1 | Out-String

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host $deployOutput
    exit 1
}

Write-Host $deployOutput

# Step 6: Extract Package ID
Write-Host ""
Write-Host "📋 Step 6: Extracting Package ID..." -ForegroundColor Yellow

# Parse the output to find Package ID
if ($deployOutput -match "PackageID:\s*([0-9a-fx]+)") {
    $packageId = $matches[1]
} elseif ($deployOutput -match "Published Objects:.*?PackageID:\s*([0-9a-fx]+)") {
    $packageId = $matches[1]
} elseif ($deployOutput -match "0x[a-f0-9]{64}") {
    $packageId = $matches[0]
} else {
    Write-Host "⚠️  Could not automatically extract Package ID" -ForegroundColor Yellow
    Write-Host "   Please find it manually in the output above" -ForegroundColor White
    Write-Host ""
    Write-Host "Look for a line like:" -ForegroundColor White
    Write-Host "   PackageID: 0x..." -ForegroundColor Gray
    Write-Host ""
    $packageId = Read-Host "Enter the Package ID"
}

Write-Host "✅ Package ID: $packageId" -ForegroundColor Green

# Step 7: Update .env.local
Write-Host ""
Write-Host "📋 Step 7: Updating .env.local..." -ForegroundColor Yellow

$envPath = Join-Path $PSScriptRoot ".." ".env.local"

if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    
    # Check if NEXT_PUBLIC_SUI_PACKAGE_ID exists
    if ($envContent -match "NEXT_PUBLIC_SUI_PACKAGE_ID=") {
        # Update existing value
        $envContent = $envContent -replace "NEXT_PUBLIC_SUI_PACKAGE_ID=.*", "NEXT_PUBLIC_SUI_PACKAGE_ID=$packageId"
    } else {
        # Add new line
        $envContent += "`nNEXT_PUBLIC_SUI_PACKAGE_ID=$packageId"
    }
    
    Set-Content -Path $envPath -Value $envContent
    Write-Host "✅ Updated .env.local with new Package ID" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env.local not found. Creating it..." -ForegroundColor Yellow
    
    $envTemplate = @"
# Sui Smart Contract
NEXT_PUBLIC_SUI_PACKAGE_ID=$packageId

# IPFS Providers (add your API keys)
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_here
NEXT_PUBLIC_FILEBASE_TOKEN=your_filebase_token_here
NEXT_PUBLIC_LIGHTHOUSE_API_KEY=your_lighthouse_key_here
"@
    
    Set-Content -Path $envPath -Value $envTemplate
    Write-Host "✅ Created .env.local with Package ID" -ForegroundColor Green
}

# Step 8: Summary
Write-Host ""
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Package ID: $packageId" -ForegroundColor Cyan
Write-Host "🌐 Network: Devnet" -ForegroundColor Cyan
Write-Host "👤 Deployer: $activeAddress" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔗 View on Explorer:" -ForegroundColor Yellow
Write-Host "   https://suiscan.xyz/devnet/object/$packageId" -ForegroundColor White
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Restart your Next.js dev server (npm run dev)" -ForegroundColor White
Write-Host "   2. Try creating a premium file drop" -ForegroundColor White
Write-Host "   3. The contract is now live on Sui Devnet!" -ForegroundColor White
Write-Host ""

# Return to original directory
Set-Location -Path $PSScriptRoot\..
