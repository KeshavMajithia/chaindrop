# IPFS Setup Guide

## Current Status: MOCK MODE ⚠️

**The app is currently using localStorage (NOT decentralized) because IPFS requires API keys.**

## Why localStorage?

All public IPFS services require authentication:
- ✅ **Pinata** - Requires API key (401 Unauthorized without it)
- ✅ **Web3.storage** - Requires API key (401 Unauthorized without it)
- ✅ **Lighthouse** - Connection timeout / requires setup

## How to Enable REAL Decentralized Storage

### Option 1: Web3.storage (Recommended - 5GB Free)

1. **Get API Key:**
   - Go to https://web3.storage
   - Sign up for free account
   - Create API token

2. **Configure:**
   - Create `.env.local` file
   - Add: `NEXT_PUBLIC_WEB3_STORAGE_TOKEN=your_token_here`

3. **Update Code:**
   ```typescript
   // In lib/storage/real-walrus.ts
   const response = await fetch('https://api.web3.storage/upload', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN}`,
       'Content-Type': 'application/octet-stream',
     },
     body: blob,
   })
   ```

### Option 2: Pinata (1GB Free)

1. **Get API Key:**
   - Go to https://pinata.cloud
   - Sign up for free account
   - Get JWT token

2. **Configure:**
   - Create `.env.local` file
   - Add: `NEXT_PUBLIC_PINATA_JWT=your_jwt_here`

3. **Update Code:**
   ```typescript
   // In lib/storage/real-walrus.ts
   const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
     },
     body: formData,
   })
   ```

### Option 3: Browser-based IPFS (No API Keys!)

Uses `js-ipfs` to run IPFS node in browser:

1. **Install:**
   ```bash
   npm install ipfs-core
   ```

2. **Implementation:**
   ```typescript
   import { create } from 'ipfs-core'
   
   const ipfs = await create()
   const { cid } = await ipfs.add(file)
   ```

**Pros:** Truly decentralized, no API keys
**Cons:** Slower, larger bundle size

## Current Mock System

Until you configure IPFS API keys:
- ✅ Files are encrypted client-side (AES-256-GCM)
- ⚠️ Encrypted files stored in localStorage (MOCK)
- ⚠️ Only works on same browser
- ⚠️ **NOT DECENTRALIZED**

## Files to Update

Once you have API keys, update these files:
1. `lib/storage/real-walrus.ts` - Add authentication headers
2. `lib/storage/real-decentralized-storage.ts` - Remove localStorage code
3. `.env.local` - Add your API keys

## Test Real IPFS

After configuration:
1. Upload a file
2. Check console for "✅ File uploaded to IPFS"
3. Copy link and open in different browser
4. File should download successfully

---

**Ready to go decentralized? Get your free API key from web3.storage!**
