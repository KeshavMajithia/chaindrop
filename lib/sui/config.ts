/**
 * Real Sui Network Configuration
 * Configuration for different Sui networks and wallet connections
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client'

export interface SuiNetwork {
  id: string
  name: string
  rpcUrl: string
  fullnodeUrl: string
  packageId?: string
  isTestnet: boolean
}

// Sui network configurations
export const SUI_NETWORKS: Record<string, SuiNetwork> = {
  devnet: {
    id: 'sui-devnet',
    name: 'Sui Devnet',
    rpcUrl: 'https://fullnode.devnet.sui.io',
    fullnodeUrl: getFullnodeUrl('devnet'),
    isTestnet: true,
  },
  testnet: {
    id: 'sui-testnet',
    name: 'Sui Testnet',
    rpcUrl: 'https://fullnode.testnet.sui.io',
    fullnodeUrl: getFullnodeUrl('testnet'),
    isTestnet: true,
  },
  mainnet: {
    id: 'sui-mainnet',
    name: 'Sui Mainnet',
    rpcUrl: 'https://fullnode.mainnet.sui.io',
    fullnodeUrl: getFullnodeUrl('mainnet'),
    isTestnet: false,
  }
}

// Default network (devnet for development)
export const DEFAULT_NETWORK = SUI_NETWORKS.devnet

// Create Sui client for a specific network
export function createSuiClient(network: SuiNetwork) {
  return new SuiClient({
    url: network.fullnodeUrl
  })
}

// Wallet configuration for supported wallets
export const SUPPORTED_WALLETS = [
  'suiWallet',
  'suiet',
  'ethos'
] as const

export type SupportedWallet = typeof SUPPORTED_WALLETS[number]

// Wallet display names
export const WALLET_NAMES: Record<SupportedWallet, string> = {
  suiWallet: 'Sui Wallet',
  suiet: 'Suiet',
  ethos: 'Ethos Wallet'
}

// Utility function to shorten wallet address
export function shortenAddress(address: string, startLength: number = 6, endLength: number = 4): string {
  if (address.length <= startLength + endLength) return address
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`
}

// Check if an address is valid Sui address
export function isValidSuiAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(address)
}

// Get wallet balance for a specific coin type
export async function getWalletBalance(
  suiClient: any,
  address: string,
  coinType: string = '0x2::sui::SUI'
): Promise<bigint> {
  try {
    const balance = await suiClient.getBalance({
      owner: address,
      coinType
    })
    return BigInt(balance.totalBalance)
  } catch (error) {
    console.error('Failed to get wallet balance:', error)
    return BigInt(0)
  }
}

// Format balance for display
export function formatBalance(balance: bigint, decimals: number = 9): string {
  const balanceStr = balance.toString()
  const padded = balanceStr.padStart(decimals + 1, '0')
  const integerPart = padded.slice(0, -decimals) || '0'
  const decimalPart = padded.slice(-decimals).replace(/0+$/, '')

  if (decimalPart) {
    return `${integerPart}.${decimalPart}`
  }
  return integerPart
}

// Convert SUI to MIST (1 SUI = 1e9 MIST)
export function suiToMist(sui: number | string): bigint {
  return BigInt(Math.floor(Number(sui) * 1_000_000_000))
}

// Convert MIST to SUI
export function mistToSui(mist: bigint): string {
  return (Number(mist) / 1_000_000_000).toString()
}
