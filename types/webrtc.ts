/**
 * WebRTC TypeScript interfaces for ChainDrop P2P file transfer
 */

export interface PeerConnection {
  id: string
  isConnected: boolean
  isInitiator: boolean
  connectionState: 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed'
  dataChannel?: RTCDataChannel
  peer?: any // simple-peer instance
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join-room' | 'leave-room' | 'error'
  from: string
  to?: string
  roomId?: string
  data?: any
  timestamp: number
}

export interface FileChunk {
  id: string
  fileId: string
  chunkIndex: number
  totalChunks: number
  data: ArrayBuffer
  checksum: string
  timestamp: number
  iv?: string // Initialization vector for encryption (base64)
}

export interface TransferProgress {
  fileId: string
  fileName: string
  fileSize: number
  bytesTransferred: number
  percentage: number
  speed: number // bytes per second
  estimatedTimeRemaining: number // seconds
  status: 'pending' | 'transferring' | 'completed' | 'failed' | 'cancelled'
  startTime: number
  endTime?: number
}

export interface FileMetadata {
  id: string
  name: string
  size: number
  type: string
  lastModified: number
  checksum: string
  totalChunks: number
  chunkSize: number
}

export interface TransferSession {
  id: string
  roomId: string
  senderId: string
  receiverId?: string
  files: FileMetadata[]
  status: 'waiting' | 'active' | 'completed' | 'cancelled'
  createdAt: number
  expiresAt: number
}

export interface WebRTCConfig {
  iceServers: RTCIceServer[]
  chunkSize: number
  maxFileSize: number
  connectionTimeout: number
  retryAttempts: number
}

export interface SignalingConfig {
  serverUrl: string
  reconnectAttempts: number
  reconnectDelay: number
  heartbeatInterval: number
}

export interface FileTransferEvents {
  onProgress: (progress: TransferProgress) => void
  onComplete: (fileId: string) => void
  onError: (error: WebRTCError) => void
  onChunkReceived: (chunk: FileChunk) => void
  onChunkSent: (chunk: FileChunk) => void
}

export interface PeerEvents {
  onConnection: (peerId: string) => void
  onDisconnection: (peerId: string) => void
  onData: (data: any) => void
  onError: (error: Error) => void
  onSignal: (signal: any) => void
}

export interface RoomEvents {
  onJoin: (roomId: string, peerId: string) => void
  onLeave: (roomId: string, peerId: string) => void
  onPeerJoined: (peerId: string) => void
  onPeerLeft: (peerId: string) => void
  onError: (error: Error) => void
}

export interface WebRTCError extends Error {
  code: 'CONNECTION_FAILED' | 'SIGNALING_ERROR' | 'FILE_TOO_LARGE' | 'INVALID_FILE' | 'TRANSFER_CANCELLED' | 'NETWORK_ERROR'
  details?: any
}




