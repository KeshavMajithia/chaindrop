/**
 * Pinata IPFS Adapter
 * Wraps existing Pinata integration with standardized interface
 * Free tier: 1GB storage, unlimited gateways
 */

import {
  IPFSAdapter,
  IPFSUploadResult,
  IPFSDownloadResult,
  IPFSUploadError,
  IPFSDownloadError,
  IPFSConfigurationError,
  IPFSTimeoutError,
} from './ipfs-adapter.interface'

export class PinataAdapter implements IPFSAdapter {
  readonly name = 'Pinata'
  readonly maxFileSize = 1024 * 1024 * 1024 // 1GB
  private readonly jwt: string | undefined
  private readonly maxRetries = 3
  private readonly timeout = 30000 // 30 seconds
  private readonly gateways = [
    'https://gateway.pinata.cloud/ipfs',
    'https://ipfs.io/ipfs',
    'https://cloudflare-ipfs.com/ipfs',
    'https://dweb.link/ipfs',
  ]

  constructor() {
    this.jwt = process.env.NEXT_PUBLIC_PINATA_JWT
    
    if (this.isConfigured) {
      console.log('✅ Pinata adapter initialized')
    } else {
      console.warn('⚠️ Pinata adapter not configured (missing JWT)')
    }
  }

  get isConfigured(): boolean {
    return !!this.jwt
  }

  getInfo() {
    return {
      name: this.name,
      isConfigured: this.isConfigured,
      maxFileSize: this.maxFileSize,
      freeStorage: '1GB',
    }
  }

  /**
   * Upload file to Pinata IPFS
   */
  async upload(
    blob: Blob | ArrayBuffer,
    filename?: string,
    onProgress?: (progress: number) => void
  ): Promise<IPFSUploadResult> {
    if (!this.isConfigured) {
      throw new IPFSConfigurationError(
        this.name,
        'Pinata JWT not configured. Add NEXT_PUBLIC_PINATA_JWT to .env.local'
      )
    }

    const fileBlob = blob instanceof ArrayBuffer ? new Blob([blob]) : blob
    
    if (fileBlob.size > this.maxFileSize) {
      throw new IPFSUploadError(
        this.name,
        `File size ${fileBlob.size} exceeds maximum ${this.maxFileSize} bytes`
      )
    }

    console.log(`📤 [${this.name}] Uploading file (${fileBlob.size} bytes)...`)

    // Retry logic
    let lastError: Error | null = null
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.uploadWithTimeout(fileBlob, filename || 'file', onProgress)
        console.log(`✅ [${this.name}] Upload successful (attempt ${attempt}/${this.maxRetries})`)
        return result
      } catch (error) {
        lastError = error as Error
        console.warn(`⚠️ [${this.name}] Upload attempt ${attempt}/${this.maxRetries} failed:`, error)
        
        if (attempt < this.maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000
          console.log(`⏳ [${this.name}] Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw new IPFSUploadError(
      this.name,
      `Failed after ${this.maxRetries} attempts`,
      lastError!
    )
  }

  /**
   * Upload with timeout protection
   */
  private async uploadWithTimeout(
    blob: Blob,
    filename: string,
    onProgress?: (progress: number) => void
  ): Promise<IPFSUploadResult> {
    return Promise.race([
      this.performUpload(blob, filename, onProgress),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new IPFSTimeoutError(this.name, this.timeout)), this.timeout)
      ),
    ])
  }

  /**
   * Actual upload implementation
   */
  private async performUpload(
    blob: Blob,
    filename: string,
    onProgress?: (progress: number) => void
  ): Promise<IPFSUploadResult> {
    try {
      const formData = new FormData()
      formData.append('file', blob, filename)

      onProgress?.(10) // Starting upload

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.jwt}`,
        },
        body: formData,
      })

      onProgress?.(80) // Upload complete, processing

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      const cid = result.IpfsHash

      if (!cid) {
        throw new Error('No CID returned from Pinata')
      }

      onProgress?.(100) // Complete

      return {
        cid,
        url: `${this.gateways[0]}/${cid}`,
        size: blob.size,
        provider: this.name,
      }
    } catch (error) {
      throw new IPFSUploadError(
        this.name,
        error instanceof Error ? error.message : 'Unknown error',
        error as Error
      )
    }
  }

  /**
   * Download file from IPFS using multiple gateways
   */
  async download(cid: string): Promise<IPFSDownloadResult> {
    console.log(`📥 [${this.name}] Downloading CID: ${cid}`)

    let lastError: Error | null = null

    // Try each gateway
    for (let i = 0; i < this.gateways.length; i++) {
      const gateway = this.gateways[i]
      try {
        console.log(`🔄 [${this.name}] Trying gateway ${i + 1}/${this.gateways.length}: ${gateway}`)
        
        const result = await this.downloadFromGateway(gateway, cid)
        console.log(`✅ [${this.name}] Download successful from gateway ${i + 1}`)
        return result
      } catch (error) {
        lastError = error as Error
        console.warn(`⚠️ [${this.name}] Gateway ${i + 1} failed:`, error)
      }
    }

    throw new IPFSDownloadError(
      this.name,
      `All ${this.gateways.length} gateways failed`,
      lastError!
    )
  }

  /**
   * Download from specific gateway with timeout
   */
  private async downloadFromGateway(gateway: string, cid: string): Promise<IPFSDownloadResult> {
    return Promise.race([
      this.performDownload(gateway, cid),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new IPFSTimeoutError(this.name, this.timeout)), this.timeout)
      ),
    ])
  }

  /**
   * Actual download implementation
   */
  private async performDownload(gateway: string, cid: string): Promise<IPFSDownloadResult> {
    try {
      const url = `${gateway}/${cid}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const blob = await response.blob()

      return {
        data: blob,
        size: blob.size,
        cid,
      }
    } catch (error) {
      throw new IPFSDownloadError(
        this.name,
        error instanceof Error ? error.message : 'Unknown error',
        error as Error
      )
    }
  }

  /**
   * Health check - verify Pinata API is accessible
   */
  async isHealthy(): Promise<boolean> {
    if (!this.isConfigured) {
      return false
    }

    try {
      // Simple health check - verify API is reachable
      const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.jwt}`,
        },
      })

      return response.ok
    } catch (error) {
      console.error(`❌ [${this.name}] Health check failed:`, error)
      return false
    }
  }
}
