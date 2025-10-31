# Quick Fix: Package Object Does Not Exist Error

## The Problem

You're seeing this error:
```
❌ Failed to create drop: TRPCClientError: Package object does not exist with ID 0xb3c59b90807d28849229c0b728a73f78c977d8a50bec77654fab1a9990efcc6d
```

**Why?** The Sui Devnet resets periodically and deletes all old contracts. The package ID in your code expired.

## Quick Solutions

### ✅ Solution 1: Use Free Mode (Works Right Now!)

**Free Mode doesn't need blockchain** - it uses WebRTC P2P transfers:

1. Go to http://localhost:3000/app
2. Keep "Premium Mode" **OFF**
3. Select a file
4. Click "Initiate Transfer"
5. Share the link - instant P2P transfer!

**Free Mode works without any setup** - no wallet, no contracts, no API keys!

---

### ✅ Solution 2: Deploy New Contract (For Premium Mode)

If you want **Premium Mode** (blockchain storage), you need to deploy a new contract:

#### Step 1: Install Sui CLI

```powershell
# Windows - Download from releases
# Visit: https://github.com/MystenLabs/sui/releases
# Download: sui-windows-x86_64.exe
# Rename to: sui.exe
# Add to PATH or copy to C:\Windows\System32

# Verify installation
sui --version
```

#### Step 2: Setup Wallet

```powershell
# Create wallet
sui client new-address ed25519

# Switch to devnet
sui client switch --env devnet

# Get free devnet tokens
sui client faucet
```

#### Step 3: Deploy Contract

```powershell
cd contracts/chaindrop_contracts
sui move build
sui client publish --gas-budget 100000000
```

**Copy the Package ID** from the output!

#### Step 4: Create .env.local

Create `.env.local` in the root directory:

```bash
# Paste your NEW Package ID here
NEXT_PUBLIC_SUI_PACKAGE_ID=YOUR_NEW_PACKAGE_ID_HERE
```

#### Step 5: Restart Dev Server

```powershell
# Stop current server (Ctrl+C)
npm run dev
```

---

## Temporary Fix Applied

I've already updated the code to show a helpful error message instead of crashing. The error modal will now say:

> "Smart contract not deployed. The Sui Devnet reset, removing the old contract. Please deploy a new contract following SETUP.md and update NEXT_PUBLIC_SUI_PACKAGE_ID in .env.local"

---

## What Changed

**File**: `lib/sui/contract.ts`
- Changed default PACKAGE_ID from the expired one to `'INVALID_PACKAGE_ID_NEEDS_REDEPLOY'`
- Added validation that throws a helpful error before trying to use an invalid package ID

**Result**: You now get a clear error message instead of a confusing blockchain error!

---

## Recommended Next Steps

1. **For now**: Use **Free Mode** (WebRTC) - it works perfectly without any setup
2. **Later**: When you want Premium Mode, follow the deployment steps above
3. **Production**: For mainnet, you'd deploy to mainnet instead of devnet

---

## Need Help?

- **Free Mode works?** ✅ You're done! Nothing else needed.
- **Want Premium Mode?** Follow SETUP.md for detailed deployment instructions
- **Still having issues?** Check the console for specific error messages

---

**TL;DR**: The contract expired when Devnet reset. Use Free Mode for now, or deploy a new contract if you need Premium Mode.

