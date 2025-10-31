/**
 * Example usage of PeerConnectionManager
 * Demonstrates how to use the WebRTC peer connection functionality
 */

import { PeerConnectionManager } from './peer-connection'
import { DEFAULT_WEBRTC_CONFIG } from './config'

// Example: Basic peer connection setup
export async function setupPeerConnection() {
  // Initialize the peer connection manager
  const peerManager = new PeerConnectionManager(DEFAULT_WEBRTC_CONFIG)
  
  // Set up event listeners
  peerManager.on('initialized', () => {
    console.log('✅ PeerConnectionManager initialized')
  })

  peerManager.on('peerCreated', ({ peerId, isInitiator }) => {
    console.log(`✅ Peer created: ${peerId} (initiator: ${isInitiator})`)
  })

  peerManager.on('peerConnected', ({ peerId }) => {
    console.log(`✅ Peer connected: ${peerId}`)
  })

  peerManager.on('peerDisconnected', ({ peerId }) => {
    console.log(`❌ Peer disconnected: ${peerId}`)
  })

  peerManager.on('connectionStateChanged', ({ peerId, state }) => {
    console.log(`🔄 Connection state changed for ${peerId}: ${state}`)
  })

  peerManager.on('connectionQualityChanged', ({ peerId, quality }) => {
    console.log(`📊 Connection quality for ${peerId}:`, {
      latency: `${quality.latency}ms`,
      stable: quality.isStable,
      state: quality.connectionState
    })
  })

  peerManager.on('data', ({ peerId, data }) => {
    console.log(`📨 Data received from ${peerId}:`, data)
  })

  peerManager.on('signal', ({ peerId, signal }) => {
    console.log(`📡 Signal from ${peerId}:`, signal.type)
    // In a real app, you would send this signal to the remote peer via signaling server
  })

  peerManager.on('error', (error) => {
    console.error('❌ Peer connection error:', error.message)
  })

  try {
    // Initialize the manager
    await peerManager.initialize()

    // Create a peer connection (sender)
    const senderPeer = await peerManager.createPeer('sender-123', true)
    console.log('Created sender peer:', senderPeer.id)

    // Create a peer connection (receiver)
    const receiverPeer = await peerManager.createPeer('receiver-456', false)
    console.log('Created receiver peer:', receiverPeer.id)

    // In a real scenario, you would:
    // 1. Connect to signaling server
    // 2. Exchange signals between peers
    // 3. Establish direct P2P connection
    // 4. Start file transfer

    return peerManager

  } catch (error) {
    console.error('Failed to setup peer connection:', error)
    throw error
  }
}

// Example: Send data to a peer
export async function sendDataToPeer(peerManager: PeerConnectionManager, peerId: string, data: any) {
  try {
    await peerManager.sendData(peerId, data)
    console.log(`✅ Data sent to ${peerId}`)
  } catch (error) {
    console.error(`❌ Failed to send data to ${peerId}:`, error)
  }
}

// Example: Get connection status
export function getConnectionStatus(peerManager: PeerConnectionManager, peerId: string) {
  const status = peerManager.getPeerStatus(peerId)
  const quality = peerManager.getConnectionQuality(peerId)
  
  console.log(`📊 Connection status for ${peerId}:`, {
    connected: status?.isConnected,
    state: status?.connectionState,
    quality: quality ? {
      latency: `${quality.latency}ms`,
      stable: quality.isStable,
      lastPing: new Date(quality.lastPing).toISOString()
    } : 'No quality data'
  })

  return { status, quality }
}

// Example: Cleanup
export async function cleanupPeerConnections(peerManager: PeerConnectionManager) {
  try {
    await peerManager.cleanup()
    console.log('✅ All peer connections cleaned up')
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  }
}






