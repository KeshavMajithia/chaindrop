/**
 * Secure key generation using Web Crypto API
 */

/**
 * Generate a secure random encryption key
 * @returns Base64 encoded encryption key
 */
export async function generateEncryptionKey(): Promise<string> {
  // Generate 256-bit (32 bytes) random key using Web Crypto API
  const keyBuffer = new Uint8Array(32)
  crypto.getRandomValues(keyBuffer)
  
  // Convert to base64 for easy transmission in URL
  return arrayBufferToBase64(keyBuffer.buffer)
}

/**
 * Generate a secure random IV (Initialization Vector)
 * @returns Base64 encoded IV
 */
export function generateIV(): string {
  // Generate 128-bit (16 bytes) random IV
  const ivBuffer = new Uint8Array(16)
  crypto.getRandomValues(ivBuffer)
  
  return arrayBufferToBase64(ivBuffer.buffer)
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

/**
 * Convert Base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Derive a CryptoKey from base64 string for Web Crypto API
 */
export async function importKey(base64Key: string): Promise<CryptoKey> {
  const keyBuffer = base64ToArrayBuffer(base64Key)
  
  return await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}
