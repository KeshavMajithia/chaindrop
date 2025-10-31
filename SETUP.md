# ChainDrop Setup Guide

## Quick Fix for "Package object does not exist" Error

The error occurs because the Sui Devnet resets periodically, removing old contracts.

### Solution: Deploy a New Contract

#### Step 1: Install Sui CLI

**On Windows:**
```powershell
# Using cargo
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch devnet sui

# Or download from releases
# Visit: https://github.com/MystenLabs/sui/releases
# Download latest Windows release
```

**Alternative - Using winget:**
```powershell
winget install SuiNetwork.Sui
```

**Verify installation:**
```powershell
sui --version
```

#### Step 2: Create Sui Wallet

```powershell
sui client new-address ed25519
```

Save the generated address!

#### Step 3: Switch to Devnet

```powershell
sui client switch --env devnet
```

#### Step 4: Get Devnet Tokens

**Method 1 - Discord Faucet:**
1. Join [Sui Discord](https://discord.gg/sui)
2. Go to #devnet-faucet channel
3. Type: `!faucet <your-address>`

**Method 2 - Web Faucet:**
1. Visit: https://faucet.sui.io/
2. Select Devnet
3. Paste your address

#### Step 5: Build and Deploy Contract

```powershell
cd contracts/chaindrop_contracts
sui move build
sui client publish --gas-budget 100000000
```

**Save the Package ID** from the output!

#### Step 6: Update .env.local

Create `.env.local` in the root directory:

```bash
# Sui Blockchain
NEXT_PUBLIC_SUI_PACKAGE_ID=YOUR_NEW_PACKAGE_ID_HERE

# IPFS Storage Providers
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_here
NEXT_PUBLIC_FILEBASE_KEY=your_filebase_key_here  
NEXT_PUBLIC_FILEBASE_SECRET=your_filebase_secret_here
NEXT_PUBLIC_LIGHTHOUSE_API_KEY=your_lighthouse_key_here

# Apillon (optional)
NEXT_PUBLIC_APILLON_API_KEY=your_apillon_key_here
NEXT_PUBLIC_APILLON_API_SECRET=your_apillon_secret_here
NEXT_PUBLIC_APILLON_BUCKET_UUID=your_bucket_uuid_here
```

#### Step 7: Restart Dev Server

```powershell
# Stop current server (Ctrl+C)
# Then restart
npm run dev
```

---

## Alternative: Use Free Mode (WebRTC) Only

If you don't want to deploy the contract right now, you can use **Free Mode** which doesn't require blockchain:

1. Go to `/app` page
2. Keep **Premium Mode OFF**
3. Upload files - they'll transfer via WebRTC P2P

This doesn't require any blockchain setup!

---

## Getting API Keys (For Premium Mode)

### Pinata (Required for IPFS)
1. Go to https://pinata.cloud
2. Sign up for free account
3. API Keys → Create New Key
4. Permissions: `Files` → `Write`
5. Copy JWT token

### Filebase (Optional - Adds 5GB storage)
1. Go to https://filebase.com
2. Sign up for free account (5GB free)
3. Create S3 credentials
4. Copy Access Key and Secret

### Lighthouse (Optional - Adds 100GB storage)
1. Go to https://www.lighthouse.storage
2. Sign up for free account
3. API Keys → Generate Key
4. Copy API key

### Apillon (Optional)
1. Go to https://portal.apillon.io
2. Sign up for free account
3. Create API key
4. Create storage bucket
5. Copy credentials

---

## Verify Setup

1. Check `.env.local` exists
2. Run `npm run dev`
3. Go to http://localhost:3000/app
4. Try Premium Mode upload
5. Should work without "Package object does not exist" error

---

## Troubleshooting

### "sui command not found"
- Install Sui CLI (see Step 1 above)
- Restart terminal/PowerShell

### "Insufficient gas"
- Request more tokens from faucet
- Or reduce gas budget: `--gas-budget 50000000`

### Still getting "Package does not exist"
- Check `.env.local` has correct PACKAGE_ID
- Restart dev server after updating `.env.local`
- Verify network is devnet in wallet

### Premium Mode upload fails
- Check API keys in `.env.local`
- Verify network connectivity
- Check console for specific error messages

---

## Need Help?

- [Sui Documentation](https://docs.sui.io/)
- [Sui Discord](https://discord.gg/sui)
- Check `TESTING_GUIDE.md` for testing procedures

