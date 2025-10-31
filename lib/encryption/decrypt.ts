/**
 * Client-side decryption using AES-256-GCM
 */

import { importKey, base64ToArrayBuffer } from './key-generator'

export interface EncryptedData {
  data: ArrayBuffer
  iv: string
}

/**
 * Decrypt data using AES-256-GCM
 * @param encryptedData - Encrypted data with IV
 * @param encryptionKey - Base64 encoded encryption key
 * @returns Decrypted data as ArrayBuffer
 */
export async function decryptData(
  encryptedData: EncryptedData,
  encryptionKey: string
): Promise<ArrayBuffer> {
  try {
    // Convert IV from base64
    const ivBuffer = base64ToArrayBuffer(encryptedData.iv)
    
    // Import the encryption key
    const cryptoKey = await importKey(encryptionKey)
    
    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
        tagLength: 128
      },
      cryptoKey,
      encryptedData.data
    )
    
    return decryptedBuffer
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data - invalid key or corrupted data')
  }
}

/**
 * Decrypt a file chunk
 * @param encryptedChunk - Encrypted chunk with IV
 * @param encryptionKey - Base64 encoded encryption key
 * @returns Decrypted chunk as ArrayBuffer
 */
export async function decryptChunk(
  encryptedChunk: EncryptedData,
  encryptionKey: string
): Promise<ArrayBuffer> {
  return await decryptData(encryptedChunk, encryptionKey)
}

/**
 * Decrypt file metadata
 * @param encryptedMetadata - Encrypted metadata with IV
 * @param encryptionKey - Base64 encoded encryption key
 * @returns Decrypted metadata object
 */
export async function decryptMetadata(
  encryptedMetadata: EncryptedData,
  encryptionKey: string
): Promise<any> {
  const decryptedBuffer = await decryptData(encryptedMetadata, encryptionKey)
  
  // Convert ArrayBuffer back to JSON object
  const decoder = new TextDecoder()
  const metadataString = decoder.decode(decryptedBuffer)
  
  return JSON.parse(metadataString)
}
