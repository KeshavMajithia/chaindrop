/**
 * Apillon IPFS Adapter
 * Crust Network powered IPFS storage
 * Free tier with decentralized storage
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

export class ApillonAdapter implements IPFSAdapter {
  readonly name = 'Apillon'
  readonly maxFileSize = 100 * 1024 * 1024 // 100MB per file
  private readonly apiKey: string | undefined
  private readonly maxRetries = 3
  private readonly timeout = 30000 // 30 seconds
  private readonly apiEndpoint = 'https://api.apillon.io'
  private readonly gateways = [
    'https://ipfs.apillon.io/ipfs',
    'https://crustipfs.xyz/ipfs',
    'https://ipfs.io/ipfs',
  ]

  constructor() {
    // API key not needed on client-side - we use server-side API route
    this.apiKey = undefined
    console.log('✅ Apillon adapter initialized')
  }

  get isConfigured(): boolean {
    // Always return true since we use server-side API route
    return true
  }

  getInfo() {
    return {
      name: this.name,
      isConfigured: this.isConfigured,
      maxFileSize: this.maxFileSize,
      freeStorage: 'Free (Crust Network)',
    }
  }

  /**
   * Upload file to Apillon/Crust Network IPFS
   */
  async upload(
    blob: Blob | ArrayBuffer,
    filename?: string,
    onProgress?: (progress: number) => void
  ): Promise<IPFSUploadResult> {
    if (!this.isConfigured) {
      throw new IPFSConfigurationError(
        this.name,
        'Apillon API key not configured. Add NEXT_PUBLIC_APILLON_API_KEY to .env.local'
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
   * Actual upload to Apillon Storage API via server-side route
   */
  private async performUpload(
    blob: Blob,
    filename: string,
    onProgress?: (progress: number) => void
  ): Promise<IPFSUploadResult> {
    try {
      onProgress?.(10)

      console.log('📤 [Apillon] Uploading via API route...')

      // Use server-side API route to avoid CORS issues
      const formData = new FormData()
      formData.append('file', blob, filename)
      formData.append('filename', filename)

      const response = await fetch('/api/upload/apillon', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
        throw new IPFSUploadError(`Upload failed: ${errorData.error || response.statusText}`, 'apillon')
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
      throw new IPFSUploadError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'apillon')
    }
  }

  /* OLD IMPLEMENTATION (commented out for reference):
  private async performUploadDirect(
    blob: Blob,
    filename: string,
    onProgress?: (progress: number) => void
  ): Promise<IPFSUploadResult> {
    try {
      onProgress?.(10)

      // Step 1: Request upload session
      const sessionResponse = await fetch(`${this.apiEndpoint}/storage/buckets/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: [{
            fileName: filename,
            contentType: blob.type || 'application/octet-stream',
          }]
        }),
      })

      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text()
        throw new Error(`Session creation failed: ${sessionResponse.status} - ${errorText}`)
      }

      const sessionData = await sessionResponse.json()
      const uploadUrl = sessionData.data?.files?.[0]?.url
      const sessionToken = sessionData.data?.sessionToken

      if (!uploadUrl || !sessionToken) {
        throw new Error('Invalid upload session response')
      }

      onProgress?.(30)

      // Step 2: Upload file to presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': blob.type || 'application/octet-stream',
        },
        body: blob,
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        throw new Error(`File upload failed: ${uploadResponse.status} - ${errorText}`)
      }

      onProgress?.(70)

      // Step 3: Finalize upload and get CID
      const finalizeResponse = await fetch(`${this.apiEndpoint}/storage/buckets/upload/${sessionToken}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!finalizeResponse.ok) {
        const errorText = await finalizeResponse.text()
        throw new Error(`Finalization failed: ${finalizeResponse.status} - ${errorText}`)
      }

      const finalizeData = await finalizeResponse.json()
      const cid = finalizeData.data?.files?.[0]?.CID

      if (!cid) {
        throw new Error('No CID returned from Apillon')
      }

      onProgress?.(100)

      console.log(`📋 [${this.name}] CID: ${cid}`)

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
   * Download file from IPFS using Apillon/Crust gateways
   */
  async download(cid: string): Promise<IPFSDownloadResult> {
    console.log(`📥 [${this.name}] Downloading CID: ${cid}`)

    // Check if CID is still pending (Apillon processing not complete)
    if (cid === 'pending' || !cid || cid === 'null') {
      console.warn(`⚠️ [${this.name}] CID is still pending - Apillon is processing the file`)
      throw new IPFSDownloadError(
        this.name,
        'File is still being processed by Apillon (this can take 1-5 minutes)',
        new Error('CID_PENDING')
      )
    }

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
   * Health check - verify Apillon API is accessible
   */
  async isHealthy(): Promise<boolean> {
    if (!this.isConfigured) {
      return false
    }

    try {
      // Simple health check - verify API is reachable
      const response = await fetch(`${this.apiEndpoint}/storage/buckets`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      return response.ok
    } catch (error) {
      console.error(`❌ [${this.name}] Health check failed:`, error)
      return false
    }
  }
}
