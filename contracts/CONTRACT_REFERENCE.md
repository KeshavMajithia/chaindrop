# ChainDrop Smart Contract Reference

## Quick Overview

The `file_drop` module provides a complete file sharing system with premium features on Sui blockchain.

## Core Concepts

### FileDrop Object
Each file drop is represented by a `FileDrop` object that contains:
- **metadata_cid**: IPFS CID pointing to the chunk map (sharded storage)
- **creator**: Address of the person who created the drop
- **created_at**: Timestamp when drop was created
- **price**: Optional price in MIST (None = free)
- **unlock_time**: Optional timestamp (None = available immediately)
- **max_claims**: Optional claim limit (None = unlimited)
- **current_claims**: Number of times file has been claimed
- **escrow_balance**: Holds payment until download confirmed
- **download_confirmed**: Whether buyer confirmed successful download

### Premium Features

#### 1. Free Drops (Default)
```move
create_drop(
    metadata_cid: "QmXYZ...",
    price: None,           // Free!
    unlock_time: None,
    max_claims: None,
    ...
)
```

#### 2. Paid Transfers
```move
create_drop(
    metadata_cid: "QmXYZ...",
    price: Some(1_000_000_000),  // 1 SUI
    unlock_time: None,
    max_claims: None,
    ...
)
```

**How it works:**
1. Creator sets price when creating drop
2. Claimer must send exact payment when claiming
3. Payment held in escrow
4. After download, claimer calls `confirm_download()`
5. Escrow released to creator

#### 3. Time-Locked Drops
```move
create_drop(
    metadata_cid: "QmXYZ...",
    price: None,
    unlock_time: Some(1735689600000),  // Jan 1, 2025
    max_claims: None,
    ...
)
```

**How it works:**
1. Creator sets future timestamp
2. Claims fail with `E_NOT_UNLOCKED` before that time
3. After unlock time, anyone can claim

**Use cases:**
- Scheduled releases
- Timed exclusives
- Event-based access

#### 4. Limited Claims
```move
create_drop(
    metadata_cid: "QmXYZ...",
    price: None,
    unlock_time: None,
    max_claims: Some(100),  // Only 100 downloads
    ...
)
```

**How it works:**
1. Creator sets maximum number of claims
2. Each claim increments `current_claims`
3. When limit reached, claims fail with `E_MAX_CLAIMS_REACHED`

**Use cases:**
- Limited editions
- Exclusive content
- Scarcity mechanics

#### 5. Combined Features
```move
// Paid + Time-locked + Limited
create_drop(
    metadata_cid: "QmXYZ...",
    price: Some(5_000_000_000),      // 5 SUI
    unlock_time: Some(1735689600000), // Jan 1, 2025
    max_claims: Some(50),             // Only 50 copies
    ...
)
```

## Function Reference

### create_drop()
**Purpose:** Create a new file drop

**Parameters:**
- `metadata_cid: vector<u8>` - IPFS CID of chunk map
- `price: Option<u64>` - Price in MIST or None
- `unlock_time: Option<u64>` - Unix timestamp in ms or None
- `max_claims: Option<u64>` - Max claims or None
- `clock: &Clock` - Sui Clock object (always `0x6`)
- `ctx: &mut TxContext` - Transaction context

**Returns:** Transfers `FileDrop` object to creator

**Events:** Emits `DropCreated`

**Example:**
```bash
sui client call \
  --function create_drop \
  --args "QmXYZ..." "[]" "[]" "[]" "0x6"
```

---

### claim_drop()
**Purpose:** Claim/download a file

**Parameters:**
- `drop: &mut FileDrop` - The drop to claim
- `payment: Option<Coin<SUI>>` - Payment coin or None
- `clock: &Clock` - Sui Clock object
- `ctx: &mut TxContext` - Transaction context

**Returns:** `String` - The metadata CID for download

**Checks:**
1. ✅ Time-lock (if set)
2. ✅ Max claims (if set)
3. ✅ Payment (if required)

**Events:** Emits `DropClaimed`

**Example (free):**
```bash
sui client call \
  --function claim_drop \
  --args <DROP_ID> "[]" "0x6"
```

**Example (paid):**
```bash
sui client call \
  --function claim_drop \
  --args <DROP_ID> <COIN_ID> "0x6"
```

---

### confirm_download()
**Purpose:** Confirm successful download and release escrow

**Parameters:**
- `drop: &mut FileDrop` - The drop to confirm
- `ctx: &mut TxContext` - Transaction context

**Effects:**
- Sets `download_confirmed = true`
- Transfers escrow balance to creator

**Events:** Emits `EscrowReleased`

**Example:**
```bash
sui client call \
  --function confirm_download \
  --args <DROP_ID>
```

---

### cancel_drop()
**Purpose:** Cancel drop and refund escrow (creator only)

**Parameters:**
- `drop: FileDrop` - The drop to cancel (consumes object)
- `ctx: &mut TxContext` - Transaction context

**Checks:**
- ✅ Caller is creator
- ✅ Not already confirmed

**Effects:**
- Refunds escrow to creator
- Deletes drop object

**Example:**
```bash
sui client call \
  --function cancel_drop \
  --args <DROP_ID>
```

## View Functions

All view functions are read-only and don't modify state:

| Function | Returns | Description |
|----------|---------|-------------|
| `get_metadata_cid()` | `String` | IPFS CID of chunk map |
| `get_creator()` | `address` | Creator's address |
| `get_created_at()` | `u64` | Creation timestamp |
| `get_price()` | `Option<u64>` | Price in MIST |
| `get_unlock_time()` | `Option<u64>` | Unlock timestamp |
| `get_max_claims()` | `Option<u64>` | Maximum claims |
| `get_current_claims()` | `u64` | Current claim count |
| `get_escrow_balance()` | `u64` | Escrow amount in MIST |
| `is_download_confirmed()` | `bool` | Confirmation status |

## Events

### DropCreated
Emitted when a new drop is created
```json
{
  "drop_id": "0x123...",
  "creator": "0xabc...",
  "metadata_cid": "QmXYZ...",
  "price": 1000000000,
  "unlock_time": 1735689600000,
  "max_claims": 100
}
```

### DropClaimed
Emitted when someone claims a drop
```json
{
  "drop_id": "0x123...",
  "claimer": "0xdef...",
  "payment_amount": 1000000000,
  "claim_number": 1
}
```

### EscrowReleased
Emitted when escrow is released to creator
```json
{
  "drop_id": "0x123...",
  "creator": "0xabc...",
  "amount": 1000000000
}
```

## Error Codes

| Code | Constant | Meaning |
|------|----------|---------|
| 1 | `E_NOT_UNLOCKED` | Drop is time-locked |
| 2 | `E_MAX_CLAIMS_REACHED` | Claim limit reached |
| 3 | `E_PAYMENT_REQUIRED` | Payment missing |
| 4 | `E_INCORRECT_PAYMENT` | Wrong payment amount |
| 5 | `E_NOT_CREATOR` | Not authorized |
| 6 | `E_DOWNLOAD_NOT_CONFIRMED` | Download not confirmed |
| 7 | `E_ALREADY_CONFIRMED` | Already confirmed |

## Common Patterns

### Pattern 1: Free Public Drop
```move
create_drop("QmXYZ...", None, None, None, clock, ctx)
```
Anyone can download anytime, unlimited.

### Pattern 2: Paid Download
```move
create_drop("QmXYZ...", Some(1_000_000_000), None, None, clock, ctx)
```
Pay 1 SUI to download, unlimited claims.

### Pattern 3: Limited Edition
```move
create_drop("QmXYZ...", Some(10_000_000_000), None, Some(10), clock, ctx)
```
Pay 10 SUI, only 10 copies available.

### Pattern 4: Scheduled Release
```move
create_drop("QmXYZ...", None, Some(future_timestamp), None, clock, ctx)
```
Free but only available after specific time.

### Pattern 5: Premium Limited Drop
```move
create_drop(
    "QmXYZ...",
    Some(5_000_000_000),      // 5 SUI
    Some(1735689600000),       // Jan 1, 2025
    Some(50),                  // 50 copies
    clock,
    ctx
)
```
Paid, time-locked, and limited edition.

## Integration Tips

### Frontend Integration
```typescript
// Create drop
const tx = new TransactionBlock()
tx.moveCall({
  target: `${packageId}::file_drop::create_drop`,
  arguments: [
    tx.pure(metadataCid),
    tx.pure(price ? [price] : []),
    tx.pure(unlockTime ? [unlockTime] : []),
    tx.pure(maxClaims ? [maxClaims] : []),
    tx.object('0x6'),
  ],
})
```

### Listening to Events
```typescript
const events = await client.queryEvents({
  query: { MoveEventType: `${packageId}::file_drop::DropCreated` }
})
```

### Checking Drop Status
```typescript
const drop = await client.getObject({
  id: dropId,
  options: { showContent: true }
})
```

## Security Considerations

1. **Escrow Safety**: Payments are held in contract until confirmed
2. **Creator Control**: Only creator can cancel drops
3. **Time Verification**: Uses Sui Clock for accurate time-locks
4. **Atomic Operations**: All state changes are atomic
5. **No Reentrancy**: Sui's object model prevents reentrancy attacks

## Gas Costs (Approximate)

| Operation | Gas Cost |
|-----------|----------|
| Create Drop | ~0.001 SUI |
| Claim Drop | ~0.001 SUI |
| Confirm Download | ~0.001 SUI |
| Cancel Drop | ~0.001 SUI |

*Note: Actual costs may vary based on network congestion*

## Best Practices

1. **Always confirm downloads** - Release escrow promptly
2. **Set reasonable unlock times** - Use milliseconds, not seconds
3. **Test on Devnet first** - Verify all features before mainnet
4. **Monitor events** - Track drop activity via events
5. **Handle errors gracefully** - Check error codes in frontend

## Support

For questions or issues:
- Check [Sui Documentation](https://docs.sui.io/)
- Join [Sui Discord](https://discord.gg/sui)
- Review contract code in `sources/file_drop.move`
