# Transaction Modal Component

A reusable, beautiful transaction status modal for blockchain operations in ChainDrop.

## Features

✅ **4 Transaction States**: signing, pending, success, error  
✅ **Glassmorphism Design**: Matches ChainDrop's aesthetic  
✅ **Auto-close on Success**: 5-second countdown  
✅ **Transaction Hash Display**: Truncated with copy functionality  
✅ **Suiscan Explorer Links**: Direct links to view transactions  
✅ **Smart Modal Behavior**: Prevents closing during critical states  
✅ **Smooth Animations**: Scale-in effects and transitions  
✅ **Mobile Responsive**: Works on all screen sizes  
✅ **Retry Functionality**: Optional retry button for errors  

---

## Installation

The component is already created at:
```
components/transaction-modal.tsx
```

Dependencies (already installed):
- `@radix-ui/react-dialog`
- `lucide-react`
- `tailwindcss`

---

## Usage

### Basic Example

```tsx
import { useState } from 'react'
import { TransactionModal } from '@/components/transaction-modal'

function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalStatus, setModalStatus] = useState<'idle' | 'signing' | 'pending' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState<string>()
  const [errorMessage, setErrorMessage] = useState<string>()

  const handleTransaction = async () => {
    try {
      // 1. Show signing state
      setModalStatus('signing')
      setIsModalOpen(true)

      // 2. Sign transaction (user approves in wallet)
      const result = await signTransaction()

      // 3. Show pending state
      setModalStatus('pending')
      setTxHash(result.digest)

      // 4. Wait for confirmation
      await waitForTransaction(result.digest)

      // 5. Show success
      setModalStatus('success')

    } catch (error: any) {
      // Show error
      setModalStatus('error')
      setErrorMessage(error.message)
    }
  }

  return (
    <>
      <button onClick={handleTransaction}>
        Create Transaction
      </button>

      <TransactionModal
        isOpen={isModalOpen}
        status={modalStatus}
        txHash={txHash}
        errorMessage={errorMessage}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
```

---

## Integration with Sui Contract

### Upload Flow (Create Drop)

```tsx
import { suiContractClient } from '@/lib/sui/contract'
import { TransactionModal } from '@/components/transaction-modal'

function UploadPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalStatus, setModalStatus] = useState<'idle' | 'signing' | 'pending' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState<string>()
  const [errorMessage, setErrorMessage] = useState<string>()

  const handleCreateDrop = async (metadataCid: string) => {
    try {
      // Open modal in signing state
      setModalStatus('signing')
      setIsModalOpen(true)
      setTxHash(undefined)
      setErrorMessage(undefined)

      // Create drop on blockchain
      const result = await suiContractClient.createDrop(
        { metadataCid },
        (progress) => {
          // Update modal based on progress
          if (progress.status === 'signing') {
            setModalStatus('signing')
          } else if (progress.status === 'pending') {
            setModalStatus('pending')
            if (progress.txHash) {
              setTxHash(progress.txHash)
            }
          }
        }
      )

      // Success!
      setModalStatus('success')
      setTxHash(result.txHash)

      // Handle success (e.g., navigate to drop page)
      console.log('Drop created:', result.dropObjectId)

    } catch (error: any) {
      setModalStatus('error')
      
      // Parse common errors
      if (error.message?.includes('User rejected')) {
        setErrorMessage('Transaction rejected by user')
      } else if (error.message?.includes('insufficient funds')) {
        setErrorMessage('Insufficient funds for gas fees')
      } else {
        setErrorMessage(error.message || 'Transaction failed')
      }
    }
  }

  const handleRetry = () => {
    setIsModalOpen(false)
    // Retry after brief delay
    setTimeout(() => {
      handleCreateDrop(metadataCid)
    }, 500)
  }

  return (
    <>
      {/* Your upload UI */}
      
      <TransactionModal
        isOpen={isModalOpen}
        status={modalStatus}
        title={
          modalStatus === 'signing' ? 'Sign Transaction' :
          modalStatus === 'pending' ? 'Creating Drop...' :
          modalStatus === 'success' ? 'Drop Created!' :
          'Transaction Failed'
        }
        txHash={txHash}
        errorMessage={errorMessage}
        onClose={() => setIsModalOpen(false)}
        onRetry={handleRetry}
      />
    </>
  )
}
```

### Download Flow (Claim Drop)

```tsx
function DownloadPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalStatus, setModalStatus] = useState<'idle' | 'signing' | 'pending' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState<string>()

  const handleClaimDrop = async (dropObjectId: string) => {
    try {
      setModalStatus('signing')
      setIsModalOpen(true)

      // Claim drop on blockchain
      const result = await suiContractClient.claimDrop(
        { dropObjectId },
        (progress) => {
          if (progress.status === 'pending') {
            setModalStatus('pending')
            setTxHash(progress.txHash)
          }
        }
      )

      setModalStatus('success')
      setTxHash(result.txHash)

      // Start download with metadata CID
      await downloadFile(result.metadataCid)

    } catch (error: any) {
      setModalStatus('error')
      setErrorMessage(error.message)
    }
  }

  return (
    <>
      <button onClick={() => handleClaimDrop(dropId)}>
        Download File
      </button>

      <TransactionModal
        isOpen={isModalOpen}
        status={modalStatus}
        title={
          modalStatus === 'signing' ? 'Sign to Download' :
          modalStatus === 'pending' ? 'Claiming Drop...' :
          modalStatus === 'success' ? 'Download Started!' :
          'Claim Failed'
        }
        txHash={txHash}
        errorMessage={errorMessage}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
```

---

## Props

### TransactionModalProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | ✅ | Controls modal visibility |
| `status` | `'idle' \| 'signing' \| 'pending' \| 'success' \| 'error'` | ✅ | Current transaction state |
| `title` | `string` | ❌ | Custom title (defaults based on status) |
| `txHash` | `string` | ❌ | Transaction hash (shown in pending/success) |
| `errorMessage` | `string` | ❌ | Error message (shown in error state) |
| `onClose` | `() => void` | ✅ | Called when modal closes |
| `onRetry` | `() => void` | ❌ | Called when retry button clicked (error state) |

---

## States

### 1. Signing State

**When to use**: User needs to approve transaction in wallet

**Features**:
- Purple wallet icon with pulse animation
- "Please sign the transaction in your wallet..."
- Spinning loader
- Cannot close (must complete or reject)

**Code**:
```tsx
setModalStatus('signing')
setIsModalOpen(true)
```

---

### 2. Pending State

**When to use**: Transaction submitted, waiting for blockchain confirmation

**Features**:
- Blue blockchain icon with spin animation
- "Transaction confirming on Sui blockchain..."
- Transaction hash display (truncated)
- Copy hash button
- Link to Suiscan Explorer
- "Usually takes 2-5 seconds" message
- Cannot close (must complete)

**Code**:
```tsx
setModalStatus('pending')
setTxHash(result.digest)
```

---

### 3. Success State

**When to use**: Transaction confirmed successfully

**Features**:
- Green checkmark with scale-in animation
- "Transaction successful!"
- Transaction hash with copy button
- "View on Explorer" button
- "Close" button
- Auto-closes after 5 seconds (with countdown)

**Code**:
```tsx
setModalStatus('success')
setTxHash(result.txHash)
```

**Auto-close**: Modal automatically closes after 5 seconds. User can close manually anytime.

---

### 4. Error State

**When to use**: Transaction failed or rejected

**Features**:
- Red X icon with scale-in animation
- Error message display
- "Retry" button (if `onRetry` provided)
- "Close" button
- Does NOT auto-close

**Code**:
```tsx
setModalStatus('error')
setErrorMessage('Transaction rejected by user')
```

**Common Error Messages**:
- `"Transaction rejected by user"` - User cancelled in wallet
- `"Insufficient funds"` - Not enough SUI for gas
- `"Network error - please try again"` - RPC/network issues
- `"Transaction failed: [reason]"` - Contract-specific errors

---

## Modal Behavior

### Closing Rules

| State | Click Outside | ESC Key | Close Button | Auto-close |
|-------|---------------|---------|--------------|------------|
| `signing` | ❌ | ❌ | ❌ | ❌ |
| `pending` | ❌ | ❌ | ❌ | ❌ |
| `success` | ✅ | ✅ | ✅ | ✅ (5s) |
| `error` | ✅ | ✅ | ✅ | ❌ |

**Why?**
- **Signing/Pending**: User must wait for transaction to complete or fail
- **Success**: User can close immediately or wait for auto-close
- **Error**: User must manually close (no auto-close to ensure they see the error)

---

## Styling

### Design System

The modal uses ChainDrop's existing design system:

- **Glassmorphism**: `backdrop-blur-xl`, `bg-gradient-to-br from-gray-900/95 to-black/95`
- **Borders**: `border border-white/10`
- **Colors**: Purple (signing), Blue (pending), Green (success), Red (error)
- **Animations**: Scale-in, pulse, spin
- **Typography**: Consistent with app fonts

### Custom Animations

Added to `globals.css`:

```css
@keyframes scale-in {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-scale-in {
  animation: scale-in 0.3s ease-out;
}
```

---

## Features

### Transaction Hash

**Display**:
- Truncated format: `0x1234...5678`
- Full hash on hover (via title attribute)
- Copy button with visual feedback

**Copy Functionality**:
```tsx
const handleCopyHash = async () => {
  await navigator.clipboard.writeText(txHash)
  setCopied(true)
  setTimeout(() => setCopied(false), 2000)
}
```

### Suiscan Explorer Links

**Format**: `https://suiscan.xyz/devnet/tx/{txHash}`

**Features**:
- Opens in new tab (`target="_blank"`)
- Security: `rel="noopener noreferrer"`
- External link icon

### Auto-close Countdown

**Success State Only**:
- 5-second countdown
- Displays: `Close (5s)`, `Close (4s)`, etc.
- User can close manually anytime
- Countdown resets if modal reopened

---

## Error Handling

### Common Errors

```tsx
// User rejected transaction
if (error.message?.includes('User rejected')) {
  setErrorMessage('Transaction rejected by user')
}

// Insufficient funds
else if (error.message?.includes('insufficient funds')) {
  setErrorMessage('Insufficient funds for gas fees')
}

// Network error
else if (error.message?.includes('network') || error.message?.includes('RPC')) {
  setErrorMessage('Network error - please try again')
}

// Contract-specific error
else if (error.message?.includes('E_NOT_UNLOCKED')) {
  setErrorMessage('This drop is time-locked and not yet available')
}

// Generic error
else {
  setErrorMessage(error.message || 'Transaction failed')
}
```

### Retry Functionality

```tsx
const handleRetry = () => {
  setIsModalOpen(false)
  // Brief delay before retry
  setTimeout(() => {
    handleTransaction()
  }, 500)
}

<TransactionModal
  onRetry={handleRetry}
  // ... other props
/>
```

---

## Accessibility

✅ **Keyboard Navigation**: ESC to close (when allowed)  
✅ **Screen Readers**: Proper ARIA labels via DialogTitle  
✅ **Focus Management**: Radix UI handles focus trapping  
✅ **Color Contrast**: WCAG AA compliant  

---

## Mobile Responsive

- **Max Width**: `sm:max-w-md` (448px)
- **Padding**: Responsive padding for small screens
- **Touch Targets**: Buttons sized for touch (min 44x44px)
- **Text**: Readable sizes on mobile

---

## Testing

### Manual Testing

```tsx
// Test all states
<Button onClick={() => {
  setModalStatus('signing')
  setIsModalOpen(true)
}}>
  Test: Signing
</Button>

<Button onClick={() => {
  setModalStatus('pending')
  setTxHash('0x1234567890abcdef...')
  setIsModalOpen(true)
}}>
  Test: Pending
</Button>

<Button onClick={() => {
  setModalStatus('success')
  setTxHash('0x1234567890abcdef...')
  setIsModalOpen(true)
}}>
  Test: Success
</Button>

<Button onClick={() => {
  setModalStatus('error')
  setErrorMessage('Transaction rejected by user')
  setIsModalOpen(true)
}}>
  Test: Error
</Button>
```

### Integration Testing

See `components/transaction-modal-example.tsx` for full examples.

---

## Best Practices

### 1. Always Reset State

```tsx
const handleTransaction = async () => {
  // Reset state before starting
  setTxHash(undefined)
  setErrorMessage(undefined)
  
  setModalStatus('signing')
  setIsModalOpen(true)
  
  // ... transaction logic
}
```

### 2. Handle All Error Cases

```tsx
try {
  // transaction
} catch (error: any) {
  setModalStatus('error')
  
  // Parse and display user-friendly errors
  if (error.message?.includes('rejected')) {
    setErrorMessage('Transaction rejected by user')
  } else {
    setErrorMessage(error.message || 'Transaction failed')
  }
}
```

### 3. Provide Context with Titles

```tsx
<TransactionModal
  title={
    modalStatus === 'signing' ? 'Sign to Create Drop' :
    modalStatus === 'pending' ? 'Creating Drop...' :
    modalStatus === 'success' ? 'Drop Created Successfully!' :
    'Failed to Create Drop'
  }
  // ... other props
/>
```

### 4. Use Retry Wisely

Only provide `onRetry` for errors that can be retried:
- ✅ Network errors
- ✅ User rejection (they might change their mind)
- ❌ Insufficient funds (retry won't help)
- ❌ Contract errors (need to fix parameters)

---

## Customization

### Custom Titles

```tsx
<TransactionModal
  title="Creating Your Drop"
  // ... other props
/>
```

### Custom Error Messages

```tsx
setErrorMessage('This drop requires 1 SUI payment')
```

### Network-specific Explorer

For mainnet deployment, update the explorer URL:

```tsx
const getExplorerUrl = (hash: string) => {
  const network = process.env.NEXT_PUBLIC_SUI_NETWORK || 'devnet'
  return `https://suiscan.xyz/${network}/tx/${hash}`
}
```

---

## Troubleshooting

### Modal doesn't close

**Issue**: Modal stuck open  
**Solution**: Check if status is `signing` or `pending` (intentionally can't close)

### Auto-close not working

**Issue**: Success modal doesn't auto-close  
**Solution**: Ensure status is exactly `'success'` (case-sensitive)

### Transaction hash not showing

**Issue**: Hash not displayed  
**Solution**: Ensure `txHash` prop is set and status is `pending` or `success`

### Copy button not working

**Issue**: Copy fails  
**Solution**: Ensure HTTPS or localhost (clipboard API requires secure context)

---

## Future Enhancements

Potential improvements:

- [ ] Support for multiple networks (mainnet, testnet)
- [ ] Gas fee estimation display
- [ ] Transaction progress percentage
- [ ] Sound effects for success/error
- [ ] Confetti animation on success
- [ ] Transaction history log
- [ ] Share transaction link

---

## Related Components

- `components/wallet-button.tsx` - Wallet connection UI
- `lib/sui/contract.ts` - Smart contract integration
- `lib/sui/wallet-provider.tsx` - Wallet provider

---

## License

Part of ChainDrop project - MIT License

---

**Built with ❤️ for ChainDrop**

*Last Updated: October 27, 2025*
