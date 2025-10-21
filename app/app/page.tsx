"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FileDropZone } from "@/components/file-drop-zone"
import { TransferCard } from "@/components/transfer-card"
import { TransferDetailsModal } from "@/components/transfer-details-modal"
import { Send, Settings, Wifi, WifiOff, CheckCircle, AlertCircle, Loader2, Lock } from "lucide-react"
import { getTransfers, saveTransfer, deleteTransfer } from "@/lib/transfer-storage"
import { generateTransferLink, copyTransferLink, generateEncryptionKeySync } from "@/lib/transfer-link-handler"
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

export default function AppPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [recipientEmail, setRecipientEmail] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [selectedTransferForModal, setSelectedTransferForModal] = useState<Transfer | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expirationTime, setExpirationTime] = useState("7 days")
  const [downloadLimit, setDownloadLimit] = useState("Unlimited")
  
  // WebRTC state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'disconnected',
    message: 'Not connected'
  })
  const [isInitializing, setIsInitializing] = useState(false)
  const [currentTransfer, setCurrentTransfer] = useState<Transfer | null>(null)
  
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

    } catch (error) {
      console.error('Failed to start transfer:', error)
      setConnectionStatus({ status: 'error', message: 'Failed to start transfer' })
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
                  connectionStatus.status !== 'connected' || 
                  isInitializing ||
                  currentTransfer?.status === 'transferring' ||
                  currentTransfer?.status === 'waiting'
                }
                className="w-full glass rounded-lg px-6 py-3 font-semibold text-foreground hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all glow-primary flex items-center justify-center gap-2 hover-overlay"
              >
                {isInitializing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Initializing...
                  </>
                ) : connectionStatus.status !== 'connected' ? (
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
    </div>
  )
}
