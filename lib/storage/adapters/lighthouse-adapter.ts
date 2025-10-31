import {
  IPFSAdapter,
  IPFSUploadResult,
  IPFSDownloadResult,
  IPFSUploadError,
  IPFSDownloadError,
  IPFSTimeoutError,
} from './ipfs-adapter.interface'

/**
 * Lighthouse.storage IPFS Adapter
 * Docs: https://docs.lighthouse.storage/
 * Max file size: 24GB per request
 */
export class LighthouseAdapter implements IPFSAdapter {
  readonly name = 'Lighthouse'
  readonly maxFileSize = 24 * 1024 * 1024 * 1024 // 24GB
  private readonly apiKey: string | undefined
  private readonly uploadEndpoint = 'https://node.lighthouse.storage/api/v0/add'
  private readonly gateways = [
    'https://gateway.lighthouse.storage/ipfs',
    'https://ipfs.io/ipfs',
    'https://cloudflare-ipfs.com/ipfs',
  ]
  private readonly timeout = 30000 // 30 seconds

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY
    
    if (this.isConfigured) {
      console.log('✅ Lighthouse adapter initialized')
    } else {
      console.warn('⚠️ Lighthouse adapter not configured (missing API key)')
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
      freeStorage: '100GB (perpetual)',
    }
  }

  async isHealthy(): Promise<boolean> {
    if (!this.isConfigured) return false
    
    try {
      // Try to access Lighthouse gateway
      const response = await fetch('https://gateway.lighthouse.storage/ipfs/QmNLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh51', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Upload file to Lighthouse via API route (CORS bypass)
   */
  async upload(file: File | Blob, filename: string): Promise<IPFSUploadResult> {
    console.log(`📤 [${this.name}] Uploading: ${filename} (${file.size} bytes)`)

    try {
      // Use API route to bypass CORS
      console.log(`📤 [${this.name}] Uploading via API route...`)
      
      const formData = new FormData()
      formData.append('file', file instanceof File ? file : new File([file], filename))

      const response = await fetch('/api/upload/lighthouse', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success || !result.cid) {
        throw new Error('No CID returned from Lighthouse')
      }

      console.log(`✅ [${this.name}] Upload successful, CID: ${result.cid}`)

      return {
        cid: result.cid,
        url: `${this.gateways[0]}/${result.cid}`,
        size: result.size || 0,
        provider: this.name,
      }
    } catch (error) {
      console.error(`❌ [${this.name}] Upload failed:`, error)
      throw new IPFSUploadError(this.name, (error as Error).message, error as Error)
    }
  }

  /**
   * Download file from Lighthouse gateways
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
      throw new IPFSDownloadError(this.name, 'Download failed', error as Error)
    }
  }
}
