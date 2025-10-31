# ChainDrop Contract Test Script
# Run this to test your deployed contract

$PACKAGE_ID = "0xb3c59b90807d28849229c0b728a73f78c977d8a50bec77654fab1a9990efcc6d"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ChainDrop Contract Testing" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Create a free drop
Write-Host "Test 1: Creating a FREE drop..." -ForegroundColor Yellow
Write-Host "Command: sui client call --package $PACKAGE_ID --module file_drop --function create_drop" -ForegroundColor Gray
Write-Host ""

sui client call `
  --package $PACKAGE_ID `
  --module file_drop `
  --function create_drop `
  --args "QmTestFile123ABC" "[]" "[]" "[]" "0x6" `
  --gas-budget 10000000

Write-Host ""
Write-Host "✅ If successful, copy the 'Created Objects' ObjectID above!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Show balance
Write-Host "Your current balance:" -ForegroundColor Yellow
sui client gas

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Copy the DROP_OBJECT_ID from the output above" -ForegroundColor White
Write-Host "2. View drop details: sui client object <DROP_OBJECT_ID>" -ForegroundColor White
Write-Host "3. Claim the drop: sui client call --package $PACKAGE_ID --module file_drop --function claim_drop --args <DROP_OBJECT_ID> '[]' '0x6' --gas-budget 10000000" -ForegroundColor White
Write-Host ""
Write-Host "View on Explorer:" -ForegroundColor Yellow
Write-Host "https://suiscan.xyz/devnet/object/$PACKAGE_ID" -ForegroundColor Blue
Write-Host ""
Write-Host "Full test guide: See TEST_CONTRACT.md" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
