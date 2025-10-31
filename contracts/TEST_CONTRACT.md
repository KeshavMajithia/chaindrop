# Testing Your ChainDrop Smart Contract

## Your Deployed Contract
- **Package ID**: `0xb3c59b90807d28849229c0b728a73f78c977d8a50bec77654fab1a9990efcc6d`
- **Network**: Devnet
- **Your Address**: `0xeac5163c45ddaa06e8b8e64c886e3d1f00fba676dee37fbd577b8d5bbd378984`

## Quick Test Commands

### Test 1: Create a Free Drop

```bash
sui client call \
  --package 0xb3c59b90807d28849229c0b728a73f78c977d8a50bec77654fab1a9990efcc6d \
  --module file_drop \
  --function create_drop \
  --args "QmTestFile123ABC" "[]" "[]" "[]" "0x6" \
  --gas-budget 10000000
```

**What this does:**
- Creates a free drop (no price)
- No time-lock (available immediately)
- No claim limit (unlimited downloads)
- Metadata CID: "QmTestFile123ABC"

**Expected output:**
```
Transaction Digest: ...
Created Objects:
  - ObjectID: 0x... (This is your FileDrop object)
```

**Save the ObjectID** - you'll need it for the next tests!

---

### Test 2: View Drop Details

Replace `<DROP_OBJECT_ID>` with the ObjectID from Test 1:

```bash
sui client object <DROP_OBJECT_ID>
```

**Expected output:**
```json
{
  "metadata_cid": "QmTestFile123ABC",
  "creator": "0xeac5163c45ddaa06e8b8e64c886e3d1f00fba676dee37fbd577b8d5bbd378984",
  "created_at": 1735689600000,
  "price": null,
  "unlock_time": null,
  "max_claims": null,
  "current_claims": 0,
  "escrow_balance": 0,
  "download_confirmed": false
}
```

---

### Test 3: Claim the Drop (Download)

```bash
sui client call \
  --package 0xb3c59b90807d28849229c0b728a73f78c977d8a50bec77654fab1a9990efcc6d \
  --module file_drop \
  --function claim_drop \
  --args <DROP_OBJECT_ID> "[]" "0x6" \
  --gas-budget 10000000
```

**What this does:**
- Claims/downloads the file
- No payment needed (it's free)
- Returns the metadata CID

**Expected output:**
```
Transaction Digest: ...
Events:
  - DropClaimed {
      drop_id: "0x...",
      claimer: "0xeac5...",
      payment_amount: null,
      claim_number: 1
    }
```

---

### Test 4: Check Updated Drop

```bash
sui client object <DROP_OBJECT_ID>
```

**You should see:**
- `current_claims: 1` (incremented!)

---

### Test 5: Create a Paid Drop (1 SUI)

```bash
sui client call \
  --package 0xb3c59b90807d28849229c0b728a73f78c977d8a50bec77654fab1a9990efcc6d \
  --module file_drop \
  --function create_drop \
  --args "QmPaidFile456DEF" "[1000000000]" "[]" "[]" "0x6" \
  --gas-budget 10000000
```

**What this does:**
- Creates a paid drop
- Price: 1 SUI (1,000,000,000 MIST)
- Save the new DROP_OBJECT_ID!

---

### Test 6: Claim Paid Drop (with Payment)

First, get a coin to pay with:
```bash
sui client gas
```

Copy one of your coin IDs, then:

```bash
sui client call \
  --package 0xb3c59b90807d28849229c0b728a73f78c977d8a50bec77654fab1a9990efcc6d \
  --module file_drop \
  --function claim_drop \
  --args <PAID_DROP_OBJECT_ID> "<YOUR_COIN_ID>" "0x6" \
  --gas-budget 10000000
```

**What this does:**
- Claims the paid drop
- Sends 1 SUI as payment
- Payment goes to escrow

---

### Test 7: Confirm Download (Release Escrow)

```bash
sui client call \
  --package 0xb3c59b90807d28849229c0b728a73f78c977d8a50bec77654fab1a9990efcc6d \
  --module file_drop \
  --function confirm_download \
  --args <PAID_DROP_OBJECT_ID> \
  --gas-budget 10000000
```

**What this does:**
- Confirms successful download
- Releases 1 SUI from escrow to creator (you!)
- Check your balance: `sui client gas`

---

### Test 8: Create Time-Locked Drop

Create a drop that unlocks in 1 hour:
```bash
# Get current timestamp + 1 hour (in milliseconds)
# Current time: ~1735689600000
# Add 3600000 ms (1 hour)
# Result: 1735693200000

sui client call \
  --package 0xb3c59b90807d28849229c0b728a73f78c977d8a50bec77654fab1a9990efcc6d \
  --module file_drop \
  --function create_drop \
  --args "QmTimeLocked789GHI" "[]" "[1735693200000]" "[]" "0x6" \
  --gas-budget 10000000
```

Try to claim it immediately (should fail):
```bash
sui client call \
  --package 0xb3c59b90807d28849229c0b728a73f78c977d8a50bec77654fab1a9990efcc6d \
  --module file_drop \
  --function claim_drop \
  --args <TIMELOCKED_DROP_ID> "[]" "0x6" \
  --gas-budget 10000000
```

**Expected error:**
```
Error: E_NOT_UNLOCKED (code 1)
```

---

### Test 9: Create Limited Drop

Create a drop with max 5 claims:
```bash
sui client call \
  --package 0xb3c59b90807d28849229c0b728a73f78c977d8a50bec77654fab1a9990efcc6d \
  --module file_drop \
  --function create_drop \
  --args "QmLimitedEdition999JKL" "[]" "[]" "[5]" "0x6" \
  --gas-budget 10000000
```

Claim it multiple times and watch `current_claims` increment!

---

### Test 10: View All Events

See all drop activity:
```bash
sui client events --package 0xb3c59b90807d28849229c0b728a73f78c977d8a50bec77654fab1a9990efcc6d
```

---

## Quick Test Script

Run all tests at once:

```bash
# Test 1: Create free drop
echo "Creating free drop..."
sui client call --package 0xb3c59b90807d28849229c0b728a73f78c977d8a50bec77654fab1a9990efcc6d --module file_drop --function create_drop --args "QmTest123" "[]" "[]" "[]" "0x6" --gas-budget 10000000

# Check your balance
echo "Checking balance..."
sui client gas

# View contract on explorer
echo "View on explorer: https://suiscan.xyz/devnet/object/0xb3c59b90807d28849229c0b728a73f78c977d8a50bec77654fab1a9990efcc6d"
```

---

## Verify on Sui Explorer

**Contract Page:**
https://suiscan.xyz/devnet/object/0xb3c59b90807d28849229c0b728a73f78c977d8a50bec77654fab1a9990efcc6d

**Your Wallet:**
https://suiscan.xyz/devnet/account/0xeac5163c45ddaa06e8b8e64c886e3d1f00fba676dee37fbd577b8d5bbd378984

You can see:
- All transactions
- Created drops
- Events emitted
- Balance changes

---

## Common Issues

### "Object not found"
- Make sure you saved the DROP_OBJECT_ID from the create_drop output
- Check you're on devnet: `sui client active-env`

### "Insufficient gas"
- Get more tokens: `sui client faucet`
- Check balance: `sui client gas`

### "Invalid argument"
- Use `[]` for empty Option
- Use `[value]` for Some(value)
- Clock is always `0x6`

### "E_INCORRECT_PAYMENT"
- Make sure coin value matches the price exactly
- Split coins if needed: `sui client split-coin`

---

## Success Indicators

✅ **Contract works if:**
1. Create drop succeeds → Returns ObjectID
2. View drop shows correct data
3. Claim drop increments `current_claims`
4. Paid drops hold payment in escrow
5. Confirm download releases escrow
6. Time-locks block early claims
7. Limited drops stop after max_claims

---

## Next: Integrate with Frontend

Once testing is complete, add to `.env.local`:
```env
NEXT_PUBLIC_SUI_PACKAGE_ID=0xb3c59b90807d28849229c0b728a73f78c977d8a50bec77654fab1a9990efcc6d
NEXT_PUBLIC_SUI_NETWORK=devnet
```

Then update your frontend to call these functions using `@mysten/sui.js`!
