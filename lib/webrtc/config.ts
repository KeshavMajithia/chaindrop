/**
 * WebRTC Configuration
 * Default configuration settings for WebRTC functionality
 */

import { WebRTCConfig, SignalingConfig } from '@/types/webrtc'

export const DEFAULT_WEBRTC_CONFIG: WebRTCConfig = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302'
      ]
    }
  ],
  chunkSize: 16 * 1024, // 16KB chunks
  maxFileSize: 100 * 1024 * 1024, // 100MB max file size
  connectionTimeout: 30000, // 30 seconds
  retryAttempts: 3
}

export const DEFAULT_SIGNALING_CONFIG: SignalingConfig = {
  serverUrl: process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL || 'http://localhost:3001',
  reconnectAttempts: 5,
  reconnectDelay: 1000, // 1 second
  heartbeatInterval: 30000 // 30 seconds
}

export const WEBRTC_CONSTANTS = {
  MAX_CHUNK_SIZE: 64 * 1024, // 64KB max chunk size
  MIN_CHUNK_SIZE: 1 * 1024, // 1KB min chunk size
  DEFAULT_CHUNK_SIZE: 16 * 1024, // 16KB default
  MAX_FILE_SIZE: 500 * 1024 * 1024, // 500MB max file size
  CONNECTION_TIMEOUT: 60000, // 60 seconds
  TRANSFER_TIMEOUT: 300000, // 5 minutes
  RETRY_DELAY: 1000, // 1 second
  MAX_RETRIES: 3
} as const




