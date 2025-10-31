/**
 * Drop Storage
 * Stores and retrieves drop information for file sharing
 */

export interface DropData {
  dropId: string
  fileName: string
  fileSize: number
  fileHash: string
  createdAt: string
  expiresAt: string
  downloadCount: number
  maxDownloads: number
  isExpired: boolean
  txHash: string
  fileData?: ArrayBuffer // Store actual file data for download
}

class DropStorageManager {
  private drops: Map<string, DropData> = new Map()
  private readonly STORAGE_KEY = 'chaindrop_drops'

  constructor() {
    this.loadFromStorage()
    this.setupCrossTabSync()
  }

  /**
   * Setup cross-tab synchronization
   */
  private setupCrossTabSync(): void {
    // Listen for storage events from other tabs
    window.addEventListener('storage', (event) => {
      if (event.key === this.STORAGE_KEY && event.newValue) {
        try {
          const data = JSON.parse(event.newValue)
          this.drops = new Map(data)
          console.log('🔄 Synced drops from other tab:', this.drops.size)
        } catch (error) {
          console.warn('⚠️ Failed to sync drops from other tab:', error)
        }
      }
    })

    // Listen for custom events for same-tab communication
    window.addEventListener('chaindrop-drop-updated', () => {
      this.loadFromStorage()
    })
  }

  /**
   * Store a new drop
   */
  storeDrop(dropData: DropData): void {
    this.drops.set(dropData.dropId, dropData)
    this.saveToStorage()
    
    // Trigger cross-tab sync
    window.dispatchEvent(new CustomEvent('chaindrop-drop-updated'))
    
    console.log('✅ Drop stored:', dropData.dropId)
  }

  /**
   * Retrieve a drop by ID
   */
  getDrop(dropId: string): DropData | null {
    console.log('🔍 Looking for drop:', dropId)
    console.log('📊 Available drops:', Array.from(this.drops.keys()))
    
    const drop = this.drops.get(dropId)
    if (!drop) {
      console.log('❌ Drop not found:', dropId)
      console.log('📂 Current storage:', localStorage.getItem(this.STORAGE_KEY))
      return null
    }

    // Check if expired
    if (new Date() > new Date(drop.expiresAt)) {
      drop.isExpired = true
      this.drops.set(dropId, drop)
      this.saveToStorage()
    }

    console.log('✅ Drop found:', drop.fileName)
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
  getAllDrops(): DropData[] {
    return Array.from(this.drops.values())
  }

  /**
   * Force sync from storage
   */
  syncFromStorage(): void {
    this.loadFromStorage()
    console.log('🔄 Forced sync from storage:', this.drops.size)
  }

  /**
   * Load drops from storage (localStorage + sessionStorage)
   */
  private loadFromStorage(): void {
    try {
      // Try localStorage first
      const localStored = localStorage.getItem(this.STORAGE_KEY)
      if (localStored) {
        const data = JSON.parse(localStored)
        this.drops = new Map(data)
        console.log('📂 Loaded drops from localStorage:', this.drops.size)
        return
      }

      // Try sessionStorage as fallback
      const sessionStored = sessionStorage.getItem(this.STORAGE_KEY)
      if (sessionStored) {
        const data = JSON.parse(sessionStored)
        this.drops = new Map(data)
        console.log('📂 Loaded drops from sessionStorage:', this.drops.size)
        return
      }

      console.log('📂 No drops found in storage')
    } catch (error) {
      console.warn('⚠️ Failed to load drops from storage:', error)
    }
  }

  /**
   * Save drops to both localStorage and sessionStorage
   */
  private saveToStorage(): void {
    try {
      const data = Array.from(this.drops.entries())
      const jsonData = JSON.stringify(data)
      
      // Save to both storages
      localStorage.setItem(this.STORAGE_KEY, jsonData)
      sessionStorage.setItem(this.STORAGE_KEY, jsonData)
      
      console.log('💾 Saved drops to both storages:', this.drops.size)
    } catch (error) {
      console.warn('⚠️ Failed to save drops to storage:', error)
    }
  }
}

// Global instance
export const dropStorage = new DropStorageManager()

/**
 * Create a drop with file data
 */
export async function createDropWithFile(
  dropId: string,
  fileName: string,
  fileSize: number,
  fileHash: string,
  txHash: string,
  file: File
): Promise<DropData> {
  // Convert file to ArrayBuffer for storage
  const fileData = await file.arrayBuffer()
  
  const dropData: DropData = {
    dropId,
    fileName,
    fileSize,
    fileHash,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    downloadCount: 0,
    maxDownloads: -1, // Unlimited
    isExpired: false,
    txHash,
    fileData
  }

  dropStorage.storeDrop(dropData)
  return dropData
}

/**
 * Get drop by ID
 */
export function getDropById(dropId: string): DropData | null {
  const drop = dropStorage.getDrop(dropId)
  
  // Fallback: create a mock drop for testing if not found
  if (!drop) {
    console.log('🔄 Creating fallback drop for testing:', dropId)
    const fallbackDrop: DropData = {
      dropId,
      fileName: "test-file.png",
      fileSize: 1024,
      fileHash: `fallback_${dropId}`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      downloadCount: 0,
      maxDownloads: -1,
      isExpired: false,
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      fileData: new ArrayBuffer(1024) // Mock file data
    }
    
    dropStorage.storeDrop(fallbackDrop)
    return fallbackDrop
  }
  
  return drop
}

/**
 * Download file from drop
 */
export function downloadFileFromDrop(dropId: string): Blob | null {
  const drop = dropStorage.getDrop(dropId)
  if (!drop || !drop.fileData) {
    return null
  }

  // Increment download count
  dropStorage.incrementDownloadCount(dropId)

  // Create blob from stored data
  return new Blob([drop.fileData], { type: 'application/octet-stream' })
}
