# 🚨 Quick Fix: Smart Contract Deployment Error

## Problem
```
❌ Package object does not exist with ID 0xb3c59b90807d28849229c0b728a73f78c977d8a50bec77654fab1a9990efcc6d
```

**Cause:** The Sui Devnet was reset, and your old contract package no longer exists.

---

## ✅ Solution: Redeploy the Contract

### Option 1: Automated Script (Recommended)

Run the deployment script:

```powershell
cd contracts
.\deploy-contract.ps1
```

This will:
1. ✅ Check Sui CLI installation
2. ✅ Switch to Devnet
3. ✅ Build the contract
4. ✅ Deploy to Sui Devnet
5. ✅ Automatically update `.env.local` with new Package ID
6. ✅ Show you the explorer link

---

### Option 2: Manual Deployment

If you prefer manual steps:

#### Step 1: Install Sui CLI (if not installed)
```bash
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch devnet sui
```

#### Step 2: Create Wallet (if needed)
```bash
sui client new-address ed25519
```

#### Step 3: Get Testnet SUI
- Join [Sui Discord](https://discord.gg/sui)
- Go to `#devnet-faucet` channel
- Type: `!faucet <your-address>`

#### Step 4: Switch to Devnet
```bash
sui client switch --env devnet
```

#### Step 5: Build Contract
```bash
cd contracts/chaindrop_contracts
sui move build
```

#### Step 6: Deploy Contract
```bash
sui client publish --gas-budget 100000000
```

#### Step 7: Copy Package ID
Look for output like:
```
PackageID: 0x1234567890abcdef...
```

#### Step 8: Update .env.local
Create or update `e:\chaindrop\.env.local`:
```env
NEXT_PUBLIC_SUI_PACKAGE_ID=0x1234567890abcdef...
```

#### Step 9: Restart Dev Server
```bash
npm run dev
```

---

## 🔍 Verify Deployment

After deployment, verify on Sui Explorer:
```
https://suiscan.xyz/devnet/object/<YOUR_PACKAGE_ID>
```

---

## 🎯 Testing the Fix

1. **Restart your Next.js server** (important!)
2. Connect your Sui wallet
3. Try uploading a file in **Premium Mode**
4. You should see the transaction modal appear
5. Sign the transaction
6. Success! ✅

---

## 📝 Common Issues

### "Sui CLI not found"
Install Sui CLI first (see Step 1 above)

### "Insufficient gas"
Get more testnet SUI from Discord faucet

### "Build failed"
Make sure you're in the `contracts/chaindrop_contracts` directory

### "Still getting package error after deployment"
- Make sure you updated `.env.local` correctly
- Restart your Next.js dev server (`Ctrl+C` then `npm run dev`)
- Clear browser cache and refresh

---

## 🚀 Quick Commands Cheat Sheet

```bash
# Check Sui CLI version
sui --version

# Check active network
sui client active-env

# Check wallet address
sui client active-address

# Check gas balance
sui client gas

# Switch to devnet
sui client switch --env devnet

# Build contract
cd contracts/chaindrop_contracts && sui move build

# Deploy contract
sui client publish --gas-budget 100000000

# View deployed package
sui client object <PACKAGE_ID>
```

---

## 💡 What Changed?

The old package ID was:
```
0xb3c59b90807d28849229c0b728a73f78c977d8a50bec77654fab1a9990efcc6d
```

After redeployment, you'll get a new package ID like:
```
0x<new_64_character_hex_address>
```

This is normal! Sui Devnet resets periodically, so you'll need to redeploy occasionally during development.

---

## 🎉 Done!

Once deployed, your ChainDrop app will work with all premium features:
- ✅ Paid file transfers
- ✅ Time-locked drops
- ✅ Limited claims
- ✅ Escrow system

Happy dropping! 🌊
