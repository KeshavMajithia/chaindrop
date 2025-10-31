# ChainDrop Smart Contract Deployment Guide

## Overview

The ChainDrop smart contract (`file_drop.move`) enables decentralized file sharing with premium features:
- ✅ **Free drops** - Share files for free
- 💰 **Paid transfers** - Charge for file access
- ⏰ **Time-locks** - Schedule file availability
- 🔢 **Limited claims** - Restrict number of downloads
- 🔒 **Escrow** - Secure payment until download confirmed

## Prerequisites

1. **Install Sui CLI**
   ```bash
   cargo install --locked --git https://github.com/MystenLabs/sui.git --branch devnet sui
   ```

2. **Create Sui Wallet**
   ```bash
   sui client new-address ed25519
   ```

3. **Get Devnet SUI**
   - Join [Sui Discord](https://discord.gg/sui)
   - Go to #devnet-faucet channel
   - Request tokens: `!faucet <your-address>`

4. **Configure Network**
   ```bash
   sui client switch --env devnet
   ```

## Project Structure

```
contracts/chaindrop_contracts/
├── Move.toml              # Package configuration
├── sources/
│   └── file_drop.move     # Main contract
└── tests/
    └── file_drop_tests.move
```

## Build Contract

Navigate to contract directory:
```bash
cd contracts/chaindrop_contracts
```

Build the contract:
```bash
sui move build
```

Expected output:
```
BUILDING chaindrop_contracts
```

## Deploy to Devnet

Deploy the contract:
```bash
sui client publish --gas-budget 100000000
```

**Save these values from output:**
- `Package ID`: The deployed package address (e.g., `0x123...`)
- `Transaction Digest`: The deployment transaction hash

Example output:
```
----- Transaction Digest ----
ABC123XYZ...

----- Published Package ----
Package ID: 0x1234567890abcdef...
```

## Contract Functions

### 1. Create Drop (Free)

Create a free file drop:
```bash
sui client call \
  --package <PACKAGE_ID> \
  --module file_drop \
  --function create_drop \
  --args \
    "QmXYZ123..." \
    "[]" \
    "[]" \
    "[]" \
    "0x6" \
  --gas-budget 10000000
```

Parameters:
- `metadata_cid`: IPFS CID of chunk map (e.g., "QmXYZ123...")
- `price`: Empty `[]` for free
- `unlock_time`: Empty `[]` for no time-lock
- `max_claims`: Empty `[]` for unlimited
- `clock`: Always `0x6` (Sui Clock object)

### 2. Create Paid Drop

Create a drop that costs 1 SUI:
```bash
sui client call \
  --package <PACKAGE_ID> \
  --module file_drop \
  --function create_drop \
  --args \
    "QmXYZ123..." \
    "[1000000000]" \
    "[]" \
    "[]" \
    "0x6" \
  --gas-budget 10000000
```

Note: 1 SUI = 1,000,000,000 MIST

### 3. Create Time-Locked Drop

Create a drop that unlocks on Jan 1, 2025:
```bash
sui client call \
  --package <PACKAGE_ID> \
  --module file_drop \
  --function create_drop \
  --args \
    "QmXYZ123..." \
    "[]" \
    "[1735689600000]" \
    "[]" \
    "0x6" \
  --gas-budget 10000000
```

Note: Unix timestamp in milliseconds

### 4. Create Limited Drop

Create a drop with max 10 claims:
```bash
sui client call \
  --package <PACKAGE_ID> \
  --module file_drop \
  --function create_drop \
  --args \
    "QmXYZ123..." \
    "[]" \
    "[]" \
    "[10]" \
    "0x6" \
  --gas-budget 10000000
```

### 5. Claim Free Drop

Download a free file:
```bash
sui client call \
  --package <PACKAGE_ID> \
  --module file_drop \
  --function claim_drop \
  --args \
    <DROP_OBJECT_ID> \
    "[]" \
    "0x6" \
  --gas-budget 10000000
```

### 6. Claim Paid Drop

Download a paid file (with payment):
```bash
sui client call \
  --package <PACKAGE_ID> \
  --module file_drop \
  --function claim_drop \
  --args \
    <DROP_OBJECT_ID> \
    <COIN_OBJECT_ID> \
    "0x6" \
  --gas-budget 10000000
```

First, split a coin with exact amount:
```bash
sui client split-coin --coin-id <YOUR_COIN_ID> --amounts 1000000000 --gas-budget 10000000
```

### 7. Confirm Download

Release escrow to creator after download:
```bash
sui client call \
  --package <PACKAGE_ID> \
  --module file_drop \
  --function confirm_download \
  --args <DROP_OBJECT_ID> \
  --gas-budget 10000000
```

### 8. Cancel Drop

Creator can cancel drop and refund escrow:
```bash
sui client call \
  --package <PACKAGE_ID> \
  --module file_drop \
  --function cancel_drop \
  --args <DROP_OBJECT_ID> \
  --gas-budget 10000000
```

## View Drop Details

Get drop information:
```bash
sui client object <DROP_OBJECT_ID>
```

Example output:
```json
{
  "metadata_cid": "QmXYZ123...",
  "creator": "0xabc...",
  "created_at": 1735689600000,
  "price": null,
  "unlock_time": null,
  "max_claims": null,
  "current_claims": 5,
  "escrow_balance": 0,
  "download_confirmed": false
}
```

## Events

The contract emits three types of events:

### DropCreated
```json
{
  "drop_id": "0x123...",
  "creator": "0xabc...",
  "metadata_cid": "QmXYZ...",
  "price": 1000000000,
  "unlock_time": null,
  "max_claims": 10
}
```

### DropClaimed
```json
{
  "drop_id": "0x123...",
  "claimer": "0xdef...",
  "payment_amount": 1000000000,
  "claim_number": 1
}
```

### EscrowReleased
```json
{
  "drop_id": "0x123...",
  "creator": "0xabc...",
  "amount": 1000000000
}
```

## Error Codes

| Code | Error | Description |
|------|-------|-------------|
| 1 | `E_NOT_UNLOCKED` | Drop is time-locked and not yet available |
| 2 | `E_MAX_CLAIMS_REACHED` | Maximum number of claims reached |
| 3 | `E_PAYMENT_REQUIRED` | Payment required but not provided |
| 4 | `E_INCORRECT_PAYMENT` | Payment amount doesn't match price |
| 5 | `E_NOT_CREATOR` | Only creator can perform this action |
| 6 | `E_DOWNLOAD_NOT_CONFIRMED` | Download not confirmed yet |
| 7 | `E_ALREADY_CONFIRMED` | Download already confirmed |

## Integration with Frontend

### Environment Variables

Add to `.env.local`:
```env
NEXT_PUBLIC_SUI_PACKAGE_ID=0x1234567890abcdef...
NEXT_PUBLIC_SUI_NETWORK=devnet
```

### TypeScript Integration

```typescript
import { TransactionBlock } from '@mysten/sui.js/transactions'
import { SuiClient } from '@mysten/sui.js/client'

// Create drop
const tx = new TransactionBlock()
tx.moveCall({
  target: `${PACKAGE_ID}::file_drop::create_drop`,
  arguments: [
    tx.pure(metadataCid),
    tx.pure(price ? [price] : []),
    tx.pure(unlockTime ? [unlockTime] : []),
    tx.pure(maxClaims ? [maxClaims] : []),
    tx.object('0x6'), // Clock
  ],
})

const result = await signAndExecuteTransactionBlock({ transactionBlock: tx })
```

## Testing

Run tests:
```bash
sui move test
```

## Verification

Verify deployment on Sui Explorer:
- Devnet: `https://suiscan.xyz/devnet/object/<PACKAGE_ID>`
- Testnet: `https://suiscan.xyz/testnet/object/<PACKAGE_ID>`

## Troubleshooting

### "Insufficient gas"
Increase gas budget: `--gas-budget 100000000`

### "Object not found"
Make sure you're using the correct object ID and network

### "Invalid argument"
Check argument format - use `[]` for empty Option, `[value]` for Some

### "Not authorized"
Only the creator can cancel drops or release escrow

## Next Steps

1. ✅ Deploy contract to Devnet
2. ✅ Test all functions via CLI
3. ✅ Integrate with frontend
4. ✅ Test end-to-end flow
5. 🔜 Deploy to Testnet
6. 🔜 Audit contract
7. 🔜 Deploy to Mainnet

## Support

- [Sui Documentation](https://docs.sui.io/)
- [Sui Discord](https://discord.gg/sui)
- [Sui Forum](https://forums.sui.io/)
