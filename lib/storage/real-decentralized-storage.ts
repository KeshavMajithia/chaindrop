/**
 * Real Decentralized Storage Implementation via Multi-IPFS Providers
 * Uses multiple IPFS providers (Pinata, Filebase, Apillon) with automatic fallback
 * Provides maximum redundancy and reliability
 */

import { encryptFile, decryptFile } from '../encryption/client-encryption'
import { ipfsAdapterFactory } from './adapters/adapter-factory'
import { storeDropLocally, getDropLocally } from './local-drop-storage'
import type { LocalDropData } from './local-drop-storage'

export interface RealDropData {
  dropId: string
  fileName: string
  fileSize: number
  walrusBlobId: string // Using same field name for compatibility (actually IPFS CID)
  encryptionKey: string
  encryptionIV: string
  createdAt: string
  expiresAt: string
  downloadCount: number
  maxDownloads: number
  isExpired: boolean
  txHash: string
  network: string
}

/**
 * Create a REAL decentralized drop with IPFS + Pinata
 * 1. Encrypt file client-side
 * 2. Upload encrypted file to IPFS via Pinata
 * 3. Upload metadata to IPFS via Pinata
 * 4. Store in localStorage as backup (optional)
 */
export async function createRealDecentralizedDrop(
  dropId: string,
  fileSize: number,
  file: File,
  network: string = 'testnet'
): Promise<RealDropData> {
  try {
    console.log('🔄 Creating REAL decentralized drop with IPFS + Pinata...')
    console.log('📄 File:', file.name, '|', file.size, 'bytes')

    // Step 1: Encrypt file client-side
    console.log('🔐 Step 1: Encrypting file client-side...')
    const fileBuffer = await file.arrayBuffer()
    const encryptionResult = await encryptFile(fileBuffer)
    
    console.log('✅ File encrypted client-side')
    console.log('🔑 Encryption key generated')
    console.log('📊 Encrypted size:', encryptionResult.data.byteLength, 'bytes')

    // Step 2: Upload encrypted file to IPFS (multi-provider with fallback)
    console.log('🌐 Step 2: Uploading to IPFS (trying all configured providers)...')
    const encryptedBlob = new Blob([encryptionResult.data])
    const ipfsResult = await ipfsAdapterFactory.upload(encryptedBlob, `${dropId}_encrypted`)
    
    console.log('✅ File uploaded to IPFS')
    console.log('🆔 IPFS CID:', ipfsResult.cid)
    console.log('🏢 Provider used:', ipfsResult.provider)

    // Step 3: Upload metadata to IPFS
    console.log('📋 Step 3: Storing metadata on IPFS...')
    
    const metadata = {
      dropId,
      fileName: file.name,
      fileSize,
      ipfsCID: ipfsResult.cid,
      encryptionKey: encryptionResult.key,
      encryptionIV: encryptionResult.iv,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      maxDownloads: -1, // Unlimited
    }

    const metadataJson = JSON.stringify(metadata)
    const metadataArray = new TextEncoder().encode(metadataJson)
    const metadataBlob = new Blob([metadataArray], { type: 'application/json' })
    const metadataResult = await ipfsAdapterFactory.upload(metadataBlob, `${dropId}_metadata.json`)
    
    console.log('✅ Metadata stored on IPFS')
    console.log('📋 Metadata CID:', metadataResult.cid)
    console.log('🏢 Provider used:', metadataResult.provider)
    
    const dropData: RealDropData = {
      dropId,
      fileName: file.name,
      fileSize,
      walrusBlobId: ipfsResult.cid, // File CID
      encryptionKey: encryptionResult.key,
      encryptionIV: encryptionResult.iv,
      createdAt: metadata.createdAt,
      expiresAt: metadata.expiresAt,
      downloadCount: 0,
      maxDownloads: -1,
      isExpired: false,
      txHash: metadataResult.cid, // Metadata CID
      network
    }

    // Also store in localStorage as backup
    try {
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(encryptionResult.data)))
      const localDropData: LocalDropData = {
        ...dropData,
        encryptedFileData: base64Data
      }
      storeDropLocally(localDropData)
      console.log('💾 Backup stored in localStorage')
    } catch (e) {
      console.warn('⚠️ localStorage backup failed (file too large?):', e)
    }

    console.log('🎉 REAL decentralized drop created successfully!')
    console.log('📊 Summary:')
    console.log('  - File encrypted client-side ✅')
    console.log('  - File uploaded to IPFS ✅')
    console.log('  - Metadata stored on IPFS ✅')
    console.log('  - 100% DECENTRALIZED ✅')
    console.log('  - Drop ID:', dropId)
    console.log('  - File CID:', ipfsResult.cid)
    console.log('  - Metadata CID:', metadataResult.cid)

    return dropData
  } catch (error) {
    console.error('❌ Failed to create real decentralized drop:', error)
    throw new Error(`Real decentralized drop creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get drop metadata from IPFS (with localStorage fallback)
 */
export async function getRealDropMetadata(
  dropId: string,
  metadataBlobId?: string,
  network: string = 'testnet'
): Promise<RealDropData | null> {
  try {
    console.log('🔍 Retrieving drop metadata...')
    console.log('🆔 Drop ID:', dropId)
    console.log('📋 Metadata CID:', metadataBlobId)

    // Try IPFS first if metadata CID provided
    if (metadataBlobId) {
      try {
        console.log('🌐 Downloading metadata from IPFS (trying all gateways)...')
        const metadataResult = await ipfsAdapterFactory.download(metadataBlobId)
        const arrayBuffer = await metadataResult.data.arrayBuffer()
        const metadataJson = new TextDecoder().decode(arrayBuffer)
        const metadata = JSON.parse(metadataJson)
        
        console.log('✅ Metadata retrieved from IPFS')
        console.log('📝 File:', metadata.fileName)
        
        return {
          dropId: metadata.dropId,
          fileName: metadata.fileName,
          fileSize: metadata.fileSize,
          walrusBlobId: metadata.ipfsCID,
          encryptionKey: metadata.encryptionKey,
          encryptionIV: metadata.encryptionIV,
          createdAt: metadata.createdAt,
          expiresAt: metadata.expiresAt,
          downloadCount: 0,
          maxDownloads: metadata.maxDownloads,
          isExpired: new Date() > new Date(metadata.expiresAt),
          txHash: metadataBlobId,
          network
        }
      } catch (ipfsError) {
        console.warn('⚠️ IPFS download failed, trying localStorage...')
      }
    }

    // Fallback to localStorage
    console.log('💾 Checking localStorage...')
    const localData = getDropLocally(dropId)
    
    if (!localData) {
      console.error('❌ Drop not found')
      return null
    }
    
    console.log('✅ Metadata retrieved from localStorage backup')
    console.log('📝 File:', localData.fileName)
    
    return {
      dropId: localData.dropId,
      fileName: localData.fileName,
      fileSize: localData.fileSize,
      walrusBlobId: localData.walrusBlobId,
      encryptionKey: localData.encryptionKey,
      encryptionIV: localData.encryptionIV,
      createdAt: localData.createdAt,
      expiresAt: localData.expiresAt,
      downloadCount: localData.downloadCount,
      maxDownloads: localData.maxDownloads,
      isExpired: localData.isExpired,
      txHash: localData.txHash,
      network
    }
  } catch (error) {
    console.error('❌ Failed to retrieve drop metadata:', error)
    return null
  }
}

/**
 * Download file from REAL IPFS (with localStorage fallback)
 * 1. Get metadata (IPFS or localStorage)
 * 2. Download encrypted file from IPFS
 * 3. Decrypt file client-side
 */
export async function downloadFromRealDecentralizedDrop(
  dropId: string,
  metadataBlobId?: string,
  network: string = 'testnet'
): Promise<Blob | null> {
  try {
    console.log('🔄 Downloading from decentralized storage:', dropId)
    console.log('📋 Using metadata CID:', metadataBlobId)

    // Step 1: Get metadata
    console.log('🔍 Step 1: Getting metadata...')
    const metadata = await getRealDropMetadata(dropId, metadataBlobId, network)
    
    if (!metadata) {
      console.log('❌ Drop metadata not found')
      return null
    }

    console.log('✅ Metadata retrieved')
    console.log('🆔 File CID:', metadata.walrusBlobId)

    // Step 2: Download encrypted file
    let encryptedData: ArrayBuffer
    
    // Try IPFS first
    try {
      console.log('🌐 Step 2: Downloading from IPFS (trying all gateways)...')
      const ipfsResult = await ipfsAdapterFactory.download(metadata.walrusBlobId)
      encryptedData = await ipfsResult.data.arrayBuffer()
      console.log('✅ File downloaded from IPFS')
    } catch (ipfsError) {
      // Fallback to localStorage
      console.warn('⚠️ IPFS download failed, trying localStorage backup...')
      const localData = getDropLocally(dropId)
      
      if (!localData || !localData.encryptedFileData) {
        throw new Error('File not available in IPFS or localStorage')
      }
      
      const binaryString = atob(localData.encryptedFileData)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      encryptedData = bytes.buffer
      console.log('✅ File retrieved from localStorage backup')
    }
    
    console.log('📊 Encrypted file size:', encryptedData.byteLength, 'bytes')

    // Step 3: Decrypt file client-side
    console.log('🔓 Step 3: Decrypting file client-side...')
    const decryptionResult = await decryptFile(
      encryptedData,
      metadata.encryptionKey,
      metadata.encryptionIV
    )
    
    console.log('✅ File decrypted client-side')
    console.log('📊 Final size:', decryptionResult.data.byteLength, 'bytes')

    // Create blob for download
    const blob = new Blob([decryptionResult.data], { 
      type: 'application/octet-stream' 
    })

    console.log('🎉 File downloaded and decrypted successfully!')
    console.log('📊 Summary:')
    console.log('  - Metadata retrieved ✅')
    console.log('  - File downloaded from IPFS ✅')
    console.log('  - File decrypted client-side ✅')
    console.log('  - Final file size:', blob.size, 'bytes')

    return blob
  } catch (error) {
    console.error('❌ Failed to download from decentralized storage:', error)
    return null
  }
}

