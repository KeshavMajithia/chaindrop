# ChainDrop Sui Smart Contract Documentation

## Overview
ChainDrop uses Sui Move smart contracts for decentralized file drop management. The contract enables secure, blockchain-backed file sharing with metadata storage.

## Contract Structure

### Module: `file_drop`
Located in `contracts/chaindrop_contracts/sources/chaindrop_contracts.move`

### FileDrop Struct
```move
public struct FileDrop has drop {
    file_hash: vector<u8>,    // IPFS/Walrus hash
    file_name: vector<u8>,    // Original filename
    file_size: u64,          // File size in bytes
    creator: address,        // Creator's Sui address
}
```

### Functions

#### `create_drop(file_hash, file_name, file_size, creator)`
Creates a new file drop with metadata.

**Parameters:**
- `file_hash`: vector<u8> - Hash/identifier of the stored file
- `file_name`: vector<u8> - Original filename
- `file_size`: u64 - File size in bytes
- `creator`: address - Creator's Sui address

**Returns:** `FileDrop` struct

#### `get_file_hash(drop)`
Returns the file hash from a drop.

#### `get_file_name(drop)`
Returns the filename from a drop.

#### `get_file_size(drop)`
Returns the file size from a drop.

#### `get_creator(drop)`
Returns the creator's address from a drop.

## Deployment

### Devnet Deployment
The contract is designed for Sui devnet deployment.

**Build Command:**
```bash
sui move build
```

**Deploy Command:**
```bash
sui client publish --gas-budget 100000000
```

### Expected Contract Address
After deployment, the contract will be available at an address like:
```
0x1234567890abcdef... (to be determined after deployment)
```

## Integration with Frontend

### Creating File Drops
```typescript
// Frontend integration example
import { fileDropContract } from '@/lib/contracts/file-drop'

// Create a file drop on-chain
const drop = await fileDropContract.createDrop({
  fileHash: fileBlobId,
  fileName: originalFileName,
  fileSize: fileSize,
  creator: userAddress
})
```

### Querying File Drops
```typescript
// Get file metadata
const fileHash = await fileDropContract.getFileHash(dropId)
const fileName = await fileDropContract.getFileName(dropId)
const fileSize = await fileDropContract.getFileSize(dropId)
```

## Security Considerations

1. **File Hash Storage**: Only file hashes are stored on-chain, actual files remain on decentralized storage (Walrus/IPFS)
2. **Access Control**: Basic implementation allows anyone to create drops (can be enhanced with access controls)
3. **Gas Efficiency**: Minimal on-chain data storage to reduce transaction costs

## Future Enhancements

1. **Access Control**: Add whitelist/blacklist functionality
2. **Time Locks**: Expiring file drops
3. **NFT Integration**: Token-gated file access
4. **Payment Integration**: SUI payments for premium features
5. **Multi-signature**: Require multiple approvals for drops

## Development Status

✅ **Contract Created**: Basic FileDrop functionality implemented
✅ **Build Ready**: Contract compiles successfully
⏳ **Deployment Pending**: Requires Sui framework dependency download
✅ **Integration Ready**: Frontend integration points defined

## Contract Addresses (After Deployment)

**Devnet:**
- Package ID: `TBD` (after deployment)
- Module: `file_drop`

**Usage:**
```move
use chaindrop_contracts::file_drop;

// Create a drop
let drop = file_drop::create_drop(file_hash, file_name, file_size, creator);

// Query drop data
let hash = file_drop::get_file_hash(&drop);
let name = file_drop::get_file_name(&drop);
```
