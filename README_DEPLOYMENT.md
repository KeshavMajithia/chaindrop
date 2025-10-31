# 🚀 How to Deploy the ChainDrop Contract

## The Problem
Your app shows: **"Package object does not exist"** because the Sui Devnet contract expired.

## Quick Fix Options

### ✅ Option 1: Use Free Mode (No Setup Needed!)

**Just use the WebRTC free transfers right now:**

1. Go to http://localhost:3000/app
2. Keep **Premium Mode OFF**
3. Upload files - instant P2P transfer!

**Free Mode doesn't need blockchain at all!**

---

### ✅ Option 2: Deploy New Contract (For Premium Features)

If you want blockchain storage with paid drops, time-locks, etc., follow these steps:

#### Step 1: Download Sui CLI

**Windows:**
1. Visit: https://github.com/MystenLabs/sui/releases
2. Download: `sui-windows-x86_64.exe`
3. Rename it to `sui.exe`
4. Put it in a folder (e.g., `C:\sui\`)
5. Add that folder to your PATH

**Or use winget:**
```powershell
winget install SuiNetwork.Sui
```

**Verify:**
```powershell
sui --version
```

#### Step 2: Open PowerShell and Run These Commands

```powershell
# Create a new wallet
sui client new-address ed25519

# Switch to devnet
sui client switch --env devnet

# Get free tokens from faucet
sui client faucet

# Navigate to contract folder
cd contracts\chaindrop_contracts

# Build the contract
sui move build

# Deploy the contract
sui client publish --gas-budget 100000000
```

**IMPORTANT:** Copy the `Package ID` from the output!

#### Step 3: Create .env.local File

Create a file named `.env.local` in your project root (`E:\chaindrop\.env.local`) with:

```bash
NEXT_PUBLIC_SUI_PACKAGE_ID=PASTE_YOUR_PACKAGE_ID_HERE
```

#### Step 4: Restart Your Dev Server

```powershell
# Stop current server (Ctrl+C)
npm run dev
```

Done! Premium Mode will now work. ✅

---

## What I've Already Fixed

✅ Updated `lib/sui/contract.ts` to show helpful error messages  
✅ Created setup guides  
✅ Contract code is ready to deploy  
✅ Free Mode works without any setup  

---

## Summary

**Right now:**
- Free Mode = ✅ Works perfectly (WebRTC P2P)
- Premium Mode = ❌ Needs contract deployment

**After deployment:**
- Free Mode = ✅ Still works
- Premium Mode = ✅ Also works with blockchain features

---

## Files Changed

1. `lib/sui/contract.ts` - Added validation and error handling
2. `SETUP.md` - Detailed setup guide
3. `QUICK_FIX.md` - Quick troubleshooting guide  
4. `DEPLOY_INSTRUCTIONS.md` - Deployment steps
5. `README_DEPLOYMENT.md` - This file

Your codebase is ready. You just need to install the Sui CLI on your machine to deploy the contract!

---

**TL;DR:** Install Sui CLI → Deploy contract → Add Package ID to .env.local → Done! Or just use Free Mode now and deploy later!

