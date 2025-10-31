# ChainDrop Testing Guide 🧪

## Complete Testing Guide for Blockchain Features

This guide covers testing all features implemented after Sui blockchain integration, including transaction modals, premium features, drop conditions UI, and copy buttons.

---

## Prerequisites

### 1. Sui Wallet Setup
```bash
# Install Sui Wallet browser extension
# Chrome: https://chrome.google.com/webstore/detail/sui-wallet
# Firefox: https://addons.mozilla.org/firefox/addon/sui-wallet/

# Or use Suiet Wallet
# https://suiet.app/
```

### 2. Get Devnet SUI Tokens
```bash
# Visit Sui Devnet Faucet
https://discord.com/channels/916379725201563759/971488439931392130

# Or use CLI
sui client faucet

# Check balance
sui client balance
```

### 3. Environment Setup
```bash
# Make sure .env.local has correct values
NEXT_PUBLIC_SUI_PACKAGE_ID=0xb3c59b90807d28849229c0b728a73f78c977d8a50bec77654fab1a9990efcc6d
NEXT_PUBLIC_SUI_NETWORK=devnet

# Start development server
npm run dev
```

---

## Testing Checklist

### ✅ Phase 1: Wallet Connection
- [ ] Connect Sui wallet
- [ ] See wallet address in header
- [ ] See SUI balance
- [ ] Copy wallet address
- [ ] View on Suiscan Explorer
- [ ] Disconnect wallet
- [ ] Reconnect wallet (auto-reconnect)

### ✅ Phase 2: Premium Mode Upload (Free Drop)
- [ ] Enable Premium Mode
- [ ] Select a file (< 5MB for testing)
- [ ] Keep all premium features OFF
- [ ] Click "Create Drop"
- [ ] Transaction modal shows "Signing"
- [ ] Approve in wallet
- [ ] Transaction modal shows "Pending" with tx hash
- [ ] Copy transaction hash
- [ ] View on Suiscan
- [ ] Transaction modal shows "Success"
- [ ] Modal auto-closes after 5 seconds
- [ ] Shareable link displayed
- [ ] Copy shareable link

### ✅ Phase 3: Premium Features (Paid Drop)
- [ ] Enable Premium Mode
- [ ] Select a file
- [ ] Enable "Paid Transfer"
- [ ] Set price: 0.1 SUI
- [ ] Click "Create Drop"
- [ ] Transaction modal flow works
- [ ] Drop created successfully
- [ ] Get shareable link

### ✅ Phase 4: Premium Features (Time-Locked Drop)
- [ ] Enable Premium Mode
- [ ] Select a file
- [ ] Enable "Time-Locked Drop"
- [ ] Set unlock time: 5 minutes from now
- [ ] Click "Create Drop"
- [ ] Transaction modal flow works
- [ ] Drop created successfully
- [ ] Get shareable link

### ✅ Phase 5: Premium Features (Limited Claims)
- [ ] Enable Premium Mode
- [ ] Select a file
- [ ] Enable "Limited Claims"
- [ ] Set max claims: 5
- [ ] Click "Create Drop"
- [ ] Transaction modal flow works
- [ ] Drop created successfully
- [ ] Get shareable link

### ✅ Phase 6: Premium Combo (All Features)
- [ ] Enable Premium Mode
- [ ] Select a file
- [ ] Enable "Paid Transfer": 0.5 SUI
- [ ] Enable "Time-Locked Drop": 2 minutes from now
- [ ] Enable "Limited Claims": 3
- [ ] Click "Create Drop"
- [ ] Transaction modal flow works
- [ ] Drop created successfully
- [ ] Get shareable link

### ✅ Phase 7: Download Page (Free Drop)
- [ ] Open drop link (from Phase 2)
- [ ] See Drop Conditions Card
- [ ] See file name and size
- [ ] See creator address
- [ ] Copy creator address
- [ ] See creation date
- [ ] See "Available" status
- [ ] Click "Claim & Download"
- [ ] Transaction modal shows "Signing"
- [ ] Approve in wallet
- [ ] Transaction modal shows "Pending"
- [ ] Transaction modal shows "Success"
- [ ] Download starts automatically
- [ ] File downloads successfully
- [ ] Open and verify file

### ✅ Phase 8: Download Page (Paid Drop)
- [ ] Open paid drop link (from Phase 3)
- [ ] See Drop Conditions Card
- [ ] See "💰 Price: 0.1 SUI"
- [ ] See "Available" status
- [ ] Connect wallet (if not connected)
- [ ] Click "Pay 0.1 SUI & Download"
- [ ] Transaction modal shows "Signing"
- [ ] Approve payment in wallet
- [ ] Transaction modal shows "Pending"
- [ ] Transaction modal shows "Success"
- [ ] Download starts
- [ ] File downloads successfully
- [ ] Check wallet: 0.1 SUI deducted

### ✅ Phase 9: Download Page (Time-Locked Drop)
- [ ] Open time-locked drop link (from Phase 4)
- [ ] See Drop Conditions Card
- [ ] See "🕐 Unlocks At" with countdown
- [ ] See countdown timer updating
- [ ] Button shows "File is still time-locked"
- [ ] Button is disabled
- [ ] Wait for unlock time
- [ ] Countdown shows "✓ Unlocked"
- [ ] Button becomes "Claim & Download"
- [ ] Button is enabled
- [ ] Click and download

### ✅ Phase 10: Download Page (Limited Claims)
- [ ] Open limited claims drop link (from Phase 5)
- [ ] See Drop Conditions Card
- [ ] See "👥 Downloads: 0 / 5 claimed"
- [ ] See progress bar at 0%
- [ ] Click "Claim & Download"
- [ ] Download successfully
- [ ] Refresh page
- [ ] See "👥 Downloads: 1 / 5 claimed"
- [ ] See progress bar at 20%
- [ ] Share link with others (or use different wallet)
- [ ] Repeat until 5/5 claims
- [ ] See "👥 Downloads: 5 / 5 claimed"
- [ ] See progress bar at 100%
- [ ] Button shows "Maximum downloads reached"
- [ ] Button is disabled

### ✅ Phase 11: Copy Button Components
- [ ] Copy creator address (inline button)
- [ ] See check icon feedback
- [ ] Copy transaction hash
- [ ] Copy shareable link
- [ ] Copy drop ID
- [ ] All show "Copied!" feedback
- [ ] All reset after 2 seconds

### ✅ Phase 12: Error Scenarios
- [ ] Try to create drop without wallet
- [ ] See "Connect wallet" message
- [ ] Try to download paid drop without wallet
- [ ] See "Connect wallet to purchase" message
- [ ] Try to download before time-lock expires
- [ ] See "File is still time-locked" message
- [ ] Try to download sold-out drop
- [ ] See "Maximum downloads reached" message
- [ ] Reject transaction in wallet
- [ ] See error modal with retry button
- [ ] Click retry and approve
- [ ] Transaction succeeds

---

## Detailed Testing Procedures

### Test 1: Free Drop End-to-End

**Upload Side**:
```
1. Open http://localhost:3000/app
2. Click "Connect Wallet" → Approve
3. Toggle "Premium Mode" ON
4. Click "Select Files" → Choose test.pdf
5. Keep all premium toggles OFF
6. Click "Create Drop"
7. Modal appears: "Sign Transaction"
8. Approve in wallet
9. Modal shows: "Creating Drop..." with tx hash
10. Click tx hash → Opens Suiscan
11. Modal shows: "Drop Created Successfully!"
12. Copy shareable link
13. Modal auto-closes after 5s
```

**Download Side**:
```
1. Open shareable link in new tab/incognito
2. See Drop Conditions Card:
   - 📄 test.pdf (X KB)
   - 👤 Creator: 0x1234...5678
   - 📅 Created: Oct 27, 2025
3. Click copy button next to creator address
4. See ✓ icon feedback
5. Click "Claim & Download"
6. Modal: "Sign to Claim Drop"
7. Approve in wallet
8. Modal: "Claiming Drop..." with tx hash
9. Modal: "Drop Claimed Successfully!"
10. Modal auto-closes after 2s
11. Download starts automatically
12. File saves to Downloads folder
13. Open file and verify contents
```

**Expected Results**:
- ✅ File uploads to IPFS (sharded)
- ✅ Drop created on blockchain
- ✅ Transaction hash visible on Suiscan
- ✅ Download page loads correctly
- ✅ Claim transaction succeeds
- ✅ File downloads and opens correctly

---

### Test 2: Paid Drop End-to-End

**Upload Side**:
```
1. Open http://localhost:3000/app
2. Connect wallet
3. Enable Premium Mode
4. Select file
5. Toggle "Paid Transfer" ON
6. Enter price: 0.5 SUI
7. Click "Create Drop"
8. Approve transaction
9. Wait for success
10. Copy shareable link
```

**Download Side (Different Wallet)**:
```
1. Open link in different browser/wallet
2. See Drop Conditions Card:
   - 💰 Price: 0.5 SUI
3. Connect wallet
4. Check initial balance (e.g., 10 SUI)
5. Click "Pay 0.5 SUI & Download"
6. Approve payment transaction
7. Wait for claim success
8. Download starts
9. Check balance: 9.5 SUI (minus gas)
```

**Creator Side (After Download)**:
```
1. Check creator wallet balance
2. Should receive 0.5 SUI (after confirmDownload)
3. Verify on Suiscan:
   - EscrowReleased event
   - Payment transfer
```

**Expected Results**:
- ✅ Buyer pays 0.5 SUI
- ✅ Funds held in escrow
- ✅ Download succeeds
- ✅ Creator receives 0.5 SUI
- ✅ All transactions on Suiscan

---

### Test 3: Time-Locked Drop

**Setup**:
```
1. Create drop with time-lock: 3 minutes from now
2. Note exact unlock time
3. Copy shareable link
```

**Before Unlock**:
```
1. Open link immediately
2. See countdown: 02:59, 02:58, 02:57...
3. Button shows: "File is still time-locked"
4. Button is disabled (grayed out)
5. Try clicking → Nothing happens
6. Refresh page → Countdown continues
```

**At Unlock**:
```
1. Wait for countdown to reach 00:00
2. See "✓ Unlocked" message
3. Button changes to "Claim & Download"
4. Button is enabled (clickable)
5. Click and download successfully
```

**Expected Results**:
- ✅ Countdown updates every second
- ✅ Button disabled before unlock
- ✅ Button enabled after unlock
- ✅ Download works after unlock

---

### Test 4: Limited Claims Drop

**Setup**:
```
1. Create drop with max claims: 3
2. Copy shareable link
```

**Claim 1 (Wallet A)**:
```
1. Open link with Wallet A
2. See "👥 Downloads: 0 / 3 claimed"
3. Progress bar: [░░░░░░░░░░] 0%
4. Click "Claim & Download"
5. Download succeeds
6. Refresh page
7. See "👥 Downloads: 1 / 3 claimed"
8. Progress bar: [███░░░░░░░] 33%
```

**Claim 2 (Wallet B)**:
```
1. Open link with Wallet B
2. See "👥 Downloads: 1 / 3 claimed"
3. Progress bar: [███░░░░░░░] 33%
4. Click "Claim & Download"
5. Download succeeds
6. Refresh page
7. See "👥 Downloads: 2 / 3 claimed"
8. Progress bar: [██████░░░░] 67%
```

**Claim 3 (Wallet C)**:
```
1. Open link with Wallet C
2. See "👥 Downloads: 2 / 3 claimed"
3. Progress bar: [██████░░░░] 67%
4. Click "Claim & Download"
5. Download succeeds
6. Refresh page
7. See "👥 Downloads: 3 / 3 claimed"
8. Progress bar: [██████████] 100%
```

**Claim 4 (Wallet D - Should Fail)**:
```
1. Open link with Wallet D
2. See "👥 Downloads: 3 / 3 claimed"
3. Progress bar: [██████████] 100%
4. Button shows: "Maximum downloads reached"
5. Button is disabled
6. Try clicking → Nothing happens
```

**Expected Results**:
- ✅ Counter increments correctly
- ✅ Progress bar updates
- ✅ 4th claim is blocked
- ✅ All on-chain (verify on Suiscan)

---

### Test 5: Premium Combo (All Features)

**Setup**:
```
1. Create drop with:
   - Price: 1 SUI
   - Time-lock: 2 minutes from now
   - Max claims: 2
2. Copy link
```

**Before Unlock**:
```
1. Open link
2. See all three features:
   - 💰 Price: 1.0 SUI
   - 🕐 Unlocks At: 01:59...
   - 👥 Downloads: 0 / 2 claimed
3. Button disabled: "File is still time-locked"
```

**After Unlock, Claim 1**:
```
1. Wait for unlock
2. Button: "Pay 1.0 SUI & Download"
3. Click and approve payment
4. Download succeeds
5. Refresh: "👥 Downloads: 1 / 2 claimed"
```

**After Unlock, Claim 2**:
```
1. Different wallet opens link
2. See "👥 Downloads: 1 / 2 claimed"
3. Button: "Pay 1.0 SUI & Download"
4. Click and approve payment
5. Download succeeds
6. Refresh: "👥 Downloads: 2 / 2 claimed"
```

**After Unlock, Claim 3 (Should Fail)**:
```
1. Third wallet opens link
2. See "👥 Downloads: 2 / 2 claimed"
3. Button: "Maximum downloads reached"
4. Button disabled
```

**Expected Results**:
- ✅ Time-lock enforced
- ✅ Payment required
- ✅ Claims limited to 2
- ✅ All features work together

---

## Verification on Suiscan

### View Transaction Details

```
1. Copy transaction hash from modal
2. Visit: https://suiscan.xyz/devnet/tx/{txHash}
3. Check:
   - Status: Success
   - Gas Used: ~0.001 SUI
   - Object Changes: FileDrop created
   - Events: DropCreated
```

### View Drop Object

```
1. Copy drop object ID
2. Visit: https://suiscan.xyz/devnet/object/{dropId}
3. Check fields:
   - metadata_cid: QmXXX...
   - creator: 0xYYY...
   - price: 1000000000 (if paid)
   - unlock_time: timestamp (if time-locked)
   - max_claims: 2 (if limited)
   - current_claims: 0, 1, 2...
```

### View Claim Transaction

```
1. After claiming, copy claim tx hash
2. Visit: https://suiscan.xyz/devnet/tx/{claimTxHash}
3. Check:
   - Function: claim_drop
   - Events: DropClaimed
   - Coin transfers (if paid)
```

---

## Common Issues & Solutions

### Issue 1: Wallet Not Connecting

**Symptoms**:
- "Connect Wallet" button doesn't work
- No wallet popup appears

**Solutions**:
```
1. Check browser extension is installed
2. Refresh page
3. Check wallet is unlocked
4. Try different wallet (Sui Wallet, Suiet)
5. Check console for errors
```

### Issue 2: Transaction Fails

**Symptoms**:
- Error modal appears
- Transaction rejected

**Solutions**:
```
1. Check wallet has enough SUI
2. Check gas budget is sufficient
3. Retry transaction
4. Check network (should be Devnet)
5. Check contract address is correct
```

### Issue 3: File Upload Fails

**Symptoms**:
- Upload progress stuck
- Error during IPFS upload

**Solutions**:
```
1. Check file size (< 100MB recommended)
2. Check internet connection
3. Try different file
4. Check IPFS provider API keys
5. Check console for errors
```

### Issue 4: Download Fails

**Symptoms**:
- Download doesn't start
- File corrupted

**Solutions**:
```
1. Check metadata CID is correct
2. Check IPFS providers are accessible
3. Retry download
4. Check browser download settings
5. Check console for errors
```

### Issue 5: Time-Lock Not Working

**Symptoms**:
- Countdown doesn't update
- Button enabled before unlock

**Solutions**:
```
1. Refresh page
2. Check system time is correct
3. Check unlock_time on Suiscan
4. Wait for full unlock time
```

### Issue 6: Claims Counter Wrong

**Symptoms**:
- Counter doesn't increment
- Shows wrong number

**Solutions**:
```
1. Refresh page
2. Check on Suiscan
3. Wait for blockchain confirmation
4. Check current_claims field
```

---

## Performance Testing

### Upload Performance

```
Test different file sizes:
- 1 KB: Should take < 5 seconds
- 100 KB: Should take < 10 seconds
- 1 MB: Should take < 30 seconds
- 10 MB: Should take < 2 minutes
- 100 MB: Should take < 10 minutes

Monitor:
- IPFS upload progress
- Chunk distribution
- Blockchain transaction time
```

### Download Performance

```
Test download speeds:
- 1 KB: Instant
- 100 KB: < 5 seconds
- 1 MB: < 15 seconds
- 10 MB: < 1 minute
- 100 MB: < 5 minutes

Monitor:
- Chunk download progress
- Parallel downloads
- Reassembly time
```

### Transaction Performance

```
Typical times:
- Wallet signature: 2-10 seconds (user dependent)
- Blockchain confirmation: 2-5 seconds
- Transaction indexing: 2-5 seconds
- Total: 6-20 seconds

Monitor:
- Transaction submission
- Confirmation time
- Indexing delays
```

---

## Browser Compatibility Testing

### Desktop Browsers

```
✅ Chrome 120+
✅ Firefox 120+
✅ Safari 17+
✅ Edge 120+

Test on each:
- Wallet connection
- File upload
- Transaction signing
- File download
- Copy functionality
```

### Mobile Browsers

```
✅ Chrome Mobile
✅ Safari Mobile
✅ Firefox Mobile

Test on each:
- Responsive layout
- Touch interactions
- Wallet connection (mobile wallets)
- File selection
- Download functionality
```

---

## Security Testing

### Test Scenarios

```
1. Unauthorized Access:
   - Try to claim without wallet
   - Try to download before claiming
   - Try to bypass time-lock
   - Try to exceed max claims

2. Payment Security:
   - Verify escrow holding
   - Verify payment release
   - Try to claim without payment
   - Try to pay wrong amount

3. Data Integrity:
   - Verify file checksums
   - Verify encryption
   - Verify chunk integrity
   - Verify metadata accuracy
```

---

## Automated Testing (Optional)

### Unit Tests

```typescript
// Test copy button
describe('CopyButton', () => {
  it('copies text to clipboard', async () => {
    // Test implementation
  })
  
  it('shows copied feedback', async () => {
    // Test implementation
  })
})

// Test premium options
describe('PremiumOptionsPanel', () => {
  it('enables price input when toggled', () => {
    // Test implementation
  })
})
```

### Integration Tests

```typescript
// Test upload flow
describe('Upload Flow', () => {
  it('creates drop with premium features', async () => {
    // Test implementation
  })
})

// Test download flow
describe('Download Flow', () => {
  it('claims and downloads file', async () => {
    // Test implementation
  })
})
```

---

## Testing Checklist Summary

### Quick Test (15 minutes)
- [ ] Connect wallet
- [ ] Create free drop
- [ ] Download file
- [ ] Verify on Suiscan

### Standard Test (30 minutes)
- [ ] All quick test items
- [ ] Create paid drop
- [ ] Test time-lock
- [ ] Test limited claims
- [ ] Test copy buttons

### Complete Test (60 minutes)
- [ ] All standard test items
- [ ] Test all premium combos
- [ ] Test error scenarios
- [ ] Verify all on Suiscan
- [ ] Test on multiple browsers

### Production Test (2+ hours)
- [ ] All complete test items
- [ ] Performance testing
- [ ] Security testing
- [ ] Mobile testing
- [ ] Load testing

---

## Test Data

### Sample Files

```
Create test files:
- small.txt (1 KB)
- medium.pdf (500 KB)
- large.zip (5 MB)
- image.png (2 MB)
- document.docx (1 MB)
```

### Sample Wallets

```
Use multiple wallets for testing:
- Wallet A: Creator
- Wallet B: Downloader 1
- Wallet C: Downloader 2
- Wallet D: Downloader 3
```

### Sample Prices

```
Test different prices:
- 0.01 SUI (minimum)
- 0.1 SUI (small)
- 1 SUI (medium)
- 10 SUI (large)
```

---

## Success Criteria

### ✅ All Tests Pass When:

1. **Wallet Integration**:
   - Connects successfully
   - Shows correct balance
   - Signs transactions
   - Disconnects properly

2. **Upload Flow**:
   - Files upload to IPFS
   - Drops create on blockchain
   - Transaction modals work
   - Links are shareable

3. **Download Flow**:
   - Drop details load
   - Conditions display correctly
   - Claims work on blockchain
   - Files download successfully

4. **Premium Features**:
   - Paid drops require payment
   - Time-locks enforce timing
   - Limited claims enforce limits
   - All features work together

5. **UI Components**:
   - Transaction modals show correct states
   - Drop conditions card displays all info
   - Copy buttons work reliably
   - Premium options panel functions

6. **Error Handling**:
   - Errors display clearly
   - Retry functionality works
   - Validation prevents invalid states
   - User feedback is helpful

---

## Reporting Issues

### Issue Template

```markdown
**Issue**: Brief description

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**:
What should happen

**Actual Behavior**:
What actually happened

**Environment**:
- Browser: Chrome 120
- Wallet: Sui Wallet 1.0
- Network: Devnet
- File: test.pdf (500 KB)

**Screenshots**:
[Attach screenshots]

**Console Errors**:
[Paste console errors]

**Transaction Hash**:
0x1234...5678
```

---

## Conclusion

This testing guide covers all features implemented after Sui blockchain integration. Follow the procedures systematically to ensure everything works correctly before production deployment.

**Happy Testing!** 🧪✨

---

**Last Updated**: October 27, 2025  
**Version**: 1.0  
**Status**: ✅ Ready for Testing
