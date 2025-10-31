/**
 * Real Sui Smart Contract Integration
 * Stores blob references and encryption keys on Sui blockchain
 */

import { SuiClient } from '@mysten/sui.js/client'
import { TransactionBlock } from '@mysten/sui.js/transactions'

export interface DropMetadata {
  dropId: string
  fileName: string
  fileSize: number
  walrusBlobId: string
  encryptionKey: string
  encryptionIV: string
  createdAt: string
  expiresAt: string
  maxDownloads: number
}

export interface ContractDropData {
  dropId: string
  blobId: string
  encryptionKey: string
  encryptionIV: string
  txHash: string
}

/**
 * Real Sui Contract Client
 * Interacts with actual Sui smart contracts
 */
export class RealSuiContractClient {
  private client: SuiClient
  private packageId: string
  private moduleName: string = 'chaindrop'

  constructor(client: SuiClient, packageId: string) {
    this.client = client
    this.packageId = packageId
    console.log('🔗 Real Sui contract client initialized')
    console.log('📦 Package ID:', packageId)
  }

  /**
   * Create a new drop on Sui blockchain
   * @param metadata - Drop metadata
   * @param signer - Transaction signer
   * @returns Transaction hash and drop ID
   */
  async createDrop(
    metadata: DropMetadata,
    signer: any
  ): Promise<ContractDropData> {
    try {
      console.log('🔗 Creating drop on Sui blockchain...')
      console.log('📄 Drop ID:', metadata.dropId)
      console.log('🆔 Walrus Blob ID:', metadata.walrusBlobId)

      const txb = new TransactionBlock()

      // Call the smart contract function to create a drop
      txb.moveCall({
        target: `${this.packageId}::${this.moduleName}::create_drop`,
        arguments: [
          txb.pure.string(metadata.dropId),
          txb.pure.string(metadata.fileName),
          txb.pure.u64(metadata.fileSize),
          txb.pure.string(metadata.walrusBlobId),
          txb.pure.string(metadata.encryptionKey),
          txb.pure.string(metadata.encryptionIV),
          txb.pure.u64(metadata.maxDownloads),
        ],
      })

      // Set gas budget
      txb.setGasBudget(10000000)

      // Sign and execute transaction
      const result = await this.client.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        signer,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      })

      const txHash = result.digest
      console.log('✅ Drop created on Sui blockchain')
      console.log('🔗 Transaction hash:', txHash)

      return {
        dropId: metadata.dropId,
        blobId: metadata.walrusBlobId,
        encryptionKey: metadata.encryptionKey,
        encryptionIV: metadata.encryptionIV,
        txHash
      }
    } catch (error) {
      console.error('❌ Failed to create drop on Sui:', error)
      throw new Error(`Failed to create blockchain drop: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get drop metadata from Sui blockchain
   * @param dropId - Drop ID to retrieve
   * @returns Drop metadata or null if not found
   */
  async getDropMetadata(dropId: string): Promise<DropMetadata | null> {
    try {
      console.log('🔍 Retrieving drop metadata from Sui blockchain:', dropId)

      // Query the smart contract for drop data
      const result = await this.client.getObject({
        id: dropId,
        options: {
          showContent: true,
          showType: true,
        },
      })

      if (!result.data) {
        console.log('❌ Drop not found on blockchain')
        return null
      }

      // Parse the object data to extract metadata
      const content = result.data.content
      if (content && 'fields' in content) {
        const fields = content.fields as any
        
        console.log('✅ Drop metadata retrieved from blockchain')
        
        return {
          dropId: fields.drop_id,
          fileName: fields.file_name,
          fileSize: parseInt(fields.file_size),
          walrusBlobId: fields.walrus_blob_id,
          encryptionKey: fields.encryption_key,
          encryptionIV: fields.encryption_iv,
          createdAt: fields.created_at,
          expiresAt: fields.expires_at,
          maxDownloads: parseInt(fields.max_downloads),
        }
      }

      return null
    } catch (error) {
      console.error('❌ Failed to retrieve drop metadata:', error)
      return null
    }
  }

  /**
   * Increment download count on blockchain
   * @param dropId - Drop ID
   * @param signer - Transaction signer
   */
  async incrementDownloadCount(dropId: string, signer: any): Promise<void> {
    try {
      console.log('📥 Incrementing download count on blockchain:', dropId)

      const txb = new TransactionBlock()

      txb.moveCall({
        target: `${this.packageId}::${this.moduleName}::increment_download_count`,
        arguments: [txb.pure.string(dropId)],
      })

      txb.setGasBudget(10000000)

      await this.client.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        signer,
        options: {
          showEffects: true,
        },
      })

      console.log('✅ Download count incremented on blockchain')
    } catch (error) {
      console.error('❌ Failed to increment download count:', error)
      throw error
    }
  }
}

/**
 * Create a real Sui contract client instance
 */
export function createRealSuiContractClient(
  client: SuiClient,
  packageId: string = '0x0' // Replace with actual package ID
): RealSuiContractClient {
  return new RealSuiContractClient(client, packageId)
}



