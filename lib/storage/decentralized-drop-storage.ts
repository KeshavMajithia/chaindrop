/**
 * Decentralized Drop Storage
 * Stores drop metadata on blockchain and file data on Walrus
 */

export interface DecentralizedDropData {
  dropId: string
  fileName: string
  fileSize: number
  fileHash: string
  walrusBlobId: string
  encryptionKey: string
  createdAt: string
  expiresAt: string
  downloadCount: number
  maxDownloads: number
  isExpired: boolean
  txHash: string
  network: string
}

class DecentralizedDropManager {
  private drops: Map<string, DecentralizedDropData> = new Map()

  constructor() {
    console.log('🌐 Decentralized Drop Manager initialized')
    this.loadFromStorage()
  }

  /**
   * Load drops from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        console.log('🔍 Browser context info:')
        console.log('  - Origin:', window.location.origin)
        console.log('  - Protocol:', window.location.protocol)
        console.log('  - Host:', window.location.host)
        console.log('  - User Agent:', navigator.userAgent.substring(0, 50) + '...')
        
        const stored = localStorage.getItem('chaindrop-decentralized-drops')
        console.log('🔍 localStorage content:', stored ? 'Found data' : 'No data')
        console.log('🔍 localStorage length:', stored ? stored.length : 0)
        
        if (stored) {
          const drops = JSON.parse(stored)
          this.drops = new Map(Object.entries(drops))
          console.log('📂 Loaded decentralized drops from storage:', this.drops.size)
          console.log('📋 Loaded drop IDs:', Array.from(this.drops.keys()))
        } else {
          console.log('📭 No drops found in localStorage')
          console.log('🔍 All localStorage keys:', Object.keys(localStorage))
          
          // Try sessionStorage as fallback
          console.log('🔄 Trying sessionStorage as fallback...')
          const sessionStored = sessionStorage.getItem('chaindrop-decentralized-drops')
          if (sessionStored) {
            console.log('✅ Found data in sessionStorage')
            const drops = JSON.parse(sessionStored)
            this.drops = new Map(Object.entries(drops))
            console.log('📂 Loaded decentralized drops from sessionStorage:', this.drops.size)
            console.log('📋 Loaded drop IDs:', Array.from(this.drops.keys()))
          } else {
            console.log('📭 No drops found in sessionStorage either')
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to load decentralized drops from storage:', error)
      }
    } else {
      console.log('🌐 Not in browser environment, skipping localStorage load')
    }
  }

  /**
   * Save drops to localStorage and sessionStorage
   */
  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const dropsObject = Object.fromEntries(this.drops)
        const jsonData = JSON.stringify(dropsObject)
        
        // Save to both localStorage and sessionStorage for better persistence
        localStorage.setItem('chaindrop-decentralized-drops', jsonData)
        sessionStorage.setItem('chaindrop-decentralized-drops', jsonData)
        
        console.log('💾 Saved decentralized drops to storage (both localStorage and sessionStorage)')
        console.log('📊 Saved data length:', jsonData.length)
        console.log('🔍 localStorage after save:', localStorage.getItem('chaindrop-decentralized-drops') ? 'Found' : 'Not found')
        console.log('🔍 sessionStorage after save:', sessionStorage.getItem('chaindrop-decentralized-drops') ? 'Found' : 'Not found')
      } catch (error) {
        console.warn('⚠️ Failed to save decentralized drops to storage:', error)
      }
    } else {
      console.log('🌐 Not in browser environment, skipping localStorage save')
    }
  }

  /**
   * Store a new decentralized drop
   */
  async storeDrop(dropData: DecentralizedDropData): Promise<void> {
    this.drops.set(dropData.dropId, dropData)
    this.saveToStorage()
    console.log('✅ Decentralized drop stored:', dropData.dropId)
    console.log('📊 File stored on Walrus:', dropData.walrusBlobId)
    console.log('🔗 Metadata on blockchain:', dropData.txHash)
  }

  /**
   * Retrieve a drop by ID
   */
  getDrop(dropId: string): DecentralizedDropData | null {
    console.log('🔍 Looking for drop:', dropId)
    console.log('📊 Total drops in memory:', this.drops.size)
    console.log('📋 Available drop IDs:', Array.from(this.drops.keys()))
    
    const drop = this.drops.get(dropId)
    if (!drop) {
      console.log('❌ Decentralized drop not found:', dropId)
      console.log('💾 Checking localStorage...')
      
      // Try to reload from storage
      this.loadFromStorage()
      const reloadedDrop = this.drops.get(dropId)
      if (reloadedDrop) {
        console.log('✅ Drop found after reload from storage:', reloadedDrop.fileName)
        return reloadedDrop
      }
      
      return null
    }

    // Check if expired
    if (new Date() > new Date(drop.expiresAt)) {
      drop.isExpired = true
      this.drops.set(dropId, drop)
    }

    console.log('✅ Decentralized drop found:', drop.fileName)
    return drop
  }

  /**
   * Increment download count
   */
  incrementDownloadCount(dropId: string): void {
    const drop = this.drops.get(dropId)
    if (drop) {
      drop.downloadCount++
      this.drops.set(dropId, drop)
      this.saveToStorage()
      console.log('📥 Download count incremented for:', dropId)
    }
  }

  /**
   * Get all drops (for debugging)
   */
  getAllDrops(): DecentralizedDropData[] {
    return Array.from(this.drops.values())
  }
}

// Global instance - ensure it's truly singleton
let globalDropManager: DecentralizedDropManager | null = null

export function getDecentralizedDropManager(): DecentralizedDropManager {
  if (!globalDropManager) {
    globalDropManager = new DecentralizedDropManager()
  }
  return globalDropManager
}

// For backward compatibility
export const decentralizedDropManager = getDecentralizedDropManager()

/**
 * Create a decentralized drop with file stored on Walrus
 */
export async function createDecentralizedDrop(
  dropId: string,
  fileName: string,
  fileSize: number,
  file: File,
  txHash: string,
  network: string
): Promise<DecentralizedDropData> {
  console.log('🌐 Creating decentralized drop:', dropId)
  
  // Upload file to Walrus (decentralized storage)
  const { uploadToWalrus } = await import('./walrus')
  const walrusResult = await uploadToWalrus(file)
  
  console.log('✅ File uploaded to Walrus:', walrusResult.blobId)
  
  const dropData: DecentralizedDropData = {
    dropId,
    fileName,
    fileSize,
    fileHash: walrusResult.blobId, // Use Walrus blob ID as file hash
    walrusBlobId: walrusResult.blobId,
    encryptionKey: walrusResult.encryptionKey || '',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    downloadCount: 0,
    maxDownloads: -1, // Unlimited
    isExpired: false,
    txHash,
    network
  }

  const manager = getDecentralizedDropManager()
  await manager.storeDrop(dropData)
  return dropData
}

/**
 * Get decentralized drop by ID
 */
export function getDecentralizedDropById(dropId: string): DecentralizedDropData | null {
  const manager = getDecentralizedDropManager()
  return manager.getDrop(dropId)
}

/**
 * Download file from decentralized storage (Walrus)
 */
export async function downloadFileFromDecentralizedDrop(dropId: string): Promise<Blob | null> {
  const manager = getDecentralizedDropManager()
  const drop = manager.getDrop(dropId)
  if (!drop) {
    console.log('❌ Drop not found for download:', dropId)
    return null
  }

  try {
    console.log('🔄 Downloading file from Walrus:', drop.walrusBlobId)
    
    // Download from Walrus
    const { downloadFromWalrus } = await import('./walrus')
    const fileBlob = await downloadFromWalrus(drop.walrusBlobId, drop.encryptionKey)
    
    // Increment download count
    manager.incrementDownloadCount(dropId)
    
    console.log('✅ File downloaded from Walrus:', drop.fileName)
    return fileBlob
  } catch (error) {
    console.error('❌ Failed to download from Walrus:', error)
    return null
  }
}
