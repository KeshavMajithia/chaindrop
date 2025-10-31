/**
 * IPFS Adapter Interface
 * Common interface for all IPFS storage providers
 * Ensures consistent behavior across Pinata, Filebase, and Apillon
 */

export interface IPFSUploadResult {
  cid: string // IPFS Content Identifier
  url: string // Gateway URL for accessing the file
  size: number // File size in bytes
  provider: string // Which service was used
}

export interface IPFSDownloadResult {
  data: Blob // File data as Blob
  size: number // File size in bytes
  cid: string // IPFS CID
}

export interface IPFSAdapterConfig {
  name: string
  maxRetries?: number
  timeout?: number // in milliseconds
  maxFileSize?: number // in bytes
}

/**
 * Base interface that all IPFS adapters must implement
 */
export interface IPFSAdapter {
  /** Adapter name (e.g., 'Pinata', 'Filebase', 'Apillon') */
  readonly name: string

  /** Maximum file size supported by this adapter (in bytes) */
  readonly maxFileSize: number

  /** Whether the adapter is properly configured */
  readonly isConfigured: boolean

  /**
   * Upload a file to IPFS
   * @param blob - File data as Blob or ArrayBuffer
   * @param filename - Optional filename
   * @param onProgress - Optional progress callback (0-100)
   * @returns Promise with CID and gateway URL
   */
  upload(
    blob: Blob | ArrayBuffer,
    filename?: string,
    onProgress?: (progress: number) => void
  ): Promise<IPFSUploadResult>

  /**
   * Download a file from IPFS using CID
   * @param cid - IPFS Content Identifier
   * @returns Promise with file data as Blob
   */
  download(cid: string): Promise<IPFSDownloadResult>

  /**
   * Check if the service is healthy and accessible
   * @returns Promise<boolean> - true if service is available
   */
  isHealthy(): Promise<boolean>

  /**
   * Get adapter configuration and status
   */
  getInfo(): {
    name: string
    isConfigured: boolean
    maxFileSize: number
    freeStorage?: string
  }
}

/**
 * Error types for IPFS operations
 */
export class IPFSAdapterError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly code?: string,
    public readonly originalError?: Error
  ) {
    super(message)
    this.name = 'IPFSAdapterError'
  }
}

export class IPFSUploadError extends IPFSAdapterError {
  constructor(provider: string, message: string, originalError?: Error) {
    super(`Upload failed: ${message}`, provider, 'UPLOAD_ERROR', originalError)
    this.name = 'IPFSUploadError'
  }
}

export class IPFSDownloadError extends IPFSAdapterError {
  constructor(provider: string, message: string, originalError?: Error) {
    super(`Download failed: ${message}`, provider, 'DOWNLOAD_ERROR', originalError)
    this.name = 'IPFSDownloadError'
  }
}

export class IPFSConfigurationError extends IPFSAdapterError {
  constructor(provider: string, message: string) {
    super(`Configuration error: ${message}`, provider, 'CONFIG_ERROR')
    this.name = 'IPFSConfigurationError'
  }
}

export class IPFSTimeoutError extends IPFSAdapterError {
  constructor(provider: string, timeout: number) {
    super(`Operation timed out after ${timeout}ms`, provider, 'TIMEOUT_ERROR')
    this.name = 'IPFSTimeoutError'
  }
}
