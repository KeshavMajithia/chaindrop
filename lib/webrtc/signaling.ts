/**
 * WebRTC Signaling Server Connection
 * Handles signaling between peers using Socket.IO
 */

import { EventEmitter } from 'events'
import { io, Socket } from 'socket.io-client'
import { SignalingMessage, SignalingConfig, RoomEvents, WebRTCError } from '@/types/webrtc'

export class SignalingManager extends EventEmitter {
  private socket: Socket | null = null
  private config: SignalingConfig
  private isConnected: boolean = false
  private reconnectAttempts: number = 0
  private reconnectTimer: NodeJS.Timeout | null = null

  constructor(config: SignalingConfig) {
    super()
    this.config = config
  }

  /**
   * Connect to the signaling server
   */
  async connect(): Promise<void> {
    try {
      console.log('🔗 SignalingManager: Connecting to server:', this.config.serverUrl)

      // Check if server is available first
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(`${this.config.serverUrl.replace('/socket.io', '')}/health`, {
          method: 'GET',
          signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          console.warn('⚠️ SignalingManager: Server health check failed')
        } else {
          console.log('✅ SignalingManager: Server is available')
        }
      } catch (error) {
        console.warn('⚠️ SignalingManager: Server health check failed:', error)
      }

      // Initialize Socket.IO connection
      this.socket = io(this.config.serverUrl, {
        reconnection: true,
        reconnectionAttempts: this.config.reconnectAttempts,
        reconnectionDelay: this.config.reconnectDelay,
        transports: ['websocket', 'polling'],
        timeout: 60000, // 60 second timeout
        forceNew: true
      })

      // Set up event handlers
      this.setupSocketEventHandlers()

      // Wait for connection with debugging
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error('❌ SignalingManager: Connection timeout after 60 seconds')
          reject(new Error('Connection timeout'))
        }, 60000) // Increased from 30s to 60s

        this.socket!.on('connect', () => {
          console.log('✅ SignalingManager: Connected successfully')
          clearTimeout(timeout)
          this.isConnected = true
          this.reconnectAttempts = 0
          this.emit('connected')
          resolve()
        })

        this.socket!.on('connect_error', (error) => {
          console.error('❌ SignalingManager: Connection error:', error.message)
          clearTimeout(timeout)
          reject(error)
        })

        this.socket!.on('disconnect', (reason) => {
          console.log('🔌 SignalingManager: Disconnected:', reason)
          this.isConnected = false
          this.emit('disconnected')
        })
      })
    } catch (error) {
      console.error('❌ SignalingManager: Failed to initialize:', error)
      this.emit('error', error)
      throw error
    }
  }

  /**
   * Disconnect from the signaling server
   */
  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    this.isConnected = false
    this.emit('disconnected')
  }

  /**
   * Join a room for peer discovery
   */
  async joinRoom(roomId: string, peerId: string): Promise<void> {
    if (!this.socket || !this.isConnected) {
      throw new Error('Not connected to signaling server')
    }

    this.socket.emit('join-room', { roomId, peerId })
    this.emit('room-joined', { roomId, peerId })
  }

  /**
   * Leave a room
   */
  async leaveRoom(roomId: string, peerId: string): Promise<void> {
    if (!this.socket) return

    this.socket.emit('leave-room', { roomId, peerId })
    this.emit('room-left', { roomId, peerId })
  }

  /**
   * Send signaling message to a peer
   */
  async sendSignalingMessage(message: SignalingMessage): Promise<void> {
    if (!this.socket || !this.isConnected) {
      throw new Error('Not connected to signaling server')
    }

    this.socket.emit('signal', message)
  }

  /**
   * Send offer to a peer
   */
  async sendOffer(to: string, offer: any, roomId?: string): Promise<void> {
    // TODO: Create and send offer message
  }

  /**
   * Send answer to a peer
   */
  async sendAnswer(to: string, answer: any, roomId?: string): Promise<void> {
    // TODO: Create and send answer message
  }

  /**
   * Send ICE candidate to a peer
   */
  async sendIceCandidate(to: string, candidate: any, roomId?: string): Promise<void> {
    // TODO: Create and send ICE candidate message
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket
  }

  /**
   * Setup socket event handlers
   */
  private setupSocketEventHandlers(): void {
    if (!this.socket) return

    // Handle disconnect
    this.socket.on('disconnect', (reason) => {
      this.isConnected = false
      this.emit('disconnected', { reason })
      
      // Attempt reconnection
      if (reason === 'io server disconnect') {
        this.socket?.connect()
      }
    })

    // Handle errors
    this.socket.on('error', (error) => {
      this.emit('error', error)
    })

    // Handle signaling messages
    this.socket.on('signal', (data) => {
      this.emit('signal', data)
    })

    // Handle room events
    this.socket.on('peer-joined', (data) => {
      this.emit('peer-joined', data)
    })

    this.socket.on('peer-left', (data) => {
      this.emit('peer-left', data)
    })

    this.socket.on('room-peers', (data) => {
      this.emit('room-peers', data)
    })

    // Handle reconnection
    this.socket.on('reconnect', (attemptNumber) => {
      this.isConnected = true
      this.emit('reconnected', { attemptNumber })
    })

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      this.reconnectAttempts = attemptNumber
      this.emit('reconnecting', { attemptNumber })
    })

    this.socket.on('reconnect_error', (error) => {
      this.emit('reconnect-error', error)
    })

    this.socket.on('reconnect_failed', () => {
      this.emit('reconnect-failed')
    })
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnection(): void {
    // TODO: Implement exponential backoff
    // TODO: Handle max reconnection attempts
    // TODO: Emit reconnection events
  }

  /**
   * Send heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    // TODO: Implement heartbeat mechanism
    // TODO: Handle heartbeat responses
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    // TODO: Clear heartbeat interval
  }
}




