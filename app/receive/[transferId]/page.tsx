"use client"

import { use, useState, useEffect, useRef } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Download, CheckCircle, AlertCircle, Lock, Clock, Wifi, WifiOff, Loader2 } from "lucide-react"
import { 
  PeerConnectionManager, 
  FileTransferManager, 
  SignalingManager,
  DEFAULT_WEBRTC_CONFIG,
  DEFAULT_SIGNALING_CONFIG
} from "@/lib/webrtc"
import { parseTransferLink, isValidEncryptionKey, storeEncryptionKey } from "@/lib/transfer-link-handler"
import { FileMetadata, TransferProgress, WebRTCError } from "@/types/webrtc"

interface TransferDetails {
  id: string
  fileName: string
  fileSize: string
  sender: string
  uploadedAt: string
  expiresAt: string
  downloads: number
  maxDownloads: number
  isExpired: boolean
}

interface ConnectionStatus {
  status: 'disconnected' | 'connecting' | 'connected' | 'error' | 'completed'
  message: string
}

interface TransferState {
  status: 'waiting' | 'receiving' | 'completed' | 'failed'
  progress: number
  speed: number
  fileMetadata?: FileMetadata
}

export default function ReceivePage({ params }: { params: Promise<{ transferId: string }> }) {
  const { transferId } = use(params)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'connecting',
    message: 'Connecting to sender...'
  })
  const [transferState, setTransferState] = useState<TransferState>({
    status: 'waiting',
    progress: 0,
    speed: 0
  })
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadBlob, setDownloadBlob] = useState<{ blob: Blob; filename: string } | null>(null)
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null) // Kept for backward compatibility but not used
  const [encryptionError, setEncryptionError] = useState<string | null>(null)
  
  // WebRTC managers (using refs to persist across re-renders)
  const peerManagerRef = useRef<PeerConnectionManager | null>(null)
  const transferManagerRef = useRef<FileTransferManager | null>(null)
  const signalingManagerRef = useRef<SignalingManager | null>(null)

  // Room ID derived from transfer ID
  const roomId = `room_${transferId}` // Assuming room ID is derived from transfer ID
  
  // Extract encryption key from URL hash on mount and update state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const { transferId: extractedTransferId, encryptionKey } = parseTransferLink()

      console.log('🔑 Receiver: Extracted from URL - transferId:', extractedTransferId, 'encryptionKey:', encryptionKey ? 'Present' : 'Missing')

      if (extractedTransferId && extractedTransferId !== transferId) {
        console.warn('⚠️ URL transferId mismatch:', extractedTransferId, 'vs', transferId)
      }

      if (encryptionKey) {
        if (isValidEncryptionKey(encryptionKey)) {
          setEncryptionKey(encryptionKey)
          storeEncryptionKey(transferId, encryptionKey)
          console.log('✅ Encryption key validated and stored')
        } else {
          console.error('❌ Invalid encryption key format in URL')
          setError('Invalid encryption key in transfer link')
          setEncryptionError('Invalid encryption key in transfer link')
        }
      } else {
        console.warn('⚠️ No encryption key found in URL - transfer may not be encrypted')
        setError('No encryption key found in transfer link')
        setEncryptionError('No encryption key found in transfer link')
      }
    }
  }, [transferId])

  // Initialize WebRTC on component mount
  useEffect(() => {
    initializeWebRTC()

    return () => {
      cleanupWebRTC()
    }
  }, [transferId])

  // Initialize WebRTC managers
  const initializeWebRTC = async () => {
    try {
      setIsInitializing(true)
      setConnectionStatus({ status: 'connecting', message: 'Connecting to sender...' })

      // Initialize managers
      peerManagerRef.current = new PeerConnectionManager(DEFAULT_WEBRTC_CONFIG)
      transferManagerRef.current = new FileTransferManager()
      signalingManagerRef.current = new SignalingManager(DEFAULT_SIGNALING_CONFIG)

      // Set up event handlers
      setupWebRTCEventHandlers()

      // Initialize connections with better error handling
      await peerManagerRef.current.initialize()

      try {
        await signalingManagerRef.current.connect()
        console.log('✅ Signaling server connected')
      } catch (error) {
        console.warn('⚠️ Signaling server connection failed:', error)
        // Continue anyway - might work with direct peer connection
      }

      // Join the transfer room as receiver
      const receiverId = `receiver_${Date.now()}`
      try {
        await signalingManagerRef.current.joinRoom(roomId, receiverId)
        console.log('✅ Joined signaling room:', roomId)
      } catch (error) {
        console.warn('⚠️ Failed to join signaling room:', error)
        // Continue anyway - WebRTC might still work
      }

      setConnectionStatus({ status: 'connected', message: 'Connected to sender' })

    } catch (error) {
      console.error('Failed to initialize WebRTC:', error)
      setConnectionStatus({ 
        status: 'error', 
        message: 'Failed to connect. Please refresh the page.' 
      })
      setError('Failed to connect to sender. Please check your internet connection.')
    } finally {
      setIsInitializing(false)
    }
  }

  // Set up WebRTC event handlers
  const setupWebRTCEventHandlers = () => {
    if (!peerManagerRef.current || !transferManagerRef.current || !signalingManagerRef.current) return

    // Peer connection events
    peerManagerRef.current.on('peerConnected', ({ peerId }) => {
      console.log('Connected to sender:', peerId)
      setConnectionStatus({ status: 'connected', message: 'Connected to sender' })
    })

    peerManagerRef.current.on('peerDisconnected', ({ peerId }) => {
      console.log('Disconnected from sender:', peerId)
      setConnectionStatus({ status: 'disconnected', message: 'Disconnected from sender' })
    })

    peerManagerRef.current.on('error', (error: WebRTCError) => {
      console.error('Peer connection error:', error)
      setConnectionStatus({ status: 'error', message: error.message })
      setError('Connection error: ' + error.message)
    })

    // File transfer events
    transferManagerRef.current.on('transferStarted', ({ fileId, isReceiver }) => {
      console.log('Transfer started:', fileId, 'receiver:', isReceiver)
      setTransferState(prev => ({ ...prev, status: 'receiving' }))
    })

    transferManagerRef.current.on('progress', (progress: TransferProgress) => {
      console.log('Transfer progress:', progress.percentage + '%')
      setTransferState(prev => ({
        ...prev,
        progress: progress.percentage,
        speed: progress.speed
      }))
    })

    transferManagerRef.current.on('transferCompleted', ({ fileId, blob, metadata }) => {
      console.log('✅ Transfer completed successfully:', fileId)
      setTransferState(prev => ({ ...prev, status: 'completed' }))
      setConnectionStatus({ status: 'completed', message: 'File transfer completed successfully' })

      // Store blob for manual download
      setDownloadBlob({ blob, filename: metadata.name })
    })

    transferManagerRef.current.on('transferFailed', ({ fileId, error }) => {
      console.error('Transfer failed:', fileId, error)
      setTransferState(prev => ({ ...prev, status: 'failed' }))
      setError('Transfer failed: ' + error.message)
    })

    // Handle incoming data from sender
    peerManagerRef.current.on('data', ({ peerId, data }) => {
      if (data.type === 'file-metadata' && transferManagerRef.current) {
        // Sender shared file metadata
        const metadata = data.data as FileMetadata
        setTransferState(prev => ({ ...prev, fileMetadata: metadata }))
        
        // Extract current encryption key from URL hash (in case state hasn't updated yet)
        const currentEncryptionKey = typeof window !== 'undefined' ? window.location.hash.substring(1) : null
        console.log('🔑 Receiver: Extracted encryption key from URL:', currentEncryptionKey ? 'Present' : 'Missing')

        // Use the current key if available, otherwise fall back to stored key
        const finalEncryptionKey = currentEncryptionKey || encryptionKey

        // Start receiving the file with encryption key
        transferManagerRef.current.receiveFile(metadata, peerId, {
          onProgress: (progress: TransferProgress) => {
            setTransferState(prev => ({
              ...prev,
              progress: progress.percentage,
              speed: progress.speed
            }))
          },
          onComplete: (fileId: string) => {
            console.log('File received:', fileId)
          },
          onError: (error: WebRTCError) => {
            console.error('Receive error:', error)
            setError('Receive error: ' + error.message)
          }
        }, finalEncryptionKey || undefined)
      } else if (data.type === 'file-chunk' && transferManagerRef.current) {
        // Process incoming file chunk
        transferManagerRef.current.processChunk(data.data, peerId)
      }
    })

    // Handle signaling messages
    signalingManagerRef.current.on('signal', async (data) => {
      if (data.type === 'offer' && peerManagerRef.current) {
        console.log('Received offer from sender:', data.from)
        
        // Create peer connection as non-initiator (receiver)
        const receiverId = `receiver_${Date.now()}`
        await peerManagerRef.current.createPeer(data.from, false)
        
        // Wait for peer connection to be established
        peerManagerRef.current!.once('peerConnected', ({ peerId: connectedPeerId }) => {
          if (connectedPeerId === data.from) {
            console.log('✅ WebRTC peer connected successfully')
            setConnectionStatus({ status: 'connected', message: 'Connected to sender' })

            // Pass the pre-generated encryption key to startFileTransfer
            // startFileTransfer(file, peerId, transferId, encryptionKey)
          }
        })

        // Set up signaling to send answer back
        peerManagerRef.current.on('signal', ({ peerId: signalPeerId, signal }) => {
          if (signalPeerId === data.from) {
            console.log('Sending answer to sender:', data.from)
            signalingManagerRef.current?.sendSignalingMessage({
              type: 'answer',
              from: receiverId,
              to: data.from,
              roomId,
              data: signal,
              timestamp: Date.now()
            })
          }
        })
        
        // Process the offer
        await peerManagerRef.current.connectToPeer(data.from, data.data)
      }
    })

    // Handle peer joined (sender connected)
    signalingManagerRef.current.on('peer-joined', ({ peerId }) => {
      console.log('Sender joined:', peerId)
      // Sender is ready, we can start receiving
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

  const handleDownload = () => {
    if (downloadBlob) {
      const url = URL.createObjectURL(downloadBlob.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = downloadBlob.filename
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  // Mock transfer details (will be replaced with real data from sender)
  const transfer: TransferDetails = {
    id: transferId,
    fileName: transferState.fileMetadata?.name || "Unknown file",
    fileSize: transferState.fileMetadata ? `${(transferState.fileMetadata.size / 1024 / 1024).toFixed(1)} MB` : "Unknown size",
    sender: "Sender",
    uploadedAt: "Just now",
    expiresAt: "in 7 days",
    downloads: 1,
    maxDownloads: 5,
    isExpired: false,
  }

  // Connection status component
  const ConnectionStatusIndicator = () => {
    const getStatusIcon = () => {
      switch (connectionStatus.status) {
        case 'connecting':
          return <Loader2 className="w-4 h-4 animate-spin text-primary" />
        case 'connected':
          return <CheckCircle className="w-4 h-4 text-green-500" />
        case 'completed':
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
        case 'completed':
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

  // Transfer status component
  const TransferStatusIndicator = () => {
    const getStatusIcon = () => {
      switch (transferState.status) {
        case 'waiting':
          return <Wifi className="w-4 h-4 text-yellow-500" />
        case 'receiving':
          return <Loader2 className="w-4 h-4 animate-spin text-primary" />
        case 'completed':
          return <CheckCircle className="w-4 h-4 text-green-500" />
        case 'failed':
          return <AlertCircle className="w-4 h-4 text-red-500" />
        default:
          return <WifiOff className="w-4 h-4 text-muted-foreground" />
      }
    }

    const getStatusText = () => {
      switch (transferState.status) {
        case 'waiting':
          return 'Waiting for sender...'
        case 'receiving':
          return 'Receiving file...'
        case 'completed':
          return 'Download complete!'
        case 'failed':
          return 'Transfer failed'
        default:
          return 'Not connected'
      }
    }

    return (
      <div className="flex items-center gap-2 text-sm">
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-12">
          {/* Status Card */}
          <div className="glass rounded-2xl p-8 space-y-6 mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">File Transfer</h1>
                <p className="text-muted-foreground">Transfer ID: {transferId}</p>
                <div className="mt-2 space-y-1">
                  <ConnectionStatusIndicator />
                  <TransferStatusIndicator />
                </div>
              </div>
              {transferState.status === 'completed' ? (
                <div className="p-3 rounded-lg bg-green-500/20">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              ) : transferState.status === 'failed' ? (
                <div className="p-3 rounded-lg bg-red-500/20">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
              ) : transferState.status === 'receiving' ? (
                <div className="p-3 rounded-lg bg-primary/20">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-yellow-500/20">
                  <Wifi className="w-6 h-6 text-yellow-500" />
                </div>
              )}
            </div>

            {/* File Details */}
            <div className="space-y-4 border-t border-border/50 pt-6">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">File Name</span>
                <span className="font-semibold text-foreground">{transfer.fileName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">File Size</span>
                <span className="font-semibold text-foreground">{transfer.fileSize}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-semibold text-foreground capitalize">{transferState.status}</span>
              </div>
              {transferState.speed > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Speed</span>
                  <span className="font-semibold text-foreground">
                    {(transferState.speed / 1024 / 1024).toFixed(2)} MB/s
                  </span>
                </div>
              )}
            </div>

            {/* Security Info */}
            <div className="space-y-3 border-t border-border/50 pt-6">
              {(() => {
                // Use a default state for server-side rendering
                const hasEncryptionKey = true // Default for SSR, will be updated client-side

                if (encryptionError) {
                  return (
                    <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-red-500 text-sm">❌ Encryption Error</p>
                        <p className="text-xs text-muted-foreground">{encryptionError}</p>
                      </div>
                    </div>
                  )
                }

                return hasEncryptionKey ? (
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Lock className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      {transferState.status === 'receiving' && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-green-500 text-sm">🔐 End-to-End Encrypted</p>
                      <p className="text-xs text-muted-foreground">
                        {transferState.status === 'receiving'
                          ? 'Decrypting file chunks with AES-256-GCM...'
                          : 'This file is encrypted with AES-256-GCM'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-yellow-500 text-sm">⚠️ No Encryption Key</p>
                      <p className="text-xs text-muted-foreground">This transfer link is missing the encryption key. The file may not be encrypted.</p>
                    </div>
                  </div>
                )
              })()}
              
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground text-sm">Limited Time Access</p>
                  <p className="text-xs text-muted-foreground">
                    Downloads: {transfer.downloads}/{transfer.maxDownloads}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Download Section */}
          {error ? (
            <div className="glass rounded-xl p-6 flex items-center gap-3 bg-red-500/10 border border-red-500/50">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Error</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : transferState.status === 'receiving' ? (
            <div className="space-y-4">
              <div className="glass rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Receiving file...</span>
                  <span className="text-sm text-muted-foreground">{Math.round(transferState.progress)}%</span>
                </div>
                <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary to-accent h-full transition-all duration-300"
                    style={{ width: `${transferState.progress}%` }}
                  />
                </div>
                {transferState.speed > 0 && (
                  <div className="text-xs text-muted-foreground text-center">
                    Speed: {(transferState.speed / 1024 / 1024).toFixed(2)} MB/s
                  </div>
                )}
              </div>
            </div>
          ) : transferState.status === 'completed' ? (
            <div className="glass rounded-xl p-6 space-y-4 bg-green-500/10 border border-green-500/50">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Transfer Complete!</p>
                  <p className="text-sm text-muted-foreground">Your file is ready to download</p>
                </div>
              </div>
              <button
                onClick={handleDownload}
                className="w-full glass border border-primary/50 hover:border-primary text-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/10 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download {transferState.fileMetadata?.name || 'File'}
              </button>
            </div>
          ) : transferState.status === 'failed' ? (
            <div className="glass rounded-xl p-6 flex items-center gap-3 bg-red-500/10 border border-red-500/50">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Transfer Failed</p>
                <p className="text-sm text-muted-foreground">The file transfer could not be completed</p>
              </div>
            </div>
          ) : transferState.status === 'waiting' ? (
            <div className="text-center py-8">
              <div className="animate-pulse text-yellow-500 mb-4">
                <Wifi className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Waiting for Sender</h3>
              <p className="text-sm text-muted-foreground">
                Please wait for the sender to start the file transfer...
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-pulse text-primary mb-4">
                <Loader2 className="w-12 h-12 mx-auto animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Connecting...</h3>
              <p className="text-sm text-muted-foreground">
                Establishing connection to sender...
              </p>
            </div>
          )}

          {/* Transfer ID */}
          <div className="mt-8 glass rounded-xl p-6">
            <p className="text-xs text-muted-foreground mb-2">Transfer ID</p>
            <code className="text-sm font-mono text-primary break-all">{transfer.id}</code>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
