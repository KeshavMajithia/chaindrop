/**
 * Sharded Storage Manager
 * Distributes file chunks across multiple IPFS providers for maximum redundancy
 * 
 * Distribution Strategy:
 * - 40% Filebase (largest free tier: 5GB)
 * - 20% Pinata (reliable, 1GB)
 * - 40% Lighthouse (100GB perpetual, fast)
 */

import { ipfsAdapterFactory } from './adapters/adapter-factory'
import { encryptFile, decryptFile } from '../encryption/client-encryption'

// Chunk distribution configuration
const CHUNK_DISTRIBUTION = {
  pinata: 0.20,    // 20% - metadata + some chunks (1GB limit)
  filebase: 0.40,  // 40% - most chunks (5GB limit, largest free tier)
  lighthouse: 0.40 // 40% - backup chunks (100GB perpetual)
}

const MIN_CHUNK_SIZE = 50 * 1024 // 50KB minimum
const MAX_CHUNK_SIZE = 1024 * 1024 // 1MB maximum
const MIN_CHUNKS = 5 // Minimum chunks to ensure all services get at least one
const MAX_CONCURRENT_UPLOADS = 5
const MAX_CONCURRENT_DOWNLOADS = 5
const MAX_RETRIES = 3

export type ServiceName = 'pinata' | 'filebase' | 'lighthouse'

export interface ChunkMetadata {
  index: number
  service: ServiceName
  cid: string
  checksum: string
  size: number
}

export interface ChunkMap {
  version: '1.0'
  totalChunks: number
  chunkSize: number
  originalSize: number
  fileName: string
  encryptionKey: string
  encryptionIV: string
  chunks: ChunkMetadata[]
}

export interface UploadProgress {
  overall: number
  uploaded: number
  total: number
  pinata: number
  filebase: number
  lighthouse: number
  pinataCounts: number
  filebaseCounts: number
  lighthouseCounts: number
}

export interface DownloadProgress {
  overall: number
  downloaded: number
  total: number
  currentChunk: number
}

/**
 * Calculate optimal chunk size based on file size
 * Ensures minimum number of chunks for proper distribution across all services
 * 
 * @param fileSize - Size of the file in bytes
 * @returns Optimal chunk size in bytes
 */
function calculateChunkSize(fileSize: number): number {
  // For very small files (< MIN_CHUNKS * MIN_CHUNK_SIZE), use smaller chunks
  if (fileSize < MIN_CHUNKS * MIN_CHUNK_SIZE) {
    // Divide into MIN_CHUNKS pieces, but not smaller than 10KB
    const calculatedSize = Math.max(Math.ceil(fileSize / MIN_CHUNKS), 10 * 1024)
    console.log(`📏 Small file (${fileSize} bytes): Using ${calculatedSize} byte chunks`)
    return calculatedSize
  }
  
  // Calculate chunk size that gives us at least MIN_CHUNKS
  let chunkSize = Math.ceil(fileSize / MIN_CHUNKS)
  
  // Clamp between MIN and MAX
  chunkSize = Math.max(MIN_CHUNK_SIZE, Math.min(MAX_CHUNK_SIZE, chunkSize))
  
  console.log(`📏 File size: ${fileSize} bytes, Chunk size: ${chunkSize} bytes`)
  return chunkSize
}

/**
 * Determine which service should store a chunk based on distribution strategy
 * 
 * Distribution:
 * - 40% Filebase (largest free tier: 5GB)
 * - 20% Pinata (reliable, 1GB + metadata)
 * - 40% Lighthouse (100GB perpetual, fast)
 */
function getServiceForChunk(index: number): ServiceName {
  const mod = index % 5
  
  // Filebase: 40% = indices 0, 1 in each group of 5
  if (mod === 0 || mod === 1) return 'filebase'
  
  // Pinata: 20% = index 2 in each group of 5
  if (mod === 2) return 'pinata'
  
  // Lighthouse: 40% = indices 3, 4 in each group of 5
  if (mod === 3 || mod === 4) return 'lighthouse'
  
  // Fallback (should never reach here)
  return 'filebase'
}

/**
 * Calculate SHA-256 checksum for a chunk
 */
async function calculateChecksum(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Split file into chunks with dynamic chunk size
 */
async function splitIntoChunks(blob: Blob, chunkSize: number): Promise<Blob[]> {
  const chunks: Blob[] = []
  let offset = 0
  
  while (offset < blob.size) {
    const end = Math.min(offset + chunkSize, blob.size)
    const chunk = blob.slice(offset, end)
    chunks.push(chunk)
    offset = end
  }
  
  const sizeDisplay = chunkSize >= 1024 * 1024 
    ? `${(chunkSize / 1024 / 1024).toFixed(2)}MB`
    : `${(chunkSize / 1024).toFixed(0)}KB`
  
  console.log(`📦 Split file into ${chunks.length} chunks of ~${sizeDisplay} each`)
  return chunks
}

/**
 * Upload chunks in parallel with concurrency limit
 */
async function uploadChunksInParallel(
  chunks: Blob[],
  fileName: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<ChunkMetadata[]> {
  const chunkMetadata: ChunkMetadata[] = []
  const serviceCounts = { pinata: 0, filebase: 0, lighthouse: 0 }
  const serviceProgress = { pinata: 0, filebase: 0, lighthouse: 0 }
  
  // Count chunks per service
  for (let i = 0; i < chunks.length; i++) {
    const service = getServiceForChunk(i)
    serviceCounts[service]++
  }
  
  console.log('📊 Chunk distribution:')
  console.log(`  - Filebase: ${serviceCounts.filebase} chunks (${(serviceCounts.filebase / chunks.length * 100).toFixed(1)}%)`)
  console.log(`  - Pinata: ${serviceCounts.pinata} chunks (${(serviceCounts.pinata / chunks.length * 100).toFixed(1)}%)`)
  console.log(`  - Lighthouse: ${serviceCounts.lighthouse} chunks (${(serviceCounts.lighthouse / chunks.length * 100).toFixed(1)}%)`)
  
  let uploadedCount = 0
  
  const uploadChunk = async (chunk: Blob, index: number): Promise<ChunkMetadata> => {
    const service = getServiceForChunk(index)
    const adapter = ipfsAdapterFactory.getAdapter(service)
    
    if (!adapter) {
      throw new Error(`Adapter for ${service} not found`)
    }
    
    console.log(`📤 [${index}] Uploading to ${service}...`)
    
    // Calculate checksum
    const arrayBuffer = await chunk.arrayBuffer()
    const checksum = await calculateChecksum(arrayBuffer)
    
    // Upload with retry logic
    let lastError: Error | null = null
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await adapter.upload(
          chunk,
          `${fileName}_chunk_${index}`,
          (chunkProgress) => {
            // Update service-specific progress
            const serviceUploaded = chunkMetadata.filter(c => c.service === service).length
            serviceProgress[service] = serviceCounts[service] > 0 
              ? (serviceUploaded / serviceCounts[service]) * 100 
              : 0
          }
        )
        
        console.log(`✅ [${index}] Uploaded to ${service}: ${result.cid}`)
        
        uploadedCount++
        
        // Update progress
        if (onProgress) {
          const serviceUploaded = chunkMetadata.filter(c => c.service === service).length + 1
          serviceProgress[service] = serviceCounts[service] > 0 
            ? (serviceUploaded / serviceCounts[service]) * 100 
            : 0
          
          onProgress({
            overall: (uploadedCount / chunks.length) * 100,
            uploaded: uploadedCount,
            total: chunks.length,
            pinata: serviceProgress.pinata,
            filebase: serviceProgress.filebase,
            lighthouse: serviceProgress.lighthouse,
            pinataCounts: serviceCounts.pinata,
            filebaseCounts: serviceCounts.filebase,
            lighthouseCounts: serviceCounts.lighthouse,
          })
        }
        
        return {
          index,
          service,
          cid: result.cid,
          checksum,
          size: chunk.size,
        }
      } catch (error) {
        lastError = error as Error
        console.warn(`⚠️ [${index}] Upload to ${service} failed (attempt ${attempt}/${MAX_RETRIES}):`, error)
        
        if (attempt < MAX_RETRIES) {
          const delay = Math.pow(2, attempt - 1) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw new Error(`Failed to upload chunk ${index} to ${service} after ${MAX_RETRIES} attempts: ${lastError?.message}`)
  }
  
  // Upload chunks in batches with concurrency limit
  for (let i = 0; i < chunks.length; i += MAX_CONCURRENT_UPLOADS) {
    const batch = chunks.slice(i, i + MAX_CONCURRENT_UPLOADS)
    const batchIndices = Array.from({ length: batch.length }, (_, idx) => i + idx)
    
    console.log(`🚀 Uploading batch ${Math.floor(i / MAX_CONCURRENT_UPLOADS) + 1}/${Math.ceil(chunks.length / MAX_CONCURRENT_UPLOADS)}`)
    
    const batchResults = await Promise.all(
      batch.map((chunk, idx) => uploadChunk(chunk, batchIndices[idx]))
    )
    
    chunkMetadata.push(...batchResults)
  }
  
  return chunkMetadata
}

/**
 * Upload file using sharded storage across multiple providers
 */
export async function uploadSharded(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  try {
    console.log('🚀 Starting sharded upload...')
    console.log('📄 File:', file.name, '|', file.size, 'bytes')
    
    // Step 1: Encrypt file
    console.log('🔐 Step 1: Encrypting file...')
    const fileBuffer = await file.arrayBuffer()
    const encryptionResult = await encryptFile(fileBuffer)
    console.log('✅ File encrypted')
    
    // Step 2: Calculate optimal chunk size and split into chunks
    console.log('📦 Step 2: Splitting into chunks...')
    const encryptedBlob = new Blob([encryptionResult.data])
    const chunkSize = calculateChunkSize(encryptedBlob.size)
    const chunks = await splitIntoChunks(encryptedBlob, chunkSize)
    console.log(`✅ Created ${chunks.length} chunks`)
    
    // Step 3: Upload chunks in parallel
    console.log('📤 Step 3: Uploading chunks to multiple services...')
    const chunkMetadata = await uploadChunksInParallel(chunks, file.name, onProgress)
    console.log('✅ All chunks uploaded')
    
    // Step 4: Create chunk map
    console.log('📋 Step 4: Creating chunk map...')
    const chunkMap: ChunkMap = {
      version: '1.0',
      totalChunks: chunks.length,
      chunkSize: chunkSize,
      originalSize: file.size,
      fileName: file.name,
      encryptionKey: encryptionResult.key,
      encryptionIV: encryptionResult.iv,
      chunks: chunkMetadata,
    }
    
    // Step 5: Upload chunk map to Pinata (single source of truth)
    console.log('🗺️ Step 5: Uploading chunk map to Pinata...')
    const chunkMapJson = JSON.stringify(chunkMap)
    const chunkMapBlob = new Blob([chunkMapJson], { type: 'application/json' })
    
    const pinataAdapter = ipfsAdapterFactory.getAdapter('pinata')
    if (!pinataAdapter) {
      throw new Error('Pinata adapter not available')
    }
    
    const metadataResult = await pinataAdapter.upload(
      chunkMapBlob,
      `${file.name}_chunkmap.json`
    )
    
    console.log('✅ Chunk map uploaded to Pinata')
    console.log('🆔 Metadata CID:', metadataResult.cid)
    
    console.log('🎉 Sharded upload complete!')
    console.log('📊 Summary:')
    console.log(`  - Total chunks: ${chunks.length}`)
    console.log(`  - Filebase: ${chunkMetadata.filter(c => c.service === 'filebase').length} chunks`)
    console.log(`  - Pinata: ${chunkMetadata.filter(c => c.service === 'pinata').length} chunks`)
    console.log(`  - Lighthouse: ${chunkMetadata.filter(c => c.service === 'lighthouse').length} chunks`)
    console.log(`  - Metadata CID: ${metadataResult.cid}`)
    
    return metadataResult.cid
  } catch (error) {
    console.error('❌ Sharded upload failed:', error)
    throw error
  }
}

/**
 * Download and reassemble sharded file
 */
export async function downloadSharded(
  metadataCID: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<Blob> {
  try {
    console.log('🔄 Starting sharded download...')
    console.log('🆔 Metadata CID:', metadataCID)
    
    // Step 1: Download chunk map from Pinata
    console.log('📋 Step 1: Downloading chunk map...')
    const pinataAdapter = ipfsAdapterFactory.getAdapter('pinata')
    if (!pinataAdapter) {
      throw new Error('Pinata adapter not available')
    }
    
    const chunkMapResult = await pinataAdapter.download(metadataCID)
    const chunkMapJson = await chunkMapResult.data.text()
    const chunkMap: ChunkMap = JSON.parse(chunkMapJson)
    
    console.log('✅ Chunk map downloaded')
    console.log('📄 File:', chunkMap.fileName)
    console.log('📦 Total chunks:', chunkMap.totalChunks)
    
    // Validate chunk map
    if (!validateChunkMap(chunkMap)) {
      throw new Error('Invalid chunk map')
    }
    
    // Step 2: Download all chunks in parallel
    console.log('📥 Step 2: Downloading chunks from multiple services...')
    const downloadedChunks: Array<{ index: number; data: ArrayBuffer }> = []
    let downloadedCount = 0
    
    const downloadChunk = async (chunkMeta: ChunkMetadata): Promise<{ index: number; data: ArrayBuffer }> => {
      const adapter = ipfsAdapterFactory.getAdapter(chunkMeta.service)
      if (!adapter) {
        throw new Error(`Adapter for ${chunkMeta.service} not found`)
      }
      
      // Check if CID is pending (service still processing)
      if (chunkMeta.cid === 'pending' || !chunkMeta.cid || chunkMeta.cid === 'null') {
        console.warn(`⏳ [${chunkMeta.index}] Chunk from ${chunkMeta.service} is still processing - skipping for now`)
        throw new Error(`Chunk ${chunkMeta.index} from ${chunkMeta.service} is still being processed (CID not ready yet)`)
      }
      
      console.log(`📥 [${chunkMeta.index}] Downloading from ${chunkMeta.service}...`)
      
      // Download with retry logic
      let lastError: Error | null = null
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const result = await adapter.download(chunkMeta.cid)
          const arrayBuffer = await result.data.arrayBuffer()
          
          // Verify checksum
          const checksum = await calculateChecksum(arrayBuffer)
          if (checksum !== chunkMeta.checksum) {
            throw new Error(`Checksum mismatch for chunk ${chunkMeta.index}`)
          }
          
          console.log(`✅ [${chunkMeta.index}] Downloaded and verified from ${chunkMeta.service}`)
          
          downloadedCount++
          if (onProgress) {
            onProgress({
              overall: (downloadedCount / chunkMap.totalChunks) * 100,
              downloaded: downloadedCount,
              total: chunkMap.totalChunks,
              currentChunk: chunkMeta.index,
            })
          }
          
          return {
            index: chunkMeta.index,
            data: arrayBuffer,
          }
        } catch (error) {
          lastError = error as Error
          console.warn(`⚠️ [${chunkMeta.index}] Download from ${chunkMeta.service} failed (attempt ${attempt}/${MAX_RETRIES}):`, error)
          
          if (attempt < MAX_RETRIES) {
            const delay = Math.pow(2, attempt - 1) * 1000
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
      }
      
      throw new Error(`Failed to download chunk ${chunkMeta.index} from ${chunkMeta.service} after ${MAX_RETRIES} attempts: ${lastError?.message}`)
    }
    
    // Download chunks in batches
    for (let i = 0; i < chunkMap.chunks.length; i += MAX_CONCURRENT_DOWNLOADS) {
      const batch = chunkMap.chunks.slice(i, i + MAX_CONCURRENT_DOWNLOADS)
      
      console.log(`🚀 Downloading batch ${Math.floor(i / MAX_CONCURRENT_DOWNLOADS) + 1}/${Math.ceil(chunkMap.chunks.length / MAX_CONCURRENT_DOWNLOADS)}`)
      
      const batchResults = await Promise.all(
        batch.map(chunkMeta => downloadChunk(chunkMeta))
      )
      
      downloadedChunks.push(...batchResults)
    }
    
    console.log('✅ All chunks downloaded and verified')
    
    // Step 3: Sort chunks by index
    console.log('🔀 Step 3: Sorting chunks...')
    downloadedChunks.sort((a, b) => a.index - b.index)
    
    // Step 4: Concatenate chunks
    console.log('🔗 Step 4: Reassembling file...')
    const totalSize = downloadedChunks.reduce((sum, chunk) => sum + chunk.data.byteLength, 0)
    const reassembled = new Uint8Array(totalSize)
    let offset = 0
    
    for (const chunk of downloadedChunks) {
      reassembled.set(new Uint8Array(chunk.data), offset)
      offset += chunk.data.byteLength
    }
    
    console.log('✅ File reassembled')
    
    // Step 5: Decrypt file
    console.log('🔓 Step 5: Decrypting file...')
    const decryptionResult = await decryptFile(
      reassembled.buffer,
      chunkMap.encryptionKey,
      chunkMap.encryptionIV
    )
    
    console.log('✅ File decrypted')
    
    // Create final blob
    const finalBlob = new Blob([decryptionResult.data], {
      type: 'application/octet-stream'
    })
    
    console.log('🎉 Sharded download complete!')
    console.log('📊 Summary:')
    console.log(`  - Total chunks: ${chunkMap.totalChunks}`)
    console.log(`  - Original size: ${chunkMap.originalSize} bytes`)
    console.log(`  - Final size: ${finalBlob.size} bytes`)
    
    return finalBlob
  } catch (error) {
    console.error('❌ Sharded download failed:', error)
    throw error
  }
}

/**
 * Validate chunk map structure
 */
function validateChunkMap(chunkMap: ChunkMap): boolean {
  if (chunkMap.version !== '1.0') {
    console.error('Invalid chunk map version')
    return false
  }
  
  if (!chunkMap.chunks || chunkMap.chunks.length !== chunkMap.totalChunks) {
    console.error('Chunk count mismatch')
    return false
  }
  
  // Verify all chunks have required fields
  for (const chunk of chunkMap.chunks) {
    if (
      typeof chunk.index !== 'number' ||
      !chunk.service ||
      !chunk.cid ||
      !chunk.checksum ||
      typeof chunk.size !== 'number'
    ) {
      console.error('Invalid chunk metadata:', chunk)
      return false
    }
  }
  
  return true
}

/**
 * Get storage usage statistics
 */
export async function getServiceStats(): Promise<{
  pinata: { usage: string; limit: string }
  filebase: { usage: string; limit: string }
  lighthouse: { usage: string; limit: string }
}> {
  // This would require API calls to each service
  // For now, return placeholder data
  return {
    pinata: { usage: 'Unknown', limit: '1GB' },
    filebase: { usage: 'Unknown', limit: '5GB' },
    lighthouse: { usage: 'Unknown', limit: '100GB' },
  }
}

/**
 * Estimate upload time based on file size
 */
export function estimateUploadTime(fileSize: number): string {
  // Rough estimate: 1MB/s average upload speed
  const seconds = fileSize / (1024 * 1024)
  
  if (seconds < 60) {
    return `~${Math.ceil(seconds)} seconds`
  } else if (seconds < 3600) {
    return `~${Math.ceil(seconds / 60)} minutes`
  } else {
    return `~${Math.ceil(seconds / 3600)} hours`
  }
}
