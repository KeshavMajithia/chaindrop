/**
 * WebRTC Module Exports
 * Central export point for all WebRTC functionality
 */

export { PeerConnectionManager } from './peer-connection'
export { SignalingManager } from './signaling'
export { FileTransferManager } from './file-transfer'

// Export configuration and examples
export { DEFAULT_WEBRTC_CONFIG, DEFAULT_SIGNALING_CONFIG, WEBRTC_CONSTANTS } from './config'
export * from './example-usage'
export * from './file-transfer-example'

// Re-export types for convenience
export type {
  PeerConnection,
  SignalingMessage,
  FileChunk,
  TransferProgress,
  FileMetadata,
  TransferSession,
  WebRTCConfig,
  SignalingConfig,
  FileTransferEvents,
  PeerEvents,
  RoomEvents,
  WebRTCError
} from '@/types/webrtc'
