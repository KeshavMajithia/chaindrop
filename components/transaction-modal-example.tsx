'use client'

/**
 * Example Usage of TransactionModal Component
 * 
 * This file demonstrates how to integrate the TransactionModal
 * into your blockchain transaction flows.
 */

import { useState } from 'react'
import { TransactionModal } from './transaction-modal'
import { Button } from './ui/button'
import { useSuiContract } from '@/lib/sui/contract'

export function TransactionModalExample() {
  const { createDrop } = useSuiContract()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalStatus, setModalStatus] = useState<'idle' | 'signing' | 'pending' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState<string>()
  const [errorMessage, setErrorMessage] = useState<string>()

  // Example: Create Drop Transaction
  const handleCreateDrop = async () => {
    try {
      // Open modal in signing state
      setModalStatus('signing')
      setIsModalOpen(true)
      setTxHash(undefined)
      setErrorMessage(undefined)

      // Simulate wallet signing (replace with actual wallet call)
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Transaction signed, now pending
      setModalStatus('pending')
      const mockTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      setTxHash(mockTxHash)

      // Simulate blockchain confirmation (replace with actual transaction wait)
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Transaction successful
      setModalStatus('success')

    } catch (error: any) {
      // Transaction failed
      setModalStatus('error')
      
      // Handle common error messages
      if (error.message?.includes('User rejected')) {
        setErrorMessage('Transaction rejected by user')
      } else if (error.message?.includes('insufficient funds')) {
        setErrorMessage('Insufficient funds to complete transaction')
      } else {
        setErrorMessage('Network error - please try again')
      }
    }
  }

  // Example: Integration with real Sui contract
  const handleRealTransaction = async () => {
    try {
      setModalStatus('signing')
      setIsModalOpen(true)
      setTxHash(undefined)
      setErrorMessage(undefined)
      
      // Build and sign transaction
      // The modal will show "signing" state while user approves in wallet
      const result = await createDrop(
        {
          metadataCid: 'QmExample...',
          // Optional premium features:
          // price: 1000000000, // 1 SUI
          // unlockTime: Date.now() + 3600000, // 1 hour
          // maxClaims: 100,
        },
        (progress) => {
          // Handle progress updates
          if (progress.status === 'pending') {
            setModalStatus('pending')
            if (progress.txHash) {
              setTxHash(progress.txHash)
            }
          } else if (progress.status === 'success') {
            setModalStatus('success')
          }
        }
      )

      // Transaction successful
      setModalStatus('success')
      setTxHash(result.txHash)

    } catch (error: any) {
      setModalStatus('error')
      setErrorMessage(error.message || 'Transaction failed')
    }
  }

  const handleRetry = () => {
    setIsModalOpen(false)
    // Retry the transaction after a brief delay
    setTimeout(() => {
      handleCreateDrop()
    }, 500)
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setModalStatus('idle')
    setTxHash(undefined)
    setErrorMessage(undefined)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-4">Transaction Modal Examples</h2>
      
      <div className="grid gap-4">
        <Button
          onClick={handleCreateDrop}
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
        >
          Test Transaction Flow (Mock)
        </Button>

        <Button
          onClick={handleRealTransaction}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
        >
          Create Real Drop (Requires Wallet)
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => {
              setModalStatus('signing')
              setIsModalOpen(true)
            }}
            variant="outline"
          >
            Test: Signing
          </Button>
          <Button
            onClick={() => {
              setModalStatus('pending')
              setTxHash('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')
              setIsModalOpen(true)
            }}
            variant="outline"
          >
            Test: Pending
          </Button>
          <Button
            onClick={() => {
              setModalStatus('success')
              setTxHash('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')
              setIsModalOpen(true)
            }}
            variant="outline"
          >
            Test: Success
          </Button>
          <Button
            onClick={() => {
              setModalStatus('error')
              setErrorMessage('Transaction rejected by user')
              setIsModalOpen(true)
            }}
            variant="outline"
          >
            Test: Error
          </Button>
        </div>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        status={modalStatus}
        title={
          modalStatus === 'signing' ? 'Sign Transaction' :
          modalStatus === 'pending' ? 'Creating Drop...' :
          modalStatus === 'success' ? 'Drop Created!' :
          modalStatus === 'error' ? 'Transaction Failed' :
          undefined
        }
        txHash={txHash}
        errorMessage={errorMessage}
        onClose={handleClose}
        onRetry={modalStatus === 'error' ? handleRetry : undefined}
      />
    </div>
  )
}

/**
 * INTEGRATION GUIDE:
 * 
 * 1. Import the modal:
 *    import { TransactionModal } from '@/components/transaction-modal'
 * 
 * 2. Add state to your component:
 *    const [isModalOpen, setIsModalOpen] = useState(false)
 *    const [modalStatus, setModalStatus] = useState<'idle' | 'signing' | 'pending' | 'success' | 'error'>('idle')
 *    const [txHash, setTxHash] = useState<string>()
 *    const [errorMessage, setErrorMessage] = useState<string>()
 * 
 * 3. Update modal state during transaction:
 *    - Before signing: setModalStatus('signing'), setIsModalOpen(true)
 *    - After signing: setModalStatus('pending'), setTxHash(result.digest)
 *    - On success: setModalStatus('success')
 *    - On error: setModalStatus('error'), setErrorMessage(error.message)
 * 
 * 4. Add the modal to your JSX:
 *    <TransactionModal
 *      isOpen={isModalOpen}
 *      status={modalStatus}
 *      txHash={txHash}
 *      errorMessage={errorMessage}
 *      onClose={() => setIsModalOpen(false)}
 *      onRetry={handleRetry}
 *    />
 * 
 * 5. Common Error Messages:
 *    - "Transaction rejected by user" - User cancelled in wallet
 *    - "Insufficient funds" - Not enough SUI for gas
 *    - "Network error - please try again" - RPC/network issues
 *    - "Transaction failed: [reason]" - Contract-specific errors
 */
