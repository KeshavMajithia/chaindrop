# 🔧 Sui Wallet Setup Guide

## Current Issue
Your Sui CLI is installed but not configured. Let's set it up!

---

## 📋 Step-by-Step Setup

### Step 1: Initialize Sui Client

Run this command to create your wallet configuration:

```bash
sui client
```

When prompted:
- **"Connect to a Sui Full node server?"** → Type `y` and press Enter
- **"Select network"** → Choose `devnet` (option 0)

This creates your wallet config at: `C:\Users\Hp\.sui\sui_config\client.yaml`

---

### Step 2: Create a New Address

Create a new wallet address:

```bash
sui client new-address ed25519
```

**IMPORTANT:** Save the recovery phrase shown! You'll need it to recover your wallet.

Example output:
```
Created new keypair and saved it to keystore.
Address: 0x1234567890abcdef...
```

---

### Step 3: Get Testnet SUI Tokens

You need SUI tokens to deploy the contract. Here are two ways:

#### Option A: Discord Faucet (Recommended)
1. Join [Sui Discord](https://discord.gg/sui)
2. Go to `#devnet-faucet` channel
3. Type: `!faucet <your-address>`
4. Wait ~30 seconds for tokens

#### Option B: Web Faucet
1. Go to: https://faucet.sui.io/
2. Select "Devnet"
3. Enter your address
4. Click "Request SUI"

---

### Step 4: Verify You Have Gas

Check your balance:

```bash
sui client gas
```

You should see gas coins listed. Example:
```
╭────────────────────────────────────────────────────────────────────┬────────╮
│ gasCoinId                                                          │ gasBalance │
├────────────────────────────────────────────────────────────────────┼────────┤
│ 0x123...                                                           │ 1000000000 │
╰────────────────────────────────────────────────────────────────────┴────────╯
```

---

### Step 5: Deploy the Smart Contract

Now you're ready to deploy! Run the automated script:

```powershell
cd contracts
.\deploy-contract.ps1
```

Or manually:

```bash
cd contracts/chaindrop_contracts
sui move build
sui client publish --gas-budget 100000000
```

---

### Step 6: Update .env.local

After deployment, copy the Package ID and update `.env.local`:

```env
NEXT_PUBLIC_SUI_PACKAGE_ID=0x<your_new_package_id>
```

---

### Step 7: Restart Dev Server

```bash
npm run dev
```

---

## 🎯 Quick Commands Reference

```bash
# Check Sui version
sui --version

# Check active address
sui client active-address

# Check active network
sui client active-env

# Switch network
sui client switch --env devnet

# List all addresses
sui client addresses

# Check gas balance
sui client gas

# Get more testnet SUI
# Go to Discord: https://discord.gg/sui
# Channel: #devnet-faucet
# Command: !faucet <your-address>
```

---

## 🔍 Troubleshooting

### "Config file doesn't exist"
Run `sui client` to initialize

### "No gas coins"
Get testnet SUI from Discord faucet

### "Insufficient gas"
Request more SUI from faucet or increase gas budget

### "Network not found"
Make sure you selected `devnet` during initialization

---

## 📝 What's Next?

After completing these steps:

1. ✅ Sui wallet configured
2. ✅ Testnet SUI tokens received
3. ✅ Smart contract deployed
4. ✅ `.env.local` updated
5. ✅ Dev server restarted

You can now use **Premium Mode** in ChainDrop! 🎉

---

## 💡 Understanding the Setup

- **Sui Client**: Command-line tool to interact with Sui blockchain
- **Devnet**: Test network (free tokens, resets periodically)
- **Gas Coins**: Used to pay for blockchain transactions
- **Package ID**: Your deployed smart contract address

---

## 🚨 Important Notes

1. **Never share your recovery phrase** - It's like your password
2. **Devnet resets** - You may need to redeploy contracts occasionally
3. **Testnet tokens are free** - Don't use real money on devnet
4. **Save your Package ID** - You'll need it in `.env.local`

---

## 🎓 Learn More

- [Sui Documentation](https://docs.sui.io/)
- [Sui Discord](https://discord.gg/sui)
- [Sui Explorer](https://suiscan.xyz/devnet)
- [Sui Faucet](https://faucet.sui.io/)

---

Happy building! 🚀
