# Get Sui Testnet Tokens

## Your Wallet Address
```
0xeac5163c45ddaa06e8b8e64c886e3d1f00fba676dee37fbd577b8d5bbd378984
```

## Method 1: Discord Faucet (Recommended)

1. **Join Sui Discord**: https://discord.gg/sui

2. **Go to #devnet-faucet channel**

3. **Request tokens**:
   ```
   !faucet 0xeac5163c45ddaa06e8b8e64c886e3d1f00fba676dee37fbd577b8d5bbd378984
   ```

4. **Wait for confirmation** (usually instant)

## Method 2: Web Faucet

1. **Visit**: https://faucet.sui.io/

2. **Select Network**: Devnet

3. **Paste your address**:
   ```
   0xeac5163c45ddaa06e8b8e64c886e3d1f00fba676dee37fbd577b8d5bbd378984
   ```

4. **Click "Request Tokens"**

## Method 3: CLI Faucet

```bash
sui client faucet
```

This will automatically request tokens for your active address.

## Verify Balance

After getting tokens, check your balance:
```bash
sui client gas
```

You should see something like:
```
╭────────────────────────────────────────────────────────────────────┬────────────╮
│ gasCoinId                                                          │ gasBalance │
├────────────────────────────────────────────────────────────────────┼────────────┤
│ 0x123...                                                           │ 1000000000 │
╰────────────────────────────────────────────────────────────────────┴────────────╯
```

## Then Deploy

Once you have tokens:
```bash
cd D:\KayDoesBlockchain\chaindrop\contracts\chaindrop_contracts
sui client publish --gas-budget 100000000
```

## Troubleshooting

### "Cannot find gas coin"
- You need to get tokens first (see methods above)
- Wait a few seconds after requesting tokens

### "Insufficient gas"
- Request more tokens from faucet
- Or reduce gas budget: `--gas-budget 50000000`

### "Network mismatch"
- Make sure you're on testnet: `sui client switch --env testnet`
- Or use devnet: `sui client switch --env devnet`

## Important Notes

- **Testnet tokens are FREE** - no real value
- You can request tokens **multiple times**
- Tokens reset periodically (testnet resets)
- Keep your **Secret Recovery Phrase** safe:
  ```
  adjust copy enforce worry page brother they early noise hungry ecology reject
  ```

## Next Steps

1. ✅ Get tokens from faucet
2. ✅ Verify balance: `sui client gas`
3. ✅ Deploy contract: `sui client publish --gas-budget 100000000`
4. ✅ Save Package ID
5. ✅ Test contract functions
