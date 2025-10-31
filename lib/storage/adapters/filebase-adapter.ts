/**
 * Filebase IPFS Adapter
 * S3-compatible IPFS storage with 5GB free tier
 * Uses AWS SDK for S3-compatible operations
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

export class FilebaseAdapter implements IPFSAdapter {
  readonly name = 'Filebase'
  readonly maxFileSize = 5 * 1024 * 1024 * 1024 // 5GB
  private readonly apiKey: string | undefined
  private readonly maxRetries = 3
  private readonly timeout = 30000 // 30 seconds
  private readonly gateways = [
    'https://ipfs.filebase.io/ipfs',
    'https://ipfs.io/ipfs',
    'https://cloudflare-ipfs.com/ipfs',
  ]

  constructor() {
    // Now using IPFS RPC API key instead of S3 credentials
    this.apiKey = process.env.NEXT_PUBLIC_FILEBASE_KEY
    
    if (this.isConfigured) {
      console.log('✅ Filebase adapter initialized')
    } else {
      console.warn('⚠️ Filebase adapter not configured (missing IPFS RPC API key)')
    }
  }

  get isConfigured(): boolean {
    return !!this.apiKey
  }

  getInfo() {
    return {
      name: this.name,
      isConfigured: this.isConfigured,
      maxFileSize: this.maxFileSize,
      freeStorage: '5GB',
    }
  }

  /**
   * Upload file to Filebase IPFS (S3-compatible)
   */
  async upload(
    blob: Blob | ArrayBuffer,
    filename?: string,
    onProgress?: (progress: number) => void
  ): Promise<IPFSUploadResult> {
    if (!this.isConfigured) {
      throw new IPFSConfigurationError(
        this.name,
        'Filebase IPFS RPC API key not configured. Add NEXT_PUBLIC_FILEBASE_KEY to .env.local'
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
   * Actual S3-compatible upload to Filebase via server-side API route
   */
  private async performUpload(
    blob: Blob,
    filename: string,
    onProgress?: (progress: number) => void
  ): Promise<IPFSUploadResult> {
    try {
      onProgress?.(10)

      console.log('📤 [Filebase] Uploading via API route...')

      // Use server-side API route to avoid CORS issues
      const formData = new FormData()
      formData.append('file', blob, filename)
      formData.append('filename', filename)

      const response = await fetch('/api/upload/filebase', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
        console.error('❌ [Filebase] Server error:', errorData)
        throw new IPFSUploadError(
          `Upload failed: ${errorData.error || response.statusText}${errorData.details ? `\nDetails: ${errorData.details}` : ''}`, 
          'filebase'
        )
      }

      const result = await response.json()

      if (onProgress) {
        onProgress(100)
      }

      return {
        cid: result.cid,
        url: result.url,
        size: result.size,
        provider: this.name,
      }
    } catch (error) {
      if (error instanceof IPFSUploadError) {
        throw error
      }
      throw new IPFSUploadError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'filebase')
    }
  }

  /**
   * Generate a mock CID from file content (fallback)
   */
  private generateMockCID(data: Uint8Array): string {
    // Simple hash-based CID generation for fallback
    let hash = 0
    for (let i = 0; i < Math.min(data.length, 1000); i++) {
      hash = ((hash << 5) - hash) + data[i]
      hash = hash & hash
    }
    return `Qm${Math.abs(hash).toString(36).padStart(44, '0')}`
  }

  /**
   * Download file from IPFS using Filebase gateways
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
   * Health check - verify Filebase S3 endpoint is accessible
   */
  async isHealthy(): Promise<boolean> {
    if (!this.isConfigured) {
      return false
    }

    try {
      // Simple HEAD request to check IPFS RPC endpoint
      const response = await fetch('https://rpc.filebase.io', {
        method: 'HEAD',
      })

      return response.status < 500 // Accept any non-server-error response
    } catch (error) {
      console.error(`❌ [${this.name}] Health check failed:`, error)
      return false
    }
  }
}
