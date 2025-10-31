"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FileDropZone } from "@/components/file-drop-zone"
import { TransferCard } from "@/components/transfer-card"
import { TransferDetailsModal } from "@/components/transfer-details-modal"
import { TransactionModal } from "@/components/transaction-modal"
import { Send, Settings, Wifi, WifiOff, CheckCircle, AlertCircle, Loader2, Lock, Coins, Clock, Users } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { getTransfers, saveTransfer, deleteTransfer } from "@/lib/transfer-storage"
import { generateTransferLink, copyTransferLink, generateEncryptionKeySync } from "@/lib/transfer-link-handler"
import { useSuiContract, TransactionStatus } from "@/lib/sui/contract"
import { uploadSharded } from "@/lib/storage/sharded-storage-manager"
import type { UploadProgress as ShardedUploadProgress } from "@/lib/storage/sharded-storage-manager"

// Generate unique transfer ID
const generateTransferId = () => `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
import { 
  PeerConnectionManager, 
  FileTransferManager, 
  SignalingManager,
  DEFAULT_WEBRTC_CONFIG,
  DEFAULT_SIGNALING_CONFIG 
} from "@/lib/webrtc"
import { TransferProgress, WebRTCError } from "@/types/webrtc"

interface Transfer {
  id: string
  fileName: string
  fileSize: string
  status: "pending" | "connecting" | "waiting" | "transferring" | "completed" | "failed" | "expired"
  progress?: number
  speed?: number
  expiresIn?: string
  uploadedAt?: string
  downloads?: number
  recipient?: string
  roomId?: string
  transferLink?: string
}

interface ConnectionStatus {
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  message: string
}

interface PremiumOptions {
  price: number
  unlockTime: number
  maxClaims: number
  enablePrice: boolean
  enableTimeLock: boolean
  enableMaxClaims: boolean
}

// Premium Options Panel Component
const PremiumOptionsPanel = ({ options, onChange, disabled }: { 
  options: PremiumOptions
  onChange: (options: PremiumOptions) => void
  disabled: boolean
}) => {
  return (
    <div className="glass rounded-xl p-6 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground">Premium Features</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Add conditions to your file drop using blockchain smart contracts
        </p>
      </div>
      
      {/* Paid Transfer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-green-400" />
            <label className="font-medium text-foreground">Paid Transfer</label>
          </div>
          <Switch
            checked={options.enablePrice}
            onCheckedChange={(checked) => 
              onChange({ ...options, enablePrice: checked, price: checked ? 0.1 : 0 })
            }
            disabled={disabled}
          />
        </div>
        
        {options.enablePrice && (
          <div className="ml-7 space-y-2">
            <label className="text-sm text-muted-foreground">Price in SUI</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={options.price}
              onChange={(e) => onChange({ ...options, price: parseFloat(e.target.value) || 0 })}
              placeholder="0.1"
              className="w-full glass rounded-lg px-4 py-2 text-foreground bg-muted/20 border border-border/50 focus:border-primary focus:outline-none"
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Buyers pay this amount to download. Funds held in escrow.
            </p>
          </div>
        )}
      </div>
      
      {/* Time-Locked Drop */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            <label className="font-medium text-foreground">Time-Locked Drop</label>
          </div>
          <Switch
            checked={options.enableTimeLock}
            onCheckedChange={(checked) =>
              onChange({ ...options, enableTimeLock: checked })
            }
            disabled={disabled}
          />
        </div>
        
        {options.enableTimeLock && (
          <div className="ml-7 space-y-2">
            <label className="text-sm text-muted-foreground">Unlock Date & Time</label>
            <input
              type="datetime-local"
              value={options.unlockTime ? new Date(options.unlockTime).toISOString().slice(0, 16) : ''}
              onChange={(e) => onChange({ 
                ...options, 
                unlockTime: new Date(e.target.value).getTime() 
              })}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full glass rounded-lg px-4 py-2 text-foreground bg-muted/20 border border-border/50 focus:border-primary focus:outline-none"
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              File will be unavailable until this time. Perfect for announcements or releases.
            </p>
          </div>
        )}
      </div>
      
      {/* Limited Claims */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-400" />
            <label className="font-medium text-foreground">Limited Claims</label>
          </div>
          <Switch
            checked={options.enableMaxClaims}
            onCheckedChange={(checked) =>
              onChange({ ...options, enableMaxClaims: checked, maxClaims: checked ? 100 : 0 })
            }
            disabled={disabled}
          />
        </div>
        
        {options.enableMaxClaims && (
          <div className="ml-7 space-y-2">
            <label className="text-sm text-muted-foreground">Maximum Downloads</label>
            <input
              type="number"
              min="1"
              value={options.maxClaims}
              onChange={(e) => onChange({ ...options, maxClaims: parseInt(e.target.value) || 1 })}
              placeholder="100"
              className="w-full glass rounded-lg px-4 py-2 text-foreground bg-muted/20 border border-border/50 focus:border-primary focus:outline-none"
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Create scarcity. "First {options.maxClaims} people only!"
            </p>
          </div>
        )}
      </div>
      
      {/* Feature Examples */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-400 mb-2">💡 Use Cases:</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Sell exclusive content directly to fans</li>
          <li>• Release files at specific times (dead man's switch)</li>
          <li>• Create limited edition drops (NFT-style)</li>
          <li>• Freelancer escrow (get paid before delivery)</li>
        </ul>
      </div>
      
      {/* Estimated Cost */}
      <div className="text-sm text-muted-foreground">
        Estimated blockchain fee: ~0.001 SUI
      </div>
    </div>
  )
}

export default function AppPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [recipientEmail, setRecipientEmail] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [selectedTransferForModal, setSelectedTransferForModal] = useState<Transfer | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expirationTime, setExpirationTime] = useState("7 days")
  const [downloadLimit, setDownloadLimit] = useState("Unlimited")
  const [premiumMode, setPremiumMode] = useState(false)

  // Premium mode state
  const [blockchainTxStatus, setBlockchainTxStatus] = useState<TransactionStatus>({
    status: 'idle'
  })
  const [shardedUploadProgress, setShardedUploadProgress] = useState<ShardedUploadProgress | null>(null)
  
  // Premium options state
  const [premiumOptions, setPremiumOptions] = useState<PremiumOptions>({
    price: 0,
    unlockTime: 0,
    maxClaims: 0,
    enablePrice: false,
    enableTimeLock: false,
    enableMaxClaims: false
  })
  
  // Transaction modal state
  const [txModal, setTxModal] = useState({
    isOpen: false,
    status: 'idle' as 'idle' | 'signing' | 'pending' | 'success' | 'error',
    txHash: '',
    errorMessage: ''
  })
  const [shareableLink, setShareableLink] = useState('')
  
  // WebRTC state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'disconnected',
    message: 'Not connected'
  })
  const [isInitializing, setIsInitializing] = useState(false)
  const [currentTransfer, setCurrentTransfer] = useState<Transfer | null>(null)
  
  // Sui contract integration
  const { createDrop, claimDrop, isWalletConnected } = useSuiContract()
  
  // WebRTC managers (using refs to persist across re-renders)
  const peerManagerRef = useRef<PeerConnectionManager | null>(null)
  const transferManagerRef = useRef<FileTransferManager | null>(null)
  const signalingManagerRef = useRef<SignalingManager | null>(null)

  useEffect(() => {
    const storedTransfers = getTransfers()
    setTransfers(storedTransfers as Transfer[])
    
    // Initialize WebRTC managers
    initializeWebRTC()
    
    return () => {
      // Cleanup on unmount
      cleanupWebRTC()
    }
  }, [])

  // Initialize WebRTC managers
  const initializeWebRTC = async () => {
    try {
      setIsInitializing(true)
      setConnectionStatus({ status: 'connecting', message: 'Initializing WebRTC...' })

      // Initialize managers
      peerManagerRef.current = new PeerConnectionManager(DEFAULT_WEBRTC_CONFIG)
      transferManagerRef.current = new FileTransferManager()
      signalingManagerRef.current = new SignalingManager(DEFAULT_SIGNALING_CONFIG)

      // Set up event handlers
      setupWebRTCEventHandlers()

      // Initialize connections
      await peerManagerRef.current.initialize()
      await signalingManagerRef.current.connect()

      setConnectionStatus({ status: 'connected', message: 'Ready to transfer files' })
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error)
      setConnectionStatus({ 
        status: 'error', 
        message: 'Failed to initialize. Please refresh the page.' 
      })
    } finally {
      setIsInitializing(false)
    }
  }

  // Set up WebRTC event handlers
  const setupWebRTCEventHandlers = () => {
    if (!peerManagerRef.current || !transferManagerRef.current || !signalingManagerRef.current) return

    // Peer connection events
    peerManagerRef.current.on('peerConnected', ({ peerId }) => {
      console.log('Peer connected:', peerId)
      setConnectionStatus({ status: 'connected', message: 'Peer connected' })
    })

    peerManagerRef.current.on('peerDisconnected', ({ peerId }) => {
      console.log('Peer disconnected:', peerId)
      setConnectionStatus({ status: 'disconnected', message: 'Peer disconnected' })
    })

    peerManagerRef.current.on('error', (error: WebRTCError) => {
      console.error('Peer connection error:', error)
      setConnectionStatus({ status: 'error', message: error.message })
    })

    // File transfer events
    transferManagerRef.current.on('transferStarted', ({ fileId, isReceiver }) => {
      console.log('Transfer started:', fileId, isReceiver ? 'receiver' : 'sender')
      updateTransferStatus(fileId, isReceiver ? 'waiting' : 'transferring')
    })

    transferManagerRef.current.on('progress', (progress: TransferProgress) => {
      console.log('Transfer progress:', progress.percentage + '%')
      updateTransferProgress(progress)
    })

    transferManagerRef.current.on('transferCompleted', ({ fileId, blob, metadata }) => {
      console.log('Transfer completed:', fileId)
      updateTransferStatus(fileId, 'completed')
      
      // Only download if blob exists (receiver side)
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = metadata.name
        a.click()
        URL.revokeObjectURL(url)
      }
    })

    transferManagerRef.current.on('transferFailed', ({ fileId, error }) => {
      console.error('Transfer failed:', fileId, error)
      updateTransferStatus(fileId, 'failed')
    })

    // Note: Encryption key handling is now done per-transfer in startFileTransfer()
    // to properly map fileId to transferId

    // Handle metadata to send
    transferManagerRef.current.on('metadataToSend', ({ metadata, peerId }) => {
      if (peerManagerRef.current) {
        console.log('Sending file metadata to receiver:', metadata.name)
        peerManagerRef.current.sendData(peerId, {
          type: 'file-metadata',
          data: metadata
        })
      }
    })

    // Handle chunks to send
    transferManagerRef.current.on('chunkToSend', ({ chunk, peerId }) => {
      if (peerManagerRef.current) {
        // Convert ArrayBuffer to Uint8Array for better serialization
        const chunkToSend = {
          ...chunk,
          data: Array.from(new Uint8Array(chunk.data))
        }
        peerManagerRef.current.sendData(peerId, {
          type: 'file-chunk',
          data: chunkToSend
        })
      }
    })

    // Handle incoming data
    peerManagerRef.current.on('data', ({ peerId, data }) => {
      if (data.type === 'file-chunk' && transferManagerRef.current) {
        transferManagerRef.current.processChunk(data.data, peerId)
      }
    })
  }

  // Cleanup WebRTC resources
  const cleanupWebRTC = async () => {
    try {
      if (peerManagerRef.current) {
        await peerManagerRef.current.cleanup()
      }
      if (signalingManagerRef.current) {
        await signalingManagerRef.current.disconnect()
      }
    } catch (error) {
      console.error('Error during cleanup:', error)
    }
  }

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files)
  }

  const handleTransfer = async () => {
    if (selectedFiles.length === 0 || !peerManagerRef.current || !transferManagerRef.current || !signalingManagerRef.current) {
      return
    }

    try {
      const file = selectedFiles[0]

      // Premium Mode: Upload to Sharded IPFS + Create blockchain drop
      if (premiumMode) {
        if (!isWalletConnected) {
          alert('Please connect your Sui wallet to use Premium Mode')
          return
        }

        try {
          // Upload to sharded IPFS storage (Pinata, Filebase, Lighthouse)
          console.log('🔄 Uploading to sharded IPFS storage...')
          
          const metadataCid = await uploadSharded(file, (progress) => {
            setShardedUploadProgress(progress)
            console.log(`📊 Sharded upload: ${progress.overall.toFixed(1)}% (${progress.uploaded}/${progress.total} chunks)`)
          })
          
          console.log('✅ File uploaded to sharded storage, metadata CID:', metadataCid)

          // Show signing state
          setTxModal({
            isOpen: true,
            status: 'signing',
            txHash: '',
            errorMessage: ''
          })

          // Create blockchain drop with real smart contract
          console.log('🔗 Creating blockchain drop...')
          const { txHash, dropObjectId, dropUrl } = await createDrop({
            metadataCid, // IPFS CID of chunk map
            // Premium features (converted to MIST for price)
            price: premiumOptions.enablePrice ? Math.floor(premiumOptions.price * 1e9) : undefined,
            unlockTime: premiumOptions.enableTimeLock ? premiumOptions.unlockTime : undefined,
            maxClaims: premiumOptions.enableMaxClaims ? premiumOptions.maxClaims : undefined,
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

          console.log('✅ Blockchain drop created!')
          console.log('  - Transaction:', txHash)
          console.log('  - Drop Object ID:', dropObjectId)
          console.log('  - Drop URL:', dropUrl)
          console.log('  - Metadata CID:', metadataCid)

          // Show success state
          setTxModal(prev => ({
            ...prev,
            status: 'success'
          }))

          // Store drop URL for sharing
          setShareableLink(dropUrl)

          // Create transfer record
          const newTransfer: Transfer = {
            id: dropObjectId,
            fileName: file.name,
            fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
            status: "completed",
            progress: 100,
            expiresIn: expirationTime,
            uploadedAt: new Date().toLocaleString(),
            downloads: 0,
            recipient: recipientEmail || undefined,
            transferLink: dropUrl,
            roomId: dropObjectId, // Use drop object ID
          }

          // Save transfer
          saveTransfer(newTransfer as any)
          setTransfers([newTransfer, ...transfers])
          setCurrentTransfer(newTransfer)
          setSelectedFiles([])
          setBlockchainTxStatus({ status: 'success', txHash })

        } catch (error) {
          console.error('❌ Premium transfer failed:', error)
          
          // Show error state
          setTxModal({
            isOpen: true,
            status: 'error',
            txHash: txModal.txHash,
            errorMessage: error instanceof Error ? error.message : 'Transaction failed'
          })
          
          setBlockchainTxStatus({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          return
        }
      }
      // Standard Mode: Use WebRTC P2P transfer
      else {
        const transferId = generateTransferId()
        const roomId = `room_${transferId}`

        // ✅ CRITICAL FIX: Generate encryption key BEFORE creating transfer
        const encryptionKey = generateEncryptionKeySync() // Use synchronous generation

        // Create transfer link with encryption key IMMEDIATELY
        const transferLink = generateTransferLink(transferId, encryptionKey)

        // Create transfer record with complete link
    const newTransfer: Transfer = {
          id: transferId,
          fileName: file.name,
          fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          status: "connecting",
      progress: 0,
      expiresIn: expirationTime,
      uploadedAt: new Date().toLocaleString(),
      downloads: 0,
      recipient: recipientEmail || undefined,
          roomId,
          transferLink // Already has encryption key in hash
    }

        console.log('🔐 Transfer link with encryption key:', transferLink)

        // Save transfer and update state
    saveTransfer(newTransfer as any)
    setTransfers([newTransfer, ...transfers])
        setCurrentTransfer(newTransfer)
    setSelectedFiles([])

        // Join signaling room as sender
        const senderId = `sender_${Date.now()}`
        await signalingManagerRef.current.joinRoom(roomId, senderId)

        // Update status
        updateTransferStatus(transferId, 'waiting')

        // Listen for receiver connection
        signalingManagerRef.current.on('peer-joined', async ({ peerId }) => {
          if (peerId !== senderId && peerId.startsWith('receiver_')) {
            console.log('Receiver joined:', peerId)

            // Create peer connection to receiver as initiator
            const peer = await peerManagerRef.current!.createPeer(peerId, true)

            // Set up signaling for this peer
            peerManagerRef.current!.on('signal', ({ peerId: signalPeerId, signal }) => {
              if (signalPeerId === peerId) {
                console.log('Sending offer to receiver:', peerId)
                signalingManagerRef.current?.sendSignalingMessage({
                  type: 'offer',
                  from: senderId,
                  to: peerId,
                  roomId,
                  data: signal,
                  timestamp: Date.now()
                })
              }
            })

            // Wait for peer connection to be established
            peerManagerRef.current!.once('peerConnected', ({ peerId: connectedPeerId }) => {
              if (connectedPeerId === peerId) {
                console.log('Peer connected, starting file transfer')
                // Pass the pre-generated encryption key to startFileTransfer
                startFileTransfer(file, peerId, transferId, encryptionKey)
              }
            })
          }
        })

        // Handle incoming signaling messages (answers from receiver)
        signalingManagerRef.current.on('signal', async (data) => {
          if (data.type === 'answer' && data.to === senderId && peerManagerRef.current) {
            console.log('Received answer from receiver:', data.from)
            await peerManagerRef.current.connectToPeer(data.from, data.data)
          }
        })
      }
    } catch (error) {
      console.error('Transfer failed:', error)
      if (currentTransfer) {
        updateTransferStatus(currentTransfer.id, 'failed')
      }
    }
  }

  const startFileTransfer = async (file: File, peerId: string, transferId: string, encryptionKey: string) => {
    try {
      if (!transferManagerRef.current) return

      console.log('🚀 Starting file transfer with pre-generated encryption key')
      updateTransferStatus(transferId, 'transferring')
      
      // Start file transfer with the pre-generated encryption key
      // We need to modify FileTransferManager.sendFile to accept encryption key as parameter
      const fileId = await transferManagerRef.current.sendFile(file, peerId, {
        onProgress: (progress: TransferProgress) => {
          updateTransferProgress({
            ...progress,
            fileId: transferId
          })
        },
        onComplete: (fileId: string) => {
          console.log('File transfer completed:', fileId)
          updateTransferStatus(transferId, 'completed')
        },
        onError: (error: WebRTCError) => {
          console.error('Transfer error:', error)
          updateTransferStatus(transferId, 'failed')
        }
      }, encryptionKey) // Pass encryption key here
      
      console.log('File transfer started, fileId:', fileId, 'transferId:', transferId)

    } catch (error) {
      console.error('Failed to start file transfer:', error)
      updateTransferStatus(transferId, 'failed')
    }
  }

  const updateTransferStatus = (transferId: string, status: Transfer['status']) => {
    setTransfers(prev => prev.map(transfer => 
      transfer.id === transferId ? { ...transfer, status } : transfer
    ))
    
    // Update current transfer status
    if (currentTransfer?.id === transferId) {
      setCurrentTransfer(prev => prev ? { ...prev, status } : null)
    }
  }

  const updateTransferProgress = (progress: TransferProgress) => {
    setTransfers(prev => prev.map(transfer => 
      transfer.id === progress.fileId 
        ? { 
            ...transfer, 
            progress: progress.percentage,
            speed: progress.speed,
            status: progress.status === 'completed' ? 'completed' : 'transferring'
          } 
        : transfer
    ))
    
    if (currentTransfer?.id === progress.fileId) {
      setCurrentTransfer(prev => prev ? { 
        ...prev, 
        progress: progress.percentage,
        speed: progress.speed,
        status: progress.status === 'completed' ? 'completed' : 'transferring'
      } : null)
    }
  }

  const generateTransferId = (): string => {
    return `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const handleViewDetails = (transfer: Transfer) => {
    setSelectedTransferForModal(transfer)
    setIsModalOpen(true)
  }

  const handleDeleteTransfer = (id: string) => {
    deleteTransfer(id)
    setTransfers(transfers.filter((t) => t.id !== id))
  }

  // Connection status component
  const ConnectionStatusIndicator = () => {
    const getStatusIcon = () => {
      switch (connectionStatus.status) {
        case 'connecting':
          return <Loader2 className="w-4 h-4 animate-spin text-primary" />
        case 'connected':
          return <CheckCircle className="w-4 h-4 text-green-500" />
        case 'error':
          return <AlertCircle className="w-4 h-4 text-red-500" />
        default:
          return <WifiOff className="w-4 h-4 text-muted-foreground" />
      }
    }

    const getStatusColor = () => {
      switch (connectionStatus.status) {
        case 'connecting':
          return 'text-primary'
        case 'connected':
          return 'text-green-500'
        case 'error':
          return 'text-red-500'
        default:
          return 'text-muted-foreground'
      }
    }

    return (
      <div className={`flex items-center gap-2 text-sm ${getStatusColor()}`}>
        {getStatusIcon()}
        <span>{connectionStatus.message}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header walletConnected={true} walletAddress="0x1234567890abcdef" />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Section */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h1 className="text-4xl font-bold mb-2">Transfer Files</h1>
                <p className="text-muted-foreground">Upload files and share them securely via WebRTC</p>
                <div className="mt-2">
                  <ConnectionStatusIndicator />
                </div>
              </div>

              <FileDropZone 
                onFilesSelected={handleFilesSelected} 
                isLoading={isInitializing || connectionStatus.status === 'connecting'} 
              />

              {/* Recipient Section */}
              <div className="glass rounded-xl p-6 space-y-4 hover-overlay">
                <h3 className="text-lg font-semibold text-foreground">Recipient</h3>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="recipient@example.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full glass rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to create a public transfer link that anyone can access
                </p>
              </div>

              {/* Transfer Options */}
              <div className="glass rounded-xl p-6 space-y-4 hover-overlay">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Transfer Options</h3>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 hover:bg-primary/20 rounded-lg transition-colors"
                  >
                    <Settings className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                {showSettings && (
                  <div className="space-y-4 pt-4 border-t border-border/50">
                    {/* Premium Mode Toggle */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-foreground">Premium Mode</label>
                          <p className="text-xs text-muted-foreground">
                            Store files on blockchain with enhanced security
                          </p>
                        </div>
                        <button
                          onClick={() => setPremiumMode(!premiumMode)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            premiumMode ? 'bg-primary' : 'bg-muted'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                              premiumMode ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {premiumMode && (
                        <div className="text-xs text-muted-foreground bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                          <p className="font-medium text-yellow-600 mb-1">⚠️ Premium Mode Features:</p>
                          <ul className="space-y-1 text-yellow-600">
                            <li>• Files sharded across 3 IPFS providers (Pinata, Filebase, Lighthouse)</li>
                            <li>• Maximum redundancy - chunks distributed 40/20/40%</li>
                            <li>• File metadata recorded on Sui blockchain</li>
                            <li>• Requires Sui wallet connection</li>
                            <li>• Higher gas fees apply</li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Premium Options Panel */}
                    {premiumMode && (
                      <PremiumOptionsPanel
                        options={premiumOptions}
                        onChange={setPremiumOptions}
                        disabled={txModal.status === 'signing' || txModal.status === 'pending' || selectedFiles.length === 0}
                      />
                    )}

                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Expiration Time</label>
                      <select
                        value={expirationTime}
                        onChange={(e) => setExpirationTime(e.target.value)}
                        className="w-full glass rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option>7 days</option>
                        <option>24 hours</option>
                        <option>30 days</option>
                        <option>Never</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Download Limit</label>
                      <select
                        value={downloadLimit}
                        onChange={(e) => setDownloadLimit(e.target.value)}
                        className="w-full glass rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option>Unlimited</option>
                        <option>1 download</option>
                        <option>5 downloads</option>
                        <option>10 downloads</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Blockchain Transaction Status (Premium Mode) */}
              {premiumMode && blockchainTxStatus.status !== 'idle' && (
                <div className="glass rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">Blockchain Transaction</h3>
                    <div className="flex items-center gap-2">
                      {blockchainTxStatus.status === 'pending' && (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      )}
                      {blockchainTxStatus.status === 'success' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {blockchainTxStatus.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm font-medium capitalize ${
                        blockchainTxStatus.status === 'success' ? 'text-green-500' :
                        blockchainTxStatus.status === 'error' ? 'text-red-500' :
                        'text-primary'
                      }`}>
                        {blockchainTxStatus.status === 'pending' ? 'Processing...' :
                         blockchainTxStatus.status === 'success' ? 'Confirmed' :
                         'Failed'}
                      </span>
                    </div>
                  </div>

                  {blockchainTxStatus.status === 'pending' && (
                    <div className="space-y-4">
                      {/* Sharded Upload Progress */}
                      {shardedUploadProgress && (
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Step 1: Uploading to Sharded IPFS</span>
                            <span className="text-foreground font-medium">{shardedUploadProgress.overall.toFixed(1)}%</span>
                          </div>
                          
                          {/* Service Progress Bars */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-blue-400 w-20">Pinata</span>
                              <div className="flex-1 bg-muted/30 rounded-full h-1.5">
                                <div 
                                  className="bg-blue-500 h-full rounded-full transition-all"
                                  style={{ width: `${shardedUploadProgress.pinata}%` }}
                                />
                              </div>
                              <span className="text-muted-foreground w-16 text-right">
                                {shardedUploadProgress.pinataCounts} chunks
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-green-400 w-20">Filebase</span>
                              <div className="flex-1 bg-muted/30 rounded-full h-1.5">
                                <div 
                                  className="bg-green-500 h-full rounded-full transition-all"
                                  style={{ width: `${shardedUploadProgress.filebase}%` }}
                                />
                              </div>
                              <span className="text-muted-foreground w-16 text-right">
                                {shardedUploadProgress.filebaseCounts} chunks
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-purple-400 w-20">Lighthouse</span>
                              <div className="flex-1 bg-muted/30 rounded-full h-1.5">
                                <div 
                                  className="bg-purple-500 h-full rounded-full transition-all"
                                  style={{ width: `${shardedUploadProgress.lighthouse}%` }}
                                />
                              </div>
                              <span className="text-muted-foreground w-16 text-right">
                                {shardedUploadProgress.lighthouseCounts} chunks
                              </span>
                            </div>
                          </div>
                          
                          {/* Overall Progress */}
                          <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-primary to-accent h-full transition-all duration-300 ease-out"
                              style={{ width: `${shardedUploadProgress.overall}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Step 2: Creating blockchain drop</span>
                        <span className="text-foreground">{shardedUploadProgress?.overall === 100 ? 'In Progress' : 'Waiting'}</span>
                      </div>
                    </div>
                  )}

                  {blockchainTxStatus.status === 'success' && blockchainTxStatus.txHash && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Transaction Hash</span>
                        <span className="text-foreground font-mono text-xs">
                          {blockchainTxStatus.txHash.slice(0, 12)}...{blockchainTxStatus.txHash.slice(-8)}
                        </span>
                      </div>
                      <button
                        onClick={() => window.open(`https://suiscan.xyz/devnet/tx/${blockchainTxStatus.txHash}`, '_blank')}
                        className="text-xs text-primary hover:text-primary/80 underline"
                      >
                        View on Sui Explorer →
                      </button>
                    </div>
                  )}

                  {blockchainTxStatus.status === 'error' && blockchainTxStatus.error && (
                    <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <p className="font-medium">Transaction Failed</p>
                      <p className="text-xs mt-1">{blockchainTxStatus.error}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Current Transfer Status */}
              {currentTransfer && (
                <div className="glass rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">Current Transfer</h3>
                    <div className="flex items-center gap-2">
                      {currentTransfer.status === 'connecting' && (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      )}
                      {currentTransfer.status === 'waiting' && (
                        <Wifi className="w-4 h-4 text-yellow-500" />
                      )}
                      {currentTransfer.status === 'transferring' && (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      )}
                      {currentTransfer.status === 'completed' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {currentTransfer.status === 'failed' && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium capitalize">{currentTransfer.status}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">File</span>
                      <span className="text-foreground">{currentTransfer.fileName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Size</span>
                      <span className="text-foreground">{currentTransfer.fileSize}</span>
                    </div>
                    {currentTransfer.transferLink?.includes('#') && (
                      <div className="flex items-center gap-2 text-sm bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                        <Lock className="w-4 h-4 text-green-500" />
                        <span className="text-green-500 font-medium">🔐 End-to-End Encrypted</span>
                      </div>
                    )}
                    {currentTransfer.transferLink && (
                      <div className="space-y-2">
                        <span className="text-sm text-muted-foreground">Share this link:</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={currentTransfer.transferLink}
                            readOnly
                            className="flex-1 glass rounded-lg px-3 py-2 text-sm text-foreground bg-muted/20"
                          />
                          <button
                            onClick={() => navigator.clipboard.writeText(currentTransfer.transferLink!)}
                            className="px-3 py-2 glass rounded-lg text-sm hover:bg-primary/20 transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {currentTransfer.status === 'transferring' && currentTransfer.progress !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-foreground">{currentTransfer.progress}%</span>
                      </div>
                      <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-primary to-accent h-full transition-all duration-300 ease-out"
                          style={{ width: `${currentTransfer.progress}%` }}
                        />
                      </div>
                      {currentTransfer.speed && (
                        <div className="text-xs text-muted-foreground">
                          Speed: {(currentTransfer.speed / 1024 / 1024).toFixed(2)} MB/s
                        </div>
                      )}
                    </div>
                  )}

                  {currentTransfer.status === 'waiting' && (
                    <div className="text-center py-4">
                      <div className="animate-pulse text-primary mb-2">
                        <Wifi className="w-8 h-8 mx-auto" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Waiting for receiver to connect...
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Share the link above with the recipient
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Transfer Button */}
              <button
                onClick={handleTransfer}
                disabled={
                  selectedFiles.length === 0 || 
                  (premiumMode ? !isWalletConnected : connectionStatus.status !== 'connected') ||
                  isInitializing ||
                  currentTransfer?.status === 'transferring' ||
                  currentTransfer?.status === 'waiting' ||
                  txModal.status === 'signing' ||
                  txModal.status === 'pending'
                }
                className="w-full glass rounded-lg px-6 py-3 font-semibold text-foreground hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all glow-primary flex items-center justify-center gap-2 hover-overlay"
              >
                {txModal.status === 'signing' || txModal.status === 'pending' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Drop...
                  </>
                ) : isInitializing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Initializing...
                  </>
                ) : premiumMode && !isWalletConnected ? (
                  <>
                    <Lock className="w-5 h-5" />
                    Connect Wallet
                  </>
                ) : connectionStatus.status !== 'connected' && !premiumMode ? (
                  <>
                    <WifiOff className="w-5 h-5" />
                    Not Connected
                  </>
                ) : currentTransfer?.status === 'transferring' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Transferring...
                  </>
                ) : currentTransfer?.status === 'waiting' ? (
                  <>
                    <Wifi className="w-5 h-5" />
                    Waiting for Receiver...
                  </>
                ) : premiumMode ? (
                  <>
                    <Lock className="w-5 h-5" />
                    Create Drop
                  </>
                ) : (
                  <>
                <Send className="w-5 h-5" />
                Initiate Transfer
                  </>
                )}
              </button>
            </div>

            {/* Recent Transfers Sidebar */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Recent Transfers</h2>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {transfers.length > 0 ? (
                  transfers.map((transfer) => (
                    <div key={transfer.id} className="group">
                      <div onClick={() => handleViewDetails(transfer)} className="cursor-pointer">
                        <TransferCard
                          transferId={transfer.id}
                          fileName={transfer.fileName}
                          fileSize={transfer.fileSize}
                          status={transfer.status}
                          progress={transfer.progress}
                          expiresIn={transfer.expiresIn}
                        />
                      </div>
                      <button
                        onClick={() => handleDeleteTransfer(transfer.id)}
                        className="text-xs text-destructive hover:text-destructive/80 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="glass rounded-xl p-6 text-center text-muted-foreground">
                    <p>No transfers yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {selectedTransferForModal && (
        <TransferDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          transfer={selectedTransferForModal}
        />
      )}

      {/* Transaction Modal for Blockchain Operations */}
      <TransactionModal
        isOpen={txModal.isOpen}
        status={txModal.status}
        title={
          txModal.status === 'signing' ? 'Sign Transaction' :
          txModal.status === 'pending' ? 'Creating Drop...' :
          txModal.status === 'success' ? 'Drop Created Successfully!' :
          'Transaction Failed'
        }
        txHash={txModal.txHash}
        errorMessage={txModal.errorMessage}
        onClose={() => setTxModal(prev => ({ ...prev, isOpen: false }))}
        onRetry={txModal.status === 'error' ? handleTransfer : undefined}
      />
    </div>
  )
}
