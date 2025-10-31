/**
 * WebRTC Peer Connection Management
 * Handles peer-to-peer connections using simple-peer
 */

import { EventEmitter } from 'events'
import SimplePeer from 'simple-peer'
import { PeerConnection, PeerEvents, WebRTCConfig, WebRTCError } from '@/types/webrtc'

interface ConnectionQuality {
  latency: number
  connectionState: string
  lastPing: number
  isStable: boolean
}

export class PeerConnectionManager extends EventEmitter {
  private peers: Map<string, PeerConnection> = new Map()
  private peerInstances: Map<string, SimplePeer> = new Map()
  private connectionQuality: Map<string, ConnectionQuality> = new Map()
  private config: WebRTCConfig
  private isInitialized: boolean = false
  private pingInterval: NodeJS.Timeout | null = null

  constructor(config: WebRTCConfig) {
    super()
    this.config = config
  }

  /**
   * Initialize the peer connection manager
   */
  async initialize(): Promise<void> {
    try {
      // Validate configuration
      if (!this.config.iceServers || this.config.iceServers.length === 0) {
        throw new Error('ICE servers configuration is required')
      }

      // Start connection quality monitoring
      this.startQualityMonitoring()
      
      this.isInitialized = true
      this.emit('initialized')
    } catch (error) {
      this.emit('error', this.createWebRTCError('CONNECTION_FAILED', error as Error))
      throw error
    }
  }

  /**
   * Create a new peer connection
   */
  async createPeer(peerId: string, isInitiator: boolean = false): Promise<PeerConnection> {
    try {
      if (!this.isInitialized) {
        throw new Error('PeerConnectionManager not initialized')
      }

      // Create SimplePeer instance with configuration
      const peerInstance = new SimplePeer({
        initiator: isInitiator,
        trickle: false,
        config: {
          iceServers: this.config.iceServers
        }
      })

      // Create peer connection object
      const peer: PeerConnection = {
        id: peerId,
        isConnected: false,
        isInitiator,
        connectionState: 'new'
      }

      // Store peer and instance
      this.peers.set(peerId, peer)
      this.peerInstances.set(peerId, peerInstance)
      this.connectionQuality.set(peerId, {
        latency: 0,
        connectionState: 'new',
        lastPing: Date.now(),
        isStable: false
      })

      // Set up event handlers
      this.setupPeerEventHandlers(peerId, peerInstance)

      this.emit('peerCreated', { peerId, isInitiator })
      return peer

    } catch (error) {
      this.emit('error', this.createWebRTCError('CONNECTION_FAILED', error as Error))
      throw error
    }
  }

  /**
   * Connect to a peer
   */
  async connectToPeer(peerId: string, signal?: any): Promise<void> {
    try {
      const peerInstance = this.peerInstances.get(peerId)
      const peer = this.peers.get(peerId)

      if (!peerInstance || !peer) {
        throw new Error(`Peer ${peerId} not found`)
      }

      if (signal) {
        // Signal received from remote peer
        peerInstance.signal(signal)
      } else {
        // Generate signal for remote peer
        // Note: signal() method doesn't return a value, it emits a 'signal' event
        // The signal will be handled by the setupPeerEventHandlers method
      }

      // Update connection state
      peer.connectionState = 'connecting'
      this.emit('connectionStateChanged', { peerId, state: 'connecting' })

    } catch (error) {
      this.emit('error', this.createWebRTCError('CONNECTION_FAILED', error as Error))
      throw error
    }
  }

  /**
   * Send data to a peer
   */
  async sendData(peerId: string, data: any): Promise<void> {
    try {
      const peerInstance = this.peerInstances.get(peerId)
      const peer = this.peers.get(peerId)

      if (!peerInstance || !peer) {
        throw new Error(`Peer ${peerId} not found`)
      }

      if (!peer.isConnected) {
        throw new Error(`Peer ${peerId} is not connected`)
      }

      // Send data through data channel
      peerInstance.send(JSON.stringify(data))

    } catch (error) {
      this.emit('error', this.createWebRTCError('NETWORK_ERROR', error as Error))
      throw error
    }
  }

  /**
   * Disconnect from a peer
   */
  async disconnectFromPeer(peerId: string): Promise<void> {
    try {
      const peerInstance = this.peerInstances.get(peerId)
      const peer = this.peers.get(peerId)

      if (peerInstance) {
        // Destroy peer instance
        peerInstance.destroy()
        this.peerInstances.delete(peerId)
      }

      if (peer) {
        // Update peer state
        peer.isConnected = false
        peer.connectionState = 'closed'
        this.emit('connectionStateChanged', { peerId, state: 'closed' })
      }

      // Clean up quality monitoring
      this.connectionQuality.delete(peerId)

      this.emit('peerDisconnected', { peerId })

    } catch (error) {
      this.emit('error', this.createWebRTCError('NETWORK_ERROR', error as Error))
    }
  }

  /**
   * Get peer connection status
   */
  getPeerStatus(peerId: string): PeerConnection | undefined {
    return this.peers.get(peerId)
  }

  /**
   * Get connection quality for a peer
   */
  getConnectionQuality(peerId: string): ConnectionQuality | undefined {
    return this.connectionQuality.get(peerId)
  }

  /**
   * Get all connected peers
   */
  getConnectedPeers(): string[] {
    return Array.from(this.peers.entries())
      .filter(([_, peer]) => peer.isConnected)
      .map(([peerId, _]) => peerId)
  }

  /**
   * Clean up all connections
   */
  async cleanup(): Promise<void> {
    try {
      // Disconnect all peers
      const peerIds = Array.from(this.peers.keys())
      for (const peerId of peerIds) {
        await this.disconnectFromPeer(peerId)
      }

      // Clear all maps
      this.peers.clear()
      this.peerInstances.clear()
      this.connectionQuality.clear()

      // Stop quality monitoring
      if (this.pingInterval) {
        clearInterval(this.pingInterval)
        this.pingInterval = null
      }

      this.isInitialized = false
      this.emit('cleanup')

    } catch (error) {
      this.emit('error', this.createWebRTCError('NETWORK_ERROR', error as Error))
    }
  }

  /**
   * Handle peer connection events
   */
  private setupPeerEventHandlers(peerId: string, peerInstance: SimplePeer): void {
    // Connection established
    peerInstance.on('connect', () => {
      const peer = this.peers.get(peerId)
      if (peer) {
        peer.isConnected = true
        peer.connectionState = 'connected'
        this.emit('connectionStateChanged', { peerId, state: 'connected' })
        this.emit('peerConnected', { peerId })
      }
    })

    // Connection closed
    peerInstance.on('close', () => {
      const peer = this.peers.get(peerId)
      if (peer) {
        peer.isConnected = false
        peer.connectionState = 'closed'
        this.emit('connectionStateChanged', { peerId, state: 'closed' })
        this.emit('peerDisconnected', { peerId })
      }
    })

    // Data received
    peerInstance.on('data', (data: Buffer) => {
      try {
        const parsedData = JSON.parse(data.toString())
        this.emit('data', { peerId, data: parsedData })
      } catch (error) {
        // Handle binary data or other non-JSON data
        this.emit('data', { peerId, data: data.toString() })
      }
    })

    // Signal generated (for offer/answer exchange)
    peerInstance.on('signal', (signal: any) => {
      this.emit('signal', { peerId, signal })
    })

    // Connection error
    peerInstance.on('error', (error: Error) => {
      const peer = this.peers.get(peerId)
      if (peer) {
        peer.connectionState = 'failed'
        this.emit('connectionStateChanged', { peerId, state: 'failed' })
      }
      this.emit('error', this.createWebRTCError('CONNECTION_FAILED', error))
    })

    // ICE connection state change
    peerInstance.on('iceConnectionStateChange', (state: string) => {
      const quality = this.connectionQuality.get(peerId)
      if (quality) {
        quality.connectionState = state
        quality.isStable = state === 'connected'
      }
      this.emit('iceConnectionStateChanged', { peerId, state })
    })
  }

  /**
   * Start connection quality monitoring
   */
  private startQualityMonitoring(): void {
    this.pingInterval = setInterval(() => {
      this.measureConnectionQuality()
    }, 5000) // Check every 5 seconds
  }

  /**
   * Measure connection quality for all peers
   */
  private measureConnectionQuality(): void {
    for (const [peerId, peer] of this.peers.entries()) {
      if (peer.isConnected) {
        const startTime = Date.now()
        
        // Send ping to measure latency
        this.sendData(peerId, { type: 'ping', timestamp: startTime })
          .then(() => {
            // This will be handled by the ping response
          })
          .catch(() => {
            // Connection might be unstable
            const quality = this.connectionQuality.get(peerId)
            if (quality) {
              quality.isStable = false
            }
          })
      }
    }
  }

  /**
   * Handle ping response for latency measurement
   */
  private handlePingResponse(peerId: string, timestamp: number): void {
    const latency = Date.now() - timestamp
    const quality = this.connectionQuality.get(peerId)
    
    if (quality) {
      quality.latency = latency
      quality.lastPing = Date.now()
      quality.isStable = latency < 1000 // Consider stable if latency < 1s
      
      this.emit('connectionQualityChanged', { peerId, quality })
    }
  }

  /**
   * Create WebRTC error with proper typing
   */
  private createWebRTCError(code: WebRTCError['code'], originalError: Error): WebRTCError {
    const error = new Error(originalError.message) as WebRTCError
    error.code = code
    error.details = originalError
    return error
  }
}
