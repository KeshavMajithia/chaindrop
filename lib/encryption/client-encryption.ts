/**
 * Client-Side File Encryption
 * Uses Web Crypto API for secure file encryption/decryption
 */

export interface EncryptionResult {
  data: ArrayBuffer
  key: string // Base64 encoded key
  iv: string // Base64 encoded IV
}

export interface DecryptionResult {
  data: ArrayBuffer
}

/**
 * Generate a random encryption key
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt file data using Web Crypto API
 * @param fileData - File data to encrypt
 * @param key - Encryption key (optional, will generate if not provided)
 * @returns Encrypted data and key
 */
export async function encryptFile(
  fileData: ArrayBuffer,
  key?: CryptoKey
): Promise<EncryptionResult> {
  try {
    console.log('🔐 Starting client-side file encryption...')
    console.log('📊 Original file size:', fileData.byteLength, 'bytes')

    // Generate key if not provided
    const encryptionKey = key || await generateEncryptionKey()
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    // Encrypt the file
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      encryptionKey,
      fileData
    )

    // Export key for storage
    const exportedKey = await crypto.subtle.exportKey('raw', encryptionKey)
    const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedKey)))
    const ivBase64 = btoa(String.fromCharCode(...new Uint8Array(iv)))

    console.log('✅ File encrypted successfully')
    console.log('📊 Encrypted size:', encryptedData.byteLength, 'bytes')
    console.log('🔑 Key generated:', keyBase64.substring(0, 20) + '...')

    return {
      data: encryptedData,
      key: keyBase64,
      iv: ivBase64
    }
  } catch (error) {
    console.error('❌ Encryption failed:', error)
    throw new Error(`File encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Decrypt file data using Web Crypto API
 * @param encryptedData - Encrypted file data
 * @param keyBase64 - Base64 encoded encryption key
 * @param ivBase64 - Base64 encoded IV
 * @returns Decrypted file data
 */
export async function decryptFile(
  encryptedData: ArrayBuffer,
  keyBase64: string,
  ivBase64: string
): Promise<DecryptionResult> {
  try {
    console.log('🔓 Starting client-side file decryption...')
    console.log('📊 Encrypted file size:', encryptedData.byteLength, 'bytes')

    // Import key
    const keyData = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0))
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    )

    // Import IV
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0))

    // Decrypt the file
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encryptedData
    )

    console.log('✅ File decrypted successfully')
    console.log('📊 Decrypted size:', decryptedData.byteLength, 'bytes')

    return {
      data: decryptedData
    }
  } catch (error) {
    console.error('❌ Decryption failed:', error)
    throw new Error(`File decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate a random encryption key as base64 string
 * For storage in smart contracts
 */
export async function generateEncryptionKeyBase64(): Promise<string> {
  const key = await generateEncryptionKey()
  const exportedKey = await crypto.subtle.exportKey('raw', key)
  return btoa(String.fromCharCode(...new Uint8Array(exportedKey)))
}



