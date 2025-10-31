# Deploy Sui Contract - Step by Step

## Current Status
✅ Contract code is ready in `contracts/chaindrop_contracts/sources/file_drop.move`  
❌ Sui CLI not installed  
❌ Contract not deployed yet

## To Deploy, You Need to Install Sui CLI

### Option 1: Download Binary (Easiest for Windows)

1. **Download Sui CLI:**
   - Visit: https://github.com/MystenLabs/sui/releases
   - Download: `sui-windows-x86_64.exe` (latest release)
   - Save to a folder (e.g., `C:\sui\`)

2. **Add to PATH:**
   ```powershell
   # Rename to sui.exe
   ren sui-windows-x86_64.exe sui.exe
   
   # Add to PATH permanently
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\sui", "User")
   ```

3. **Restart PowerShell** and verify:
   ```powershell
   sui --version
   ```

### Option 2: Use winget

```powershell
winget install SuiNetwork.Sui
```

### Option 3: Build from Source

```powershell
# Install Rust first
# Visit: https://rustup.rs/

# Then install Sui
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch devnet sui
```

---

## After Installing Sui CLI

Once `sui --version` works, run these commands:

### 1. Create Wallet

```powershell
sui client new-address ed25519
```

**Save the address that appears!**

### 2. Switch to Devnet

```powershell
sui client switch --env devnet
```

### 3. Get Free Devnet Tokens

```powershell
sui client faucet
```

If that doesn't work, use Discord:
1. Join https://discord.gg/sui
2. Go to #devnet-faucet
3. Type: `!faucet YOUR_ADDRESS_HERE`

### 4. Build Contract

```powershell
cd contracts/chaindrop_contracts
sui move build
```

### 5. Deploy Contract

```powershell
sui client publish --gas-budget 100000000
```

**Copy the Package ID from the output!**

Example output:
```
----- Published Package ----
Package ID: 0xABCD1234...  <-- COPY THIS!
```

### 6. Update Environment

Create `.env.local` in project root:

```bash
NEXT_PUBLIC_SUI_PACKAGE_ID=0xABCD1234...
```

### 7. Restart Dev Server

```powershell
npm run dev
```

---

## Quick Test

After deployment, verify it works:

```powershell
cd contracts/chaindrop_contracts
sui client call --package YOUR_PACKAGE_ID --module file_drop --function create_drop --args "QmTest" "[]" "[]" "[]" "0x6" --gas-budget 10000000
```

---

## Alternative: Test Without Deployment

You can still use the app in **Free Mode** without deploying!

1. Go to http://localhost:3000/app
2. Keep "Premium Mode" **OFF**
3. Upload files via WebRTC P2P
4. Works perfectly without blockchain!

---

## Need Help?

- Sui Docs: https://docs.sui.io/build/move
- Sui Discord: https://discord.gg/sui
- Sui Forum: https://forums.sui.io

