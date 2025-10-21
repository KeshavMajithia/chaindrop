/**
 * Client-side encryption using AES-256-GCM
 */

import { importKey, generateIV, base64ToArrayBuffer } from './key-generator'

export interface EncryptedData {
  data: ArrayBuffer
  iv: string
}

/**
 * Encrypt data using AES-256-GCM
 * @param data - Data to encrypt (ArrayBuffer)
 * @param encryptionKey - Base64 encoded encryption key
 * @returns Encrypted data with IV
 */
export async function encryptData(
  data: ArrayBuffer,
  encryptionKey: string
): Promise<EncryptedData> {
  try {
    // Generate random IV for this encryption
    const iv = generateIV()
    const ivBuffer = base64ToArrayBuffer(iv)
    
    // Import the encryption key
    const cryptoKey = await importKey(encryptionKey)
    
    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
        tagLength: 128 // 128-bit authentication tag
      },
      cryptoKey,
      data
    )
    
    return {
      data: encryptedBuffer,
      iv
    }
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Encrypt a file chunk
 * @param chunk - File chunk as ArrayBuffer
 * @param encryptionKey - Base64 encoded encryption key
 * @returns Encrypted chunk with IV
 */
export async function encryptChunk(
  chunk: ArrayBuffer,
  encryptionKey: string
): Promise<EncryptedData> {
  return await encryptData(chunk, encryptionKey)
}

/**
 * Encrypt file metadata
 * @param metadata - Metadata object
 * @param encryptionKey - Base64 encoded encryption key
 * @returns Encrypted metadata with IV
 */
export async function encryptMetadata(
  metadata: any,
  encryptionKey: string
): Promise<EncryptedData> {
  // Convert metadata to JSON string, then to ArrayBuffer
  const metadataString = JSON.stringify(metadata)
  const encoder = new TextEncoder()
  const metadataBuffer = encoder.encode(metadataString)
  
  return await encryptData(metadataBuffer.buffer as ArrayBuffer, encryptionKey)
}
