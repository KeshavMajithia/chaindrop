'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { CheckCircle, XCircle, Loader2, Wallet, ExternalLink, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TransactionModalProps {
  isOpen: boolean
  status: 'idle' | 'signing' | 'pending' | 'success' | 'error'
  title?: string
  txHash?: string
  errorMessage?: string
  onClose: () => void
  onRetry?: () => void
}

export function TransactionModal({
  isOpen,
  status,
  title,
  txHash,
  errorMessage,
  onClose,
  onRetry,
}: TransactionModalProps) {
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(5)

  // Auto-close countdown for success state
  useEffect(() => {
    if (status === 'success' && isOpen) {
      setCountdown(5)
      const interval = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [status, isOpen])

  // Separate effect to handle auto-close when countdown reaches 0
  useEffect(() => {
    if (status === 'success' && isOpen && countdown === 0) {
      onClose()
    }
  }, [countdown, status, isOpen, onClose])

  // Reset copied state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCopied(false)
    }
  }, [isOpen])

  const handleCopyHash = async () => {
    if (txHash) {
      await navigator.clipboard.writeText(txHash)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const truncateHash = (hash: string) => {
    if (hash.length <= 16) return hash
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`
  }

  const getExplorerUrl = (hash: string) => {
    return `https://suiscan.xyz/devnet/tx/${hash}`
  }

  // Determine if modal can be closed by clicking outside or ESC
  const canClose = status === 'success' || status === 'error' || status === 'idle'

  const handleOpenChange = (open: boolean) => {
    if (!open && canClose) {
      onClose()
    }
  }

  const renderContent = () => {
    switch (status) {
      case 'signing':
        return (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-6 rounded-full backdrop-blur-sm border border-white/10">
                <Wallet className="w-12 h-12 text-purple-400 animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {title || 'Sign Transaction'}
            </h3>
            <p className="text-gray-400 text-center max-w-sm">
              Please sign the transaction in your wallet...
            </p>
            <div className="mt-6">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          </div>
        )

      case 'pending':
        return (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-6 rounded-full backdrop-blur-sm border border-white/10">
                <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {title || 'Transaction Pending'}
            </h3>
            <p className="text-gray-400 text-center max-w-sm mb-4">
              Transaction confirming on Sui blockchain...
            </p>
            
            {txHash && (
              <div className="w-full max-w-md space-y-3">
                <div className="flex items-center justify-between gap-2 bg-white/5 rounded-lg p-3 border border-white/10">
                  <span className="text-sm text-gray-400">Transaction Hash:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-white font-mono">
                      {truncateHash(txHash)}
                    </code>
                    <button
                      onClick={handleCopyHash}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                      title="Copy transaction hash"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                
                <a
                  href={getExplorerUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors text-sm text-gray-300 hover:text-white"
                >
                  <span>View on Suiscan</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-4">
              Usually takes 2-5 seconds
            </p>
          </div>
        )

      case 'success':
        return (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-6 rounded-full backdrop-blur-sm border border-white/10 animate-scale-in">
                <CheckCircle className="w-12 h-12 text-green-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {title || 'Transaction Successful!'}
            </h3>
            <p className="text-gray-400 text-center max-w-sm mb-6">
              Your transaction has been confirmed on the blockchain
            </p>
            
            {txHash && (
              <div className="w-full max-w-md space-y-3 mb-6">
                <div className="flex items-center justify-between gap-2 bg-white/5 rounded-lg p-3 border border-white/10">
                  <span className="text-sm text-gray-400">Transaction Hash:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-white font-mono">
                      {truncateHash(txHash)}
                    </code>
                    <button
                      onClick={handleCopyHash}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                      title="Copy transaction hash"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                
                <a
                  href={getExplorerUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 rounded-lg border border-green-500/20 transition-colors text-sm text-green-400 hover:text-green-300"
                >
                  <span>View on Explorer</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
            
            <Button
              onClick={onClose}
              className="w-full max-w-md bg-white/10 hover:bg-white/20 text-white border border-white/10"
            >
              Close {countdown > 0 && `(${countdown}s)`}
            </Button>
          </div>
        )

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-red-500/20 to-rose-500/20 p-6 rounded-full backdrop-blur-sm border border-white/10 animate-scale-in">
                <XCircle className="w-12 h-12 text-red-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {title || 'Transaction Failed'}
            </h3>
            <p className="text-gray-400 text-center max-w-sm mb-6">
              {errorMessage || 'An error occurred while processing your transaction'}
            </p>
            
            <div className="flex flex-col gap-3 w-full max-w-md">
              {onRetry && (
                <Button
                  onClick={onRetry}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                >
                  Retry Transaction
                </Button>
              )}
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full bg-white/5 hover:bg-white/10 text-white border-white/10"
              >
                Close
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border border-white/10 shadow-2xl"
        onPointerDownOutside={(e) => {
          if (!canClose) {
            e.preventDefault()
          }
        }}
        onEscapeKeyDown={(e) => {
          if (!canClose) {
            e.preventDefault()
          }
        }}
      >
        <DialogTitle className="sr-only">
          {status === 'signing' && 'Sign Transaction'}
          {status === 'pending' && 'Transaction Pending'}
          {status === 'success' && 'Transaction Successful'}
          {status === 'error' && 'Transaction Failed'}
        </DialogTitle>
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}

// Add custom animations to globals.css or tailwind config
// @keyframes scale-in {
//   0% {
//     transform: scale(0.8);
//     opacity: 0;
//   }
//   100% {
//     transform: scale(1);
//     opacity: 1;
//   }
// }
// .animate-scale-in {
//   animation: scale-in 0.3s ease-out;
// }
