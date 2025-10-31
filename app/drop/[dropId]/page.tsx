"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Download, Clock, Shield, CheckCircle, AlertCircle, Loader2, FileText, User, Coins, Users, Calendar, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TransactionModal } from "@/components/transaction-modal"
import { useSuiContract } from "@/lib/sui/contract"
import { useSuiWallet } from "@/lib/sui/wallet-provider"

interface DropDetails {
  dropId: string
  fileName: string
  fileSize: number
  walrusBlobId: string
  encryptionKey: string
  encryptionIV: string
  createdAt: string
  expiresAt: string
  downloadCount: number
  maxDownloads: number
  isExpired: boolean
  txHash: string
  network: string
  creator?: string
  // Premium features
  price?: number | null
  unlockTime?: number | null
  downloadConfirmed?: boolean
}

// Helper Components
const Countdown = ({ targetTime }: { targetTime: number }) => {
  const [timeLeft, setTimeLeft] = useState(targetTime - Date.now())
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(targetTime - Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [targetTime])
  
  if (timeLeft <= 0) return <p className="text-green-400">✓ Unlocked</p>
  
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)
  
  return (
    <div className="font-mono text-lg text-yellow-400">
      {days > 0 && `${days}d `}
      {String(hours).padStart(2, '0')}:
      {String(minutes).padStart(2, '0')}:
      {String(seconds).padStart(2, '0')}
    </div>
  )
}

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 hover:bg-white/10 rounded transition-colors inline-flex items-center"
      title="Copy address"
    >
      {copied ? (
        <Check className="w-3 h-3 text-green-400" />
      ) : (
        <Copy className="w-3 h-3 text-gray-400" />
      )}
    </button>
  )
}

const DropConditionsCard = ({ drop }: { drop: DropDetails }) => {
  const truncateAddress = (address: string) => {
    if (!address || address.length <= 16) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
  
  const formatSUI = (mist: number) => {
    return (mist / 1e9).toFixed(4)
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  return (
    <div className="glass rounded-xl p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 text-foreground">Drop Information</h2>
      
      <div className="space-y-4">
        {/* File Info */}
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">File Name</p>
            <p className="font-medium text-foreground truncate">{drop.fileName || 'Unknown'}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(drop.fileSize)}</p>
          </div>
        </div>
        
        {/* Creator */}
        {drop.creator && (
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-purple-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Creator</p>
              <div className="flex items-center">
                <p className="font-mono text-sm text-foreground">
                  {truncateAddress(drop.creator)}
                </p>
                <CopyButton text={drop.creator} />
              </div>
            </div>
          </div>
        )}
        
        {/* Price (if set) */}
        {drop.price && drop.price > 0 && (
          <div className="flex items-center gap-3">
            <Coins className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="font-bold text-lg text-green-400">
                {formatSUI(drop.price)} SUI
              </p>
            </div>
          </div>
        )}
        
        {/* Time Lock (if set) */}
        {drop.unlockTime && drop.unlockTime > 0 && (
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Unlocks At</p>
              {Date.now() < drop.unlockTime ? (
                <Countdown targetTime={drop.unlockTime} />
              ) : (
                <p className="text-green-400">✓ Unlocked</p>
              )}
            </div>
          </div>
        )}
        
        {/* Max Claims (if set) */}
        {drop.maxDownloads && drop.maxDownloads !== 999 && (
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-orange-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Downloads</p>
              <p className="font-medium text-foreground">
                {drop.downloadCount} / {drop.maxDownloads} claimed
              </p>
              <div className="w-full bg-muted/30 rounded-full h-2 mt-2">
                <div 
                  className="bg-orange-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(drop.downloadCount / drop.maxDownloads) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Created At */}
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Created</p>
            <p className="text-sm text-foreground">{formatDate(drop.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DropPage({ params }: { params: Promise<{ dropId: string }> }) {
  const [dropDetails, setDropDetails] = useState<DropDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  
  // Blockchain claim state
  const [hasClaimedOnChain, setHasClaimedOnChain] = useState(false)
  const [isClaimingOnChain, setIsClaimingOnChain] = useState(false)
  
  // Transaction modal state
  const [txModal, setTxModal] = useState({
    isOpen: false,
    status: 'idle' as 'idle' | 'signing' | 'pending' | 'success' | 'error',
    txHash: '',
    errorMessage: ''
  })

  const { dropId } = use(params)
  const { claimDrop, confirmDownload } = useSuiContract()
  const { address: walletAddress } = useSuiWallet()

  useEffect(() => {
    // Load drop details from blockchain
    const loadDropDetails = async () => {
      try {
        console.log('🆔 Drop Object ID:', dropId)
        
        // Query blockchain for drop details
        const { suiContractClient } = await import('@/lib/sui/contract')
        const blockchainDrop = await suiContractClient.getDropDetails(dropId)
        
        if (!blockchainDrop) {
          throw new Error('Drop not found on blockchain')
        }
        
        console.log('✅ Drop details from blockchain:', blockchainDrop)
        console.log('  - Metadata CID:', blockchainDrop.metadataCid)
        console.log('  - Creator:', blockchainDrop.creator)
        console.log('  - Price:', blockchainDrop.price ? `${blockchainDrop.price / 1e9} SUI` : 'Free')
        console.log('  - Claims:', `${blockchainDrop.currentClaims}/${blockchainDrop.maxClaims || '∞'}`)
        
        // Validate metadata CID
        if (!blockchainDrop.metadataCid || blockchainDrop.metadataCid.length === 0) {
          throw new Error('Invalid metadata CID from blockchain')
        }
        
        // Download chunk map metadata from IPFS
        const { ipfsAdapterFactory } = await import('@/lib/storage/adapters/adapter-factory')
        const adapter = ipfsAdapterFactory.getPrimaryAdapter()
        
        if (!adapter) {
          throw new Error('No IPFS adapter available')
        }
        
        console.log('📥 Downloading chunk map metadata from CID:', blockchainDrop.metadataCid)
        const metadataResult = await adapter.download(blockchainDrop.metadataCid)
        const metadataText = await metadataResult.data.text()
        const chunkMap = JSON.parse(metadataText)
        
        console.log('📝 Chunk map loaded:', chunkMap.fileName, `(${chunkMap.chunks.length} chunks)`)
        
        // Create drop details combining blockchain + IPFS data
        const drop: DropDetails = {
          dropId,
          fileName: chunkMap.fileName,
          fileSize: chunkMap.originalSize,
          walrusBlobId: blockchainDrop.metadataCid,
          encryptionKey: chunkMap.encryptionKey,
          encryptionIV: chunkMap.encryptionIV,
          createdAt: new Date(blockchainDrop.createdAt).toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          downloadCount: blockchainDrop.currentClaims,
          maxDownloads: blockchainDrop.maxClaims || 999,
          isExpired: false,
          txHash: dropId,
          network: 'sui-devnet',
          creator: blockchainDrop.creator,
          // Premium features
          price: blockchainDrop.price,
          unlockTime: blockchainDrop.unlockTime,
          downloadConfirmed: blockchainDrop.downloadConfirmed,
        }
        
        setDropDetails(drop)
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load drop details:', error)
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        setError('Failed to load drop details: ' + errorMsg)
        setIsLoading(false)
      }
    }

    loadDropDetails()
  }, [dropId, retryCount])

  const handleDownload = async () => {
    if (!dropDetails) return
    
    try {
      // Step 1: Check if blockchain claim is needed
      const needsClaim = !hasClaimedOnChain
      
      if (needsClaim) {
        console.log('🔗 Claiming drop on blockchain...')
        
        // Show signing modal
        setTxModal({
          isOpen: true,
          status: 'signing',
          txHash: '',
          errorMessage: ''
        })
        
        setIsClaimingOnChain(true)
        
        // Call claimDrop on blockchain
        const claimResult = await claimDrop({
          dropObjectId: dropId,
          payment: dropDetails.price && dropDetails.price > 0 ? undefined : undefined, // TODO: Handle payment coin
        }, (status) => {
          // Update modal based on transaction progress
          if (status.status === 'pending') {
            setTxModal(prev => ({
              ...prev,
              status: 'pending',
              txHash: status.txHash || ''
            }))
          }
        })
        
        console.log('✅ Drop claimed on blockchain!')
        console.log('  - Transaction:', claimResult.txHash)
        
        // Show success
        setTxModal(prev => ({
          ...prev,
          status: 'success'
        }))
        
        setHasClaimedOnChain(true)
        setIsClaimingOnChain(false)
        
        // Auto-close modal after 2s and proceed to download
        setTimeout(() => {
          setTxModal(prev => ({ ...prev, isOpen: false }))
        }, 2000)
        
        // Wait for modal to close
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      
      // Step 2: Download file from IPFS
      console.log('🔄 Downloading sharded file:', dropDetails.fileName)
      console.log('📋 Metadata CID:', dropDetails.walrusBlobId)
      
      setIsDownloading(true)
      
      const { downloadSharded } = await import('@/lib/storage/sharded-storage-manager')
      
      const fileBlob = await downloadSharded(dropDetails.walrusBlobId, (progress) => {
        setDownloadProgress(progress.overall)
        console.log(`📥 Download progress: ${progress.overall.toFixed(1)}% (${progress.downloaded}/${progress.total} chunks)`)
      })
      
      if (!fileBlob) {
        throw new Error('Failed to download and reassemble file from sharded storage')
      }
      
      console.log('✅ File reassembled from chunks:', fileBlob.size, 'bytes')
      
      // Step 3: Trigger browser download
      const url = URL.createObjectURL(fileBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = dropDetails.fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      console.log('✅ File downloaded successfully')
      
      // Step 4: Confirm download on blockchain (release escrow)
      if (dropDetails.price && dropDetails.price > 0) {
        console.log('💰 Confirming download to release escrow...')
        try {
          await confirmDownload(dropId)
          console.log('✅ Escrow released to creator')
        } catch (error) {
          console.error('⚠️ Failed to confirm download:', error)
          // Don't fail the whole process if confirmation fails
        }
      }
      
      setIsDownloading(false)
      
    } catch (error) {
      console.error('❌ Download failed:', error)
      
      // Show error modal
      setTxModal({
        isOpen: true,
        status: 'error',
        txHash: txModal.txHash,
        errorMessage: error instanceof Error ? error.message : 'Download failed'
      })
      
      setIsClaimingOnChain(false)
      setIsDownloading(false)
      setError('Download failed. Please try again.')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading drop details...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !dropDetails) {
    if (error) {
      const isPropagationError = error.includes('propagating') || error.includes('propagated')
      
      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold mb-4">
              {isPropagationError ? '⏳ Blob Propagating' : 'Drop Not Found'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {error}
            </p>
            {isPropagationError && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Walrus uses a distributed storage network. New blobs take 30-60 seconds to propagate across aggregators.
                </p>
                <Button 
                  onClick={() => {
                    setError(null)
                    setIsLoading(true)
                    setRetryCount(prev => prev + 1)
                  }}
                  className="mr-2"
                >
                  Retry Now
                </Button>
              </div>
            )}
            <Link href="/">
              <Button variant="outline" className="mt-4">Go Home</Button>
            </Link>
          </div>
        </div>
      )
    } else {
      return (
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Drop Not Found</h1>
              <p className="text-muted-foreground mb-4">
                The requested file drop could not be found or has expired.
              </p>
              <Link href="/">
                <Button variant="outline" className="mt-4">Go Home</Button>
              </Link>
            </div>
          </main>
          <Footer />
        </div>
      )
    }
  }

  // Validation function
  const canDownload = () => {
    if (!dropDetails) return { allowed: false, reason: 'Loading...' }
    
    // Check time lock
    if (dropDetails.unlockTime && Date.now() < dropDetails.unlockTime) {
      return { allowed: false, reason: 'File is still time-locked' }
    }
    
    // Check max claims
    if (dropDetails.maxDownloads && dropDetails.maxDownloads !== 999 && dropDetails.downloadCount >= dropDetails.maxDownloads) {
      return { allowed: false, reason: 'Maximum downloads reached' }
    }
    
    // Check wallet connection for paid drops
    if (dropDetails.price && dropDetails.price > 0 && !walletAddress) {
      return { allowed: false, reason: 'Connect wallet to purchase' }
    }
    
    return { allowed: true, reason: '' }
  }

  const validation = canDownload()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">File Drop</h1>
            <p className="text-muted-foreground">
              Secure file sharing powered by blockchain
            </p>
          </div>

          {/* Drop Conditions Card */}
          <DropConditionsCard drop={dropDetails} />

          <div className="glass rounded-xl p-8 space-y-6">
            {/* File Info */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{dropDetails.fileName}</h2>
              <p className="text-muted-foreground">
                {formatFileSize(dropDetails.fileSize)} • Drop ID: {dropDetails.dropId}
              </p>
            </div>

            {/* Status */}
            <div className="flex items-center justify-center gap-2">
              {dropDetails.isExpired ? (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Expired</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Available</span>
                </div>
              )}
            </div>

            {/* Claim Success Message */}
            {hasClaimedOnChain && !isDownloading && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <div className="flex items-center justify-center gap-2 text-green-500">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">✓ Claimed successfully on blockchain</span>
                </div>
              </div>
            )}

            {/* Download Button */}
            <div className="text-center space-y-3">
              <button
                onClick={handleDownload}
                disabled={!validation.allowed || isClaimingOnChain || isDownloading || dropDetails.isExpired}
                className="glass rounded-lg px-8 py-4 font-semibold text-foreground hover:bg-primary/30 transition-all glow-primary inline-flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!validation.allowed ? (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    {validation.reason}
                  </>
                ) : isClaimingOnChain ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Claiming on blockchain...
                  </>
                ) : isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Downloading... {downloadProgress > 0 && `${downloadProgress.toFixed(0)}%`}
                  </>
                ) : hasClaimedOnChain ? (
                  <>
                    <Download className="w-4 h-4" />
                    Download File
                  </>
                ) : dropDetails.price && dropDetails.price > 0 ? (
                  <>
                    <Coins className="w-4 h-4" />
                    Pay {(dropDetails.price / 1e9).toFixed(4)} SUI & Download
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Claim & Download
                  </>
                )}
              </button>

              {/* Download Progress Bar */}
              {isDownloading && downloadProgress > 0 && (
                <div className="w-full max-w-md mx-auto">
                  <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary to-accent h-full transition-all duration-300 ease-out"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-border/50">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">File Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File Name:</span>
                    <span className="font-mono">{dropDetails.fileName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File Size:</span>
                    <span>{formatFileSize(dropDetails.fileSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Blob ID:</span>
                    <span className="font-mono text-xs">{dropDetails.walrusBlobId}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Drop Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{formatDate(dropDetails.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires:</span>
                    <span>{formatDate(dropDetails.expiresAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Downloads:</span>
                    <span>{dropDetails.downloadCount} / {dropDetails.maxDownloads === -1 ? '∞' : dropDetails.maxDownloads}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction:</span>
                    <a
                      href={`https://suiscan.xyz/testnet/tx/${dropDetails.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-mono text-xs"
                    >
                      {dropDetails.txHash.slice(0, 8)}...
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-500 mb-1">Secure Transfer</h4>
                  <p className="text-sm text-blue-400">
                    This file is encrypted and stored on decentralized storage. 
                    Only you can access it with this unique link.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />

      {/* Transaction Modal for Blockchain Claim */}
      <TransactionModal
        isOpen={txModal.isOpen}
        status={txModal.status}
        title={
          txModal.status === 'signing' ? 'Sign to Claim Drop' :
          txModal.status === 'pending' ? 'Claiming Drop...' :
          txModal.status === 'success' ? 'Drop Claimed Successfully!' :
          'Claim Failed'
        }
        txHash={txModal.txHash}
        errorMessage={txModal.errorMessage}
        onClose={() => setTxModal(prev => ({ ...prev, isOpen: false }))}
        onRetry={txModal.status === 'error' ? handleDownload : undefined}
      />
    </div>
  )
}
