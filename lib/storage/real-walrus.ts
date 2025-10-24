/**
 * Real IPFS Storage Implementation via Pinata
 * Uses Pinata pinning service for reliable IPFS uploads
 */

export interface IPFSUploadResult {
  cid: string // Content Identifier (IPFS hash)
  url: string
  size: number
  encryptionKey: string
}

export interface IPFSDownloadResult {
  data: ArrayBuffer
  size: number
}

/**
 * Real IPFS Storage Client (Pinata)
 * Uploads files to IPFS network via Pinata pinning service
 */
export class RealIPFSStorage {
  private pinataJWT: string | undefined
  private gateways: string[]

  constructor() {
    // Get Pinata JWT from environment
    this.pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT
    
    // Multiple public IPFS gateways for reliability
    this.gateways = [
      'https://gateway.pinata.cloud/ipfs',
      'https://ipfs.io/ipfs',
      'https://cloudflare-ipfs.com/ipfs',
      'https://dweb.link/ipfs',
      'https://w3s.link/ipfs',
    ]

    console.log('🌐 IPFS storage initialized (Pinata)')
    console.log('🔑 API Key configured:', this.pinataJWT ? 'YES ✅' : 'NO ❌')
    console.log('📥 Gateways:', this.gateways.length, 'available')
    
    if (!this.pinataJWT) {
      console.warn('⚠️ PINATA_JWT not found in environment variables')
      console.warn('💡 Add NEXT_PUBLIC_PINATA_JWT to .env.local')
    }
  }

  /**
   * Upload encrypted file to IPFS network
   * Uses public IPFS gateway with CAR format
   */
  async uploadFile(
    encryptedFile: ArrayBuffer,
    onProgress?: (progress: number) => void
  ): Promise<IPFSUploadResult> {
    console.log('🔄 Uploading encrypted file to IPFS via Pinata...')
    console.log('📊 File size:', encryptedFile.byteLength, 'bytes')

    // Check if API key is configured
    if (!this.pinataJWT) {
      throw new Error('Pinata JWT not configured. Add NEXT_PUBLIC_PINATA_JWT to .env.local')
    }

    try {
      // Prepare FormData for Pinata API
      const formData = new FormData()
      const blob = new Blob([encryptedFile], { type: 'application/octet-stream' })
      formData.append('file', blob, 'encrypted_file')

      console.log('📤 Uploading to IPFS via Pinata...')
      
      // Upload to Pinata
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.pinataJWT}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Pinata upload failed: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      const cid = result.IpfsHash
      
      console.log('✅ File uploaded to IPFS via Pinata')
      console.log('🆔 CID:', cid)
      console.log('🌐 URL:', `${this.gateways[0]}/${cid}`)
      console.log('📌 Pinned successfully!')

      return {
        cid,
        url: `${this.gateways[0]}/${cid}`,
        size: encryptedFile.byteLength,
        encryptionKey: ''
      }
    } catch (error) {
      console.error('❌ Pinata upload failed:', error)
      throw new Error(`Failed to upload to IPFS via Pinata: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Download file from IPFS network
   * Tries multiple public gateways for reliability
   */
  async downloadFile(cid: string, retries: number = 3): Promise<IPFSDownloadResult> {
    console.log('🔄 Downloading file from IPFS network:', cid)

    let lastError: Error | null = null

    // Try each gateway
    for (let i = 0; i < this.gateways.length; i++) {
      const gateway = this.gateways[i]
      try {
        const downloadUrl = `${gateway}/${cid}`
        console.log(`📥 Attempt ${i + 1}/${this.gateways.length}: ${gateway}`)

        const response = await fetch(downloadUrl)

        if (!response.ok) {
          console.warn(`⚠️ Gateway ${i + 1} failed:`, response.status)
          lastError = new Error(`${response.status} ${response.statusText}`)
          continue // Try next gateway
        }

        const arrayBuffer = await response.arrayBuffer()

        console.log('✅ File downloaded from IPFS')
        console.log('📊 Downloaded size:', arrayBuffer.byteLength, 'bytes')
        console.log(`✅ Success using gateway ${i + 1}/${this.gateways.length}`)

        return {
          data: arrayBuffer,
          size: arrayBuffer.byteLength
        }
      } catch (error) {
        console.warn(`⚠️ Gateway ${i + 1} error:`, error)
        lastError = error instanceof Error ? error : new Error('Unknown error')
        // Continue to next gateway
      }
    }

    // All gateways failed
    console.error('❌ All IPFS gateways failed')
    console.error('💡 File might still be pinning. Try again in a moment.')
    throw new Error(`Failed to download from IPFS: ${lastError?.message || 'All gateways unavailable'}`)
  }

  /**
   * Get storage info
   */
  getStorageInfo() {
    return {
      gateways: this.gateways,
      provider: 'Pinata IPFS',
      authenticated: !!this.pinataJWT,
      type: 'ipfs' as const
    }
  }
}

// Export singleton instance
export const realIPFSStorage = new RealIPFSStorage()
