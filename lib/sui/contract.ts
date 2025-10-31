/**
 * Real Sui Smart Contract Integration
 * Handles blockchain interactions for ChainDrop file drops
 */

import { Transaction } from '@mysten/sui/transactions'
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { useSuiWallet } from './wallet-provider'

// Contract configuration - UPDATE THIS AFTER DEPLOYMENT
export const CONTRACT_CONFIG = {
  // IMPORTANT: This package ID expired when Devnet reset
  // You need to deploy a new contract and update this value
  PACKAGE_ID: process.env.NEXT_PUBLIC_SUI_PACKAGE_ID || 'INVALID_PACKAGE_ID_NEEDS_REDEPLOY',
  MODULE_NAME: 'file_drop',
  CLOCK_OBJECT_ID: '0x6', // Sui Clock object
} as const

export interface FileDropDetails {
  id: string
  metadataCid: string
  creator: string
  createdAt: number
  price: number | null
  unlockTime: number | null
  maxClaims: number | null
  currentClaims: number
  escrowBalance: number
  downloadConfirmed: boolean
}

export interface CreateDropParams {
  metadataCid: string
  price?: number // in MIST (1 SUI = 1e9 MIST)
  unlockTime?: number // Unix timestamp in milliseconds
  maxClaims?: number
  gasBudget?: number
}

export interface ClaimDropParams {
  dropObjectId: string
  payment?: string // Coin object ID if paid drop
  gasBudget?: number
}

export interface TransactionStatus {
  status: 'idle' | 'pending' | 'success' | 'error'
  txHash?: string
  error?: string
  gasUsed?: string
}

/**
 * Sui Contract Client
 * Handles all blockchain interactions for file drops
 */
export class SuiContractClient {
  private client: any
  private packageId: string

  constructor(rpcUrl: string = getFullnodeUrl('devnet'), packageId?: string) {
    this.client = new SuiClient({ url: rpcUrl })
    this.packageId = packageId || CONTRACT_CONFIG.PACKAGE_ID
  }

  /**
   * Update package ID after deployment
   */
  setPackageId(packageId: string) {
    this.packageId = packageId
  }

  /**
   * Build transaction for creating a file drop
   * Returns TransactionBlock that needs to be signed by wallet
   */
  buildCreateDropTransaction(params: CreateDropParams): Transaction {
    // Validate package ID
    if (!this.packageId || this.packageId === 'INVALID_PACKAGE_ID_NEEDS_REDEPLOY') {
      throw new Error(
        'Smart contract not deployed. The Sui Devnet reset, removing the old contract. ' +
        'Please deploy a new contract following SETUP.md and update NEXT_PUBLIC_SUI_PACKAGE_ID in .env.local'
      )
    }

    const txb = new Transaction()

    // Convert metadata CID to bytes
    const metadataCidBytes = new TextEncoder().encode(params.metadataCid)

    // Prepare optional parameters
    const priceArg = params.price ? [params.price] : []
    const unlockTimeArg = params.unlockTime ? [params.unlockTime] : []
    const maxClaimsArg = params.maxClaims ? [params.maxClaims] : []

    // Call create_drop function
    txb.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULE_NAME}::create_drop`,
      arguments: [
        txb.pure.vector('u8', Array.from(metadataCidBytes)), // metadata_cid
        txb.pure.option('u64', params.price), // price: Option<u64>
        txb.pure.option('u64', params.unlockTime), // unlock_time: Option<u64>
        txb.pure.option('u64', params.maxClaims), // max_claims: Option<u64>
        txb.object(CONTRACT_CONFIG.CLOCK_OBJECT_ID), // clock
      ],
    })

    // Set gas budget
    txb.setGasBudget(params.gasBudget || 10000000) // 0.01 SUI

    return txb
  }

  /**
   * Get drop details from blockchain
   */
  async getDropDetails(dropObjectId: string): Promise<FileDropDetails | null> {
    try {
      console.log('🔍 Fetching drop details for:', dropObjectId)
      
      const objectData = await this.client.getObject({
        id: dropObjectId,
        options: {
          showContent: true,
          showOwner: true,
        },
      })

      if (!objectData.data?.content || objectData.data.content.dataType !== 'moveObject') {
        console.error('❌ Drop not found or invalid')
        return null
      }

      const fields = (objectData.data.content as any).fields

      // The Sui SDK automatically decodes String type from Move
      // So metadata_cid is already a string, not bytes!
      const metadataCid = fields.metadata_cid

      console.log('✅ Drop details fetched:', {
        metadataCid,
        creator: fields.creator,
        currentClaims: fields.current_claims,
      })

      return {
        id: dropObjectId,
        metadataCid,
        creator: fields.creator,
        createdAt: Number(fields.created_at),
        price: fields.price ? Number(fields.price) : null,
        unlockTime: fields.unlock_time ? Number(fields.unlock_time) : null,
        maxClaims: fields.max_claims ? Number(fields.max_claims) : null,
        currentClaims: Number(fields.current_claims),
        escrowBalance: Number(fields.escrow_balance),
        downloadConfirmed: fields.download_confirmed,
      }
    } catch (error) {
      console.error('❌ Failed to get drop details:', error)
      return null
    }
  }

  /**
   * Build transaction for claiming a drop
   * Returns TransactionBlock that needs to be signed by wallet
   */
  buildClaimDropTransaction(params: ClaimDropParams): Transaction {
    const txb = new Transaction()

    // Prepare payment argument - use option for Coin<SUI>
    const paymentArg = params.payment ? txb.object(params.payment) : txb.pure.option('address', null)

    // Call claim_drop function
    const [metadataCid] = txb.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULE_NAME}::claim_drop`,
      arguments: [
        txb.object(params.dropObjectId), // drop: &mut FileDrop
        paymentArg, // payment: Option<Coin<SUI>>
        txb.object(CONTRACT_CONFIG.CLOCK_OBJECT_ID), // clock
      ],
    })

    txb.setGasBudget(params.gasBudget || 10000000) // 0.01 SUI

    return txb
  }

  /**
   * Build transaction for confirming download
   * Returns TransactionBlock that needs to be signed by wallet
   */
  buildConfirmDownloadTransaction(dropObjectId: string, gasBudget?: number): Transaction {
    const txb = new Transaction()

    // Call confirm_download function
    txb.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULE_NAME}::confirm_download`,
      arguments: [
        txb.object(dropObjectId), // drop: &mut FileDrop
      ],
    })

    txb.setGasBudget(gasBudget || 10000000) // 0.01 SUI

    return txb
  }

  /**
   * Extract drop object ID from transaction effects
   */
  extractDropObjectId(effects: any): string | null {
    try {
      console.log('🔍 Inspecting transaction effects:', JSON.stringify(effects, null, 2))
      
      // Try different possible structures
      // 1. Check effects.created array
      if (effects?.created && Array.isArray(effects.created)) {
        for (const created of effects.created) {
          const objectId = created?.reference?.objectId || created?.objectId
          if (objectId) {
            console.log('✅ Found created drop object (from created array):', objectId)
            return objectId
          }
        }
      }
      
      // 2. Check effects.objectChanges array (new SDK format)
      if (effects?.objectChanges && Array.isArray(effects.objectChanges)) {
        for (const change of effects.objectChanges) {
          if (change.type === 'created' && change.objectType?.includes('::file_drop::FileDrop')) {
            console.log('✅ Found created FileDrop object:', change.objectId)
            return change.objectId
          }
        }
      }
      
      // 3. Check mutated objects (FileDrop is transferred to creator)
      if (effects?.mutated && Array.isArray(effects.mutated)) {
        for (const mutated of effects.mutated) {
          const objectId = mutated?.reference?.objectId || mutated?.objectId
          if (objectId) {
            console.log('✅ Found mutated object (might be FileDrop):', objectId)
            return objectId
          }
        }
      }
      
      console.error('❌ No created objects found in transaction')
      console.error('Available keys in effects:', Object.keys(effects || {}))
      return null
    } catch (error) {
      console.error('❌ Failed to extract drop ID:', error)
      return null
    }
  }

  /**
   * Extract metadata CID from transaction events
   */
  extractMetadataCid(events: any[]): string | null {
    try {
      // Look for DropClaimed event
      for (const event of events) {
        if (event.type && event.type.includes('::file_drop::DropClaimed')) {
          // The claim_drop function returns the metadata CID
          return event.parsedJson?.metadata_cid || null
        }
      }
      return null
    } catch (error) {
      console.error('❌ Failed to extract metadata CID:', error)
      return null
    }
  }
}

// Default contract client instance
export const suiContractClient = new SuiContractClient()

/**
 * React hook for contract interactions
 */
export const useSuiContract = () => {
  const { isConnected, address } = useSuiWallet()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const suiClient = useSuiClient()

  const createDrop = async (
    params: CreateDropParams,
    onProgress?: (status: TransactionStatus) => void
  ): Promise<{ txHash: string; dropObjectId: string; dropUrl: string }> => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }

    return new Promise((resolve, reject) => {
      try {
        onProgress?.({ status: 'pending' })

        // Build transaction
        const txb = suiContractClient.buildCreateDropTransaction(params)

        // Sign and execute
        signAndExecute(
          { transaction: txb },
          {
            onSuccess: async (result: any) => {
              console.log('✅ Drop created successfully!')
              console.log('Transaction digest:', result.digest)
              
              try {
                // Wait a moment for transaction to be indexed
                console.log('⏳ Waiting for transaction to be indexed...')
                await new Promise(resolve => setTimeout(resolve, 2000))
                
                // Query the transaction to get the full details with object changes
                let txResponse
                let retries = 3
                
                while (retries > 0) {
                  try {
                    txResponse = await suiClient.getTransactionBlock({
                      digest: result.digest,
                      options: {
                        showEffects: true,
                        showObjectChanges: true,
                      },
                    })
                    break
                  } catch (err: any) {
                    if (err.message?.includes('Could not find') && retries > 1) {
                      console.log(`⏳ Transaction not indexed yet, retrying... (${retries - 1} attempts left)`)
                      await new Promise(resolve => setTimeout(resolve, 1500))
                      retries--
                    } else {
                      throw err
                    }
                  }
                }
                
                if (!txResponse) {
                  throw new Error('Failed to fetch transaction after retries')
                }
                
                console.log('📦 Transaction details:', txResponse)
                
                // Extract drop object ID from objectChanges
                let dropObjectId: string | null = null
                
                if (txResponse.objectChanges) {
                  for (const change of txResponse.objectChanges) {
                    if (change.type === 'created' && change.objectType?.includes('::file_drop::FileDrop')) {
                      dropObjectId = change.objectId
                      console.log('✅ Found FileDrop object:', dropObjectId)
                      break
                    }
                  }
                }
                
                if (!dropObjectId) {
                  console.error('❌ Failed to extract drop object ID')
                  console.error('Object changes:', txResponse.objectChanges)
                  reject(new Error('Failed to extract drop object ID'))
                  return
                }

                onProgress?.({ status: 'success', txHash: result.digest })

                const dropUrl = `${window.location.origin}/drop/${dropObjectId}`

                resolve({
                  txHash: result.digest,
                  dropObjectId,
                  dropUrl,
                })
              } catch (error) {
                console.error('❌ Failed to query transaction:', error)
                reject(error)
              }
            },
            onError: (error: any) => {
              console.error('❌ Failed to create drop:', error)
              onProgress?.({
                status: 'error',
                error: error.message || 'Transaction failed'
              })
              reject(error)
            },
          }
        )
      } catch (error) {
        onProgress?.({
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        reject(error)
      }
    })
  }

  const claimDrop = async (
    params: ClaimDropParams,
    onProgress?: (status: TransactionStatus) => void
  ): Promise<{ txHash: string; metadataCid: string }> => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }

    return new Promise((resolve, reject) => {
      try {
        onProgress?.({ status: 'pending' })

        // Build transaction
        const txb = suiContractClient.buildClaimDropTransaction(params)

        // Sign and execute
        signAndExecute(
          { transaction: txb },
          {
            onSuccess: async (result: any) => {
              console.log('✅ Drop claimed successfully:', result.digest)
              
              // Get the drop details to extract metadata CID
              const dropDetails = await suiContractClient.getDropDetails(params.dropObjectId)
              
              if (!dropDetails) {
                reject(new Error('Failed to get drop details after claim'))
                return
              }

              onProgress?.({ status: 'success', txHash: result.digest })

              resolve({
                txHash: result.digest,
                metadataCid: dropDetails.metadataCid,
              })
            },
            onError: (error: any) => {
              console.error('❌ Failed to claim drop:', error)
              onProgress?.({
                status: 'error',
                error: error.message || 'Transaction failed'
              })
              reject(error)
            },
          }
        )
      } catch (error) {
        onProgress?.({
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        reject(error)
      }
    })
  }

  const confirmDownload = async (
    dropObjectId: string,
    onProgress?: (status: TransactionStatus) => void
  ): Promise<{ txHash: string }> => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }

    return new Promise((resolve, reject) => {
      try {
        onProgress?.({ status: 'pending' })

        // Build transaction
        const txb = suiContractClient.buildConfirmDownloadTransaction(dropObjectId)

        // Sign and execute
        signAndExecute(
          { transaction: txb },
          {
            onSuccess: (result: any) => {
              console.log('✅ Download confirmed successfully:', result.digest)
              onProgress?.({ status: 'success', txHash: result.digest })

              resolve({
                txHash: result.digest,
              })
            },
            onError: (error: any) => {
              console.error('❌ Failed to confirm download:', error)
              onProgress?.({
                status: 'error',
                error: error.message || 'Transaction failed'
              })
              reject(error)
            },
          }
        )
      } catch (error) {
        onProgress?.({
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        reject(error)
      }
    })
  }

  const getDropDetails = async (dropObjectId: string): Promise<FileDropDetails | null> => {
    return await suiContractClient.getDropDetails(dropObjectId)
  }

  return {
    createDrop,
    claimDrop,
    confirmDownload,
    getDropDetails,
    isWalletConnected: isConnected,
  }
}

/**
 * Utility functions for contract interactions
 */
export const formatGasAmount = (mistAmount: string): string => {
  const sui = Number(mistAmount) / 1_000_000_000
  return `${sui.toFixed(4)} SUI`
}

export const generateDropUrl = (dropObjectId: string): string => {
  return `${window.location.origin}/drop/${dropObjectId}`
}

export const getExplorerUrl = (txHash: string, network: string = 'devnet'): string => {
  return `https://suiscan.xyz/${network}/tx/${txHash}`
}

export const getObjectExplorerUrl = (objectId: string, network: string = 'devnet'): string => {
  return `https://suiscan.xyz/${network}/object/${objectId}`
}
