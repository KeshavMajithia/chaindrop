/**
 * IPFS Adapter Factory
 * Manages multiple IPFS storage providers and provides intelligent fallback
 */

import { IPFSAdapter, IPFSUploadResult, IPFSDownloadResult } from './ipfs-adapter.interface'
import { PinataAdapter } from './pinata-adapter'
import { FilebaseAdapter } from './filebase-adapter'
import { LighthouseAdapter } from './lighthouse-adapter'

export class IPFSAdapterFactory {
  private adapters: IPFSAdapter[]
  private primaryAdapter: IPFSAdapter | null = null

  constructor() {
    // Initialize all adapters
    this.adapters = [
      new PinataAdapter(),
      new FilebaseAdapter(),
      new LighthouseAdapter(),
    ]

    // Set primary adapter (first configured one)
    this.primaryAdapter = this.adapters.find(a => a.isConfigured) || null

    console.log('🏭 IPFS Adapter Factory initialized')
    console.log(`📊 Total adapters: ${this.adapters.length}`)
    console.log(`✅ Configured adapters: ${this.getConfiguredAdapters().length}`)
    console.log(`🎯 Primary adapter: ${this.primaryAdapter?.name || 'None'}`)
  }

  /**
   * Get all configured adapters
   */
  getConfiguredAdapters(): IPFSAdapter[] {
    return this.adapters.filter(a => a.isConfigured)
  }

  /**
   * Get all adapters (configured and unconfigured)
   */
  getAllAdapters(): IPFSAdapter[] {
    return this.adapters
  }

  /**
   * Get adapter by name
   */
  getAdapter(name: string): IPFSAdapter | undefined {
    return this.adapters.find(a => a.name.toLowerCase() === name.toLowerCase())
  }

  /**
   * Get primary adapter
   */
  getPrimaryAdapter(): IPFSAdapter | null {
    return this.primaryAdapter
  }

  /**
   * Upload file with automatic fallback
   * Tries primary adapter first, then falls back to other configured adapters
   */
  async upload(
    blob: Blob | ArrayBuffer,
    filename?: string,
    onProgress?: (progress: number) => void
  ): Promise<IPFSUploadResult> {
    const configuredAdapters = this.getConfiguredAdapters()

    if (configuredAdapters.length === 0) {
      throw new Error('No IPFS adapters configured. Please add API keys to .env.local')
    }

    console.log(`🚀 Starting upload with ${configuredAdapters.length} available adapter(s)`)

    let lastError: Error | null = null

    // Try each configured adapter
    for (let i = 0; i < configuredAdapters.length; i++) {
      const adapter = configuredAdapters[i]
      try {
        console.log(`🔄 Attempt ${i + 1}/${configuredAdapters.length}: Using ${adapter.name}`)
        
        const result = await adapter.upload(blob, filename, onProgress)
        
        console.log(`✅ Upload successful via ${adapter.name}`)
        return result
      } catch (error) {
        lastError = error as Error
        console.warn(`⚠️ ${adapter.name} upload failed:`, error)
        
        // Continue to next adapter
        if (i < configuredAdapters.length - 1) {
          console.log(`🔄 Trying next adapter...`)
        }
      }
    }

    // All adapters failed
    throw new Error(
      `All ${configuredAdapters.length} IPFS adapter(s) failed. Last error: ${lastError?.message}`
    )
  }

  /**
   * Download file with automatic fallback across all adapters
   */
  async download(cid: string): Promise<IPFSDownloadResult> {
    const configuredAdapters = this.getConfiguredAdapters()

    if (configuredAdapters.length === 0) {
      // Even without configured adapters, we can try downloading from public gateways
      console.log('⚠️ No adapters configured, using public gateways only')
    }

    console.log(`📥 Starting download from ${configuredAdapters.length || 'public'} gateway(s)`)

    let lastError: Error | null = null

    // Try each adapter's download method (which tries multiple gateways)
    for (let i = 0; i < this.adapters.length; i++) {
      const adapter = this.adapters[i]
      try {
        console.log(`🔄 Attempt ${i + 1}/${this.adapters.length}: Using ${adapter.name} gateways`)
        
        const result = await adapter.download(cid)
        
        console.log(`✅ Download successful via ${adapter.name}`)
        return result
      } catch (error) {
        lastError = error as Error
        console.warn(`⚠️ ${adapter.name} download failed:`, error)
      }
    }

    // All adapters failed
    throw new Error(
      `All IPFS gateways failed to download CID: ${cid}. Last error: ${lastError?.message}`
    )
  }

  /**
   * Check health of all adapters
   */
  async checkHealth(): Promise<Map<string, boolean>> {
    const healthMap = new Map<string, boolean>()

    console.log('🏥 Checking health of all adapters...')

    await Promise.all(
      this.adapters.map(async (adapter) => {
        try {
          const isHealthy = await adapter.isHealthy()
          healthMap.set(adapter.name, isHealthy)
          console.log(`${isHealthy ? '✅' : '❌'} ${adapter.name}: ${isHealthy ? 'Healthy' : 'Unhealthy'}`)
        } catch (error) {
          healthMap.set(adapter.name, false)
          console.log(`❌ ${adapter.name}: Error - ${error}`)
        }
      })
    )

    return healthMap
  }

  /**
   * Get status of all adapters
   */
  getStatus() {
    return this.adapters.map(adapter => ({
      ...adapter.getInfo(),
      isHealthy: null, // Call checkHealth() to get real-time status
    }))
  }
}

// Export singleton instance
export const ipfsAdapterFactory = new IPFSAdapterFactory()
