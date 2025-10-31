/**
 * Example usage of FileTransferManager
 * Demonstrates how to use the chunked file transfer functionality
 */

import { FileTransferManager } from './file-transfer'
import { FileMetadata, TransferProgress } from '@/types/webrtc'

// Example: Send a file
export async function sendFileExample(file: File, peerId: string) {
  const transferManager = new FileTransferManager(16 * 1024) // 16KB chunks

  // Set up event handlers
  transferManager.on('transferStarted', ({ fileId, isReceiver }) => {
    console.log(`📤 Transfer started: ${fileId} (receiver: ${isReceiver})`)
  })

  transferManager.on('progress', (progress: TransferProgress) => {
    console.log(`📊 Progress: ${progress.percentage}% (${formatBytes(progress.speed)}/s)`)
  })

  transferManager.on('transferCompleted', ({ fileId, blob, metadata }) => {
    console.log(`✅ Transfer completed: ${fileId}`)
    console.log(`📁 File: ${metadata.name} (${formatBytes(metadata.size)})`)
    
    // Create download link
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = metadata.name
    a.click()
    URL.revokeObjectURL(url)
  })

  transferManager.on('transferFailed', ({ fileId, error }) => {
    console.error(`❌ Transfer failed: ${fileId}`, error.message)
  })

  try {
    // Start sending file
    const fileId = await transferManager.sendFile(file, peerId, {
      onProgress: (progress) => {
        console.log(`📈 Progress: ${progress.percentage}%`)
      },
      onComplete: (fileId) => {
        console.log(`🎉 File ${fileId} sent successfully!`)
      },
      onError: (error) => {
        console.error(`💥 Error: ${error.message}`)
      }
    })

    console.log(`🚀 Started sending file: ${fileId}`)
    return fileId

  } catch (error) {
    console.error('Failed to start file transfer:', error)
    throw error
  }
}

// Example: Receive a file
export async function receiveFileExample(fileMetadata: FileMetadata, peerId: string) {
  const transferManager = new FileTransferManager()

  // Set up event handlers
  transferManager.on('transferStarted', ({ fileId, isReceiver }) => {
    console.log(`📥 Receiving file: ${fileId}`)
  })

  transferManager.on('progress', (progress: TransferProgress) => {
    console.log(`📊 Receiving: ${progress.percentage}% (${formatBytes(progress.speed)}/s)`)
  })

  transferManager.on('transferCompleted', ({ fileId, blob, metadata }) => {
    console.log(`✅ File received: ${metadata.name}`)
    
    // Save file
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = metadata.name
    a.click()
    URL.revokeObjectURL(url)
  })

  try {
    // Start receiving file
    await transferManager.receiveFile(fileMetadata, peerId, {
      onProgress: (progress) => {
        console.log(`📥 Receiving: ${progress.percentage}%`)
      },
      onComplete: (fileId) => {
        console.log(`🎉 File ${fileId} received successfully!`)
      },
      onError: (error) => {
        console.error(`💥 Receive error: ${error.message}`)
      }
    })

  } catch (error) {
    console.error('Failed to start file reception:', error)
    throw error
  }
}

// Example: Handle incoming chunks (called by PeerConnectionManager)
export function handleIncomingChunk(transferManager: FileTransferManager, chunkData: any, peerId: string) {
  try {
    // Parse chunk data
    const chunk = JSON.parse(chunkData)
    
    // Process chunk
    transferManager.processChunk(chunk, peerId)
    
  } catch (error) {
    console.error('Failed to process chunk:', error)
  }
}

// Example: Monitor transfer progress
export function monitorTransfers(transferManager: FileTransferManager) {
  const activeTransfers = transferManager.getActiveTransfers()
  
  console.log(`📊 Active transfers: ${activeTransfers.length}`)
  
  activeTransfers.forEach(transfer => {
    console.log(`📁 ${transfer.fileName}: ${transfer.percentage}% (${formatBytes(transfer.speed)}/s)`)
    
    if (transfer.estimatedTimeRemaining > 0) {
      console.log(`⏱️ ETA: ${formatTime(transfer.estimatedTimeRemaining)}`)
    }
  })
}

// Example: Cancel a transfer
export async function cancelTransferExample(transferManager: FileTransferManager, fileId: string) {
  try {
    await transferManager.cancelTransfer(fileId)
    console.log(`❌ Transfer ${fileId} cancelled`)
  } catch (error) {
    console.error('Failed to cancel transfer:', error)
  }
}

// Example: Clean up completed transfers
export async function cleanupTransfers(transferManager: FileTransferManager) {
  try {
    await transferManager.cleanupCompletedTransfers()
    console.log('🧹 Cleaned up completed transfers')
  } catch (error) {
    console.error('Failed to cleanup transfers:', error)
  }
}

// Example: Large file transfer (1GB+)
export async function transferLargeFile(file: File, peerId: string) {
  // Use larger chunk size for better performance with large files
  const transferManager = new FileTransferManager(64 * 1024) // 64KB chunks
  
  console.log(`📁 Large file: ${file.name} (${formatBytes(file.size)})`)
  console.log(`📦 Chunk size: ${formatBytes(64 * 1024)}`)
  console.log(`🔢 Total chunks: ${Math.ceil(file.size / (64 * 1024))}`)

  // Set up progress monitoring
  let lastProgress = 0
  transferManager.on('progress', (progress: TransferProgress) => {
    if (progress.percentage - lastProgress >= 5) { // Log every 5%
      console.log(`📊 Progress: ${progress.percentage}% (${formatBytes(progress.speed)}/s)`)
      lastProgress = progress.percentage
    }
  })

  try {
    const fileId = await transferManager.sendFile(file, peerId)
    console.log(`🚀 Started large file transfer: ${fileId}`)
    return fileId
  } catch (error) {
    console.error('Failed to start large file transfer:', error)
    throw error
  }
}

// Utility functions
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

// Example: Integration with PeerConnectionManager
export function integrateWithPeerConnection(
  transferManager: FileTransferManager,
  peerConnectionManager: any // PeerConnectionManager instance
) {
  // Handle chunks to send
  transferManager.on('chunkToSend', ({ chunk, peerId }) => {
    peerConnectionManager.sendData(peerId, {
      type: 'file-chunk',
      data: chunk
    })
  })

  // Handle chunk acknowledgments
  transferManager.on('chunkAcknowledgment', ({ fileId, chunkIndex, peerId }) => {
    peerConnectionManager.sendData(peerId, {
      type: 'chunk-ack',
      fileId,
      chunkIndex
    })
  })

  // Handle incoming data from peer
  peerConnectionManager.on('data', ({ peerId, data }: { peerId: string; data: any }) => {
    if (data.type === 'file-chunk') {
      transferManager.processChunk(data.data, peerId)
    } else if (data.type === 'chunk-ack') {
      // Handle acknowledgment
      console.log(`✅ Chunk ${data.chunkIndex} acknowledged for file ${data.fileId}`)
    }
  })
}






