/**
 * Transfer Link Generator and Encryption Key Handler
 * Manages secure transfer links with encryption keys
 */

/**
 * Generate a shareable transfer link with encryption key
 * @param transferId - Unique transfer ID
 * @param encryptionKey - Base64 encoded encryption key
 * @param baseUrl - Base URL of your application (e.g., window.location.origin)
 * @returns Complete shareable link
 */
export function generateTransferLink(
  transferId: string,
  encryptionKey: string,
  baseUrl: string = typeof window !== 'undefined' ? window.location.origin : ''
): string {
  // Use URL hash for encryption key (not sent to server)
  const url = new URL(`${baseUrl}/receive/${transferId}`)
  url.hash = encryptionKey // Key in hash fragment for security

  return url.toString()
}

/**
 * Parse transfer link to extract transfer ID and encryption key
 * @param url - Transfer link URL (can be full URL or just the current page URL)
 * @returns Object containing transferId and encryptionKey
 */
export function parseTransferLink(url?: string): {
  transferId: string | null
  encryptionKey: string | null
} {
  try {
    const urlObj = url ? new URL(url) : (typeof window !== 'undefined' ? new URL(window.location.href) : null)

    if (!urlObj) {
      return { transferId: null, encryptionKey: null }
    }

    // Extract transfer ID from path (e.g., /receive/transferId)
    const pathParts = urlObj.pathname.split('/')
    const transferId = pathParts[pathParts.length - 1] || null

    // Extract encryption key from hash (e.g., #encryptionKey)
    const encryptionKey = urlObj.hash.substring(1) || null // Remove # prefix

    return {
      transferId,
      encryptionKey
    }
  } catch (error) {
    console.error('Failed to parse transfer link:', error)
    return {
      transferId: null,
      encryptionKey: null
    }
  }
}

/**
 * Store encryption key in session storage (for page refreshes)
 * @param transferId - Transfer ID
 * @param encryptionKey - Encryption key to store
 */
export function storeEncryptionKey(transferId: string, encryptionKey: string): void {
  const storageKey = `transfer_key_${transferId}`
  sessionStorage.setItem(storageKey, encryptionKey)
}

/**
 * Retrieve encryption key from session storage
 * @param transferId - Transfer ID
 * @returns Encryption key or null
 */
export function retrieveEncryptionKey(transferId: string): string | null {
  const storageKey = `transfer_key_${transferId}`
  return sessionStorage.getItem(storageKey)
}

/**
 * Clear encryption key from session storage
 * @param transferId - Transfer ID
 */
export function clearEncryptionKey(transferId: string): void {
  const storageKey = `transfer_key_${transferId}`
  sessionStorage.removeItem(storageKey)
}

/**
 * Copy transfer link to clipboard
 * @param link - Transfer link to copy
 * @returns Promise that resolves when copied
 */
export async function copyTransferLink(link: string): Promise<void> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(link)
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = link
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  } catch (error) {
    console.error('Failed to copy link to clipboard:', error)
    throw error
  }
}

/**
 * Validate encryption key format
 * @param key - Key to validate
 * @returns True if valid Base64 key
 */
export function isValidEncryptionKey(key: string | null): boolean {
  if (!key) return false

  try {
    // Check if it's valid base64
    const decoded = atob(key)
    // Should be 32 bytes (256 bits) for AES-256
    return decoded.length === 32
  } catch (error) {
    return false
  }
}

/**
 * Generate encryption key synchronously from crypto
 * This allows us to generate the key BEFORE starting the transfer
 * @returns Base64 encoded encryption key
 */
export function generateEncryptionKeySync(): string {
  // Generate 256-bit (32 bytes) random key
  const keyBuffer = new Uint8Array(32)
  crypto.getRandomValues(keyBuffer)

  // Convert to base64
  return arrayBufferToBase64(keyBuffer.buffer)
}

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
