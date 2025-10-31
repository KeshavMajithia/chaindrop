/**
 * Local Drop Storage
 * Temporary storage for drop metadata while using mock implementations
 * This will be replaced with actual blockchain queries in production
 */

export interface LocalDropData {
  dropId: string
  fileName: string
  fileSize: number
  walrusBlobId: string
  encryptionKey: string
  encryptionIV: string
  createdAt: string
  expiresAt: string
  downloadCount: number
  maxDownloads: number
  isExpired: boolean
  txHash: string
  network: string
  encryptedFileData?: string // Base64 encoded encrypted file
}

const STORAGE_KEY_PREFIX = 'chaindrop_drop_'

/**
 * Store drop metadata locally
 */
export function storeDropLocally(dropData: LocalDropData): void {
  try {
    if (typeof window === 'undefined') return
    
    const key = `${STORAGE_KEY_PREFIX}${dropData.dropId}`
    localStorage.setItem(key, JSON.stringify(dropData))
    console.log('💾 Drop stored locally:', dropData.dropId)
  } catch (error) {
    console.error('❌ Failed to store drop locally:', error)
  }
}

/**
 * Retrieve drop metadata from local storage
 */
export function getDropLocally(dropId: string): LocalDropData | null {
  try {
    if (typeof window === 'undefined') return null
    
    const key = `${STORAGE_KEY_PREFIX}${dropId}`
    const data = localStorage.getItem(key)
    
    if (!data) {
      console.log('❌ Drop not found in local storage:', dropId)
      return null
    }
    
    const dropData = JSON.parse(data) as LocalDropData
    
    // Check if expired
    if (new Date() > new Date(dropData.expiresAt)) {
      console.log('⏰ Drop expired:', dropId)
      dropData.isExpired = true
    }
    
    console.log('✅ Drop retrieved from local storage:', dropId)
    return dropData
  } catch (error) {
    console.error('❌ Failed to retrieve drop from local storage:', error)
    return null
  }
}

/**
 * Delete drop from local storage
 */
export function deleteDropLocally(dropId: string): void {
  try {
    if (typeof window === 'undefined') return
    
    const key = `${STORAGE_KEY_PREFIX}${dropId}`
    localStorage.removeItem(key)
    console.log('🗑️ Drop deleted from local storage:', dropId)
  } catch (error) {
    console.error('❌ Failed to delete drop from local storage:', error)
  }
}

/**
 * List all drops in local storage
 */
export function listDropsLocally(): LocalDropData[] {
  try {
    if (typeof window === 'undefined') return []
    
    const drops: LocalDropData[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        const data = localStorage.getItem(key)
        if (data) {
          const dropData = JSON.parse(data) as LocalDropData
          drops.push(dropData)
        }
      }
    }
    
    return drops
  } catch (error) {
    console.error('❌ Failed to list drops from local storage:', error)
    return []
  }
}

/**
 * Increment download count
 */
export function incrementDownloadCount(dropId: string): void {
  try {
    const dropData = getDropLocally(dropId)
    if (dropData) {
      dropData.downloadCount++
      storeDropLocally(dropData)
      console.log('📊 Download count incremented:', dropData.downloadCount)
    }
  } catch (error) {
    console.error('❌ Failed to increment download count:', error)
  }
}

/**
 * Check if drop has reached download limit
 */
export function hasReachedDownloadLimit(dropId: string): boolean {
  try {
    const dropData = getDropLocally(dropId)
    if (!dropData) return true
    
    if (dropData.maxDownloads === -1) return false // Unlimited
    
    return dropData.downloadCount >= dropData.maxDownloads
  } catch (error) {
    console.error('❌ Failed to check download limit:', error)
    return true
  }
}
