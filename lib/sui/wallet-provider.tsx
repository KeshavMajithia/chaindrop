'use client'

/**
 * Sui Wallet Provider
 * Provides wallet context and connection management
 */

// Dynamic imports for packages that might not be installed yet
let SuiClientProvider: any
let WalletProvider: any
let useCurrentAccount: any
let useConnectWallet: any
let useDisconnectWallet: any
let useSuiClientQuery: any
let useWallets: any
let QueryClient: any
let QueryClientProvider: any

try {
  const dappKitModule = require('@mysten/dapp-kit')
  const reactQueryModule = require('@tanstack/react-query')

  SuiClientProvider = dappKitModule.SuiClientProvider
  WalletProvider = dappKitModule.WalletProvider
  useCurrentAccount = dappKitModule.useCurrentAccount
  useConnectWallet = dappKitModule.useConnectWallet
  useDisconnectWallet = dappKitModule.useDisconnectWallet
  useSuiClientQuery = dappKitModule.useSuiClientQuery
  useWallets = dappKitModule.useWallets

  QueryClient = reactQueryModule.QueryClient
  QueryClientProvider = reactQueryModule.QueryClientProvider
} catch (error) {
  console.warn('Sui/React Query packages not found, using fallback implementations')

  // Fallback implementations
  SuiClientProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>
  WalletProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>
  useCurrentAccount = () => null
  useConnectWallet = () => ({
    mutate: async () => {},
    isPending: false
  })
  useDisconnectWallet = () => ({
    mutate: async () => {}
  })
  useSuiClientQuery = () => ({ data: null, isLoading: false, error: null })
  useWallets = () => []

  QueryClient = class MockQueryClient {}
  QueryClientProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>
}

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react'
import {
  SUI_NETWORKS,
  DEFAULT_NETWORK,
  createSuiClient,
  shortenAddress,
  SUPPORTED_WALLETS,
  SupportedWallet,
  WALLET_NAMES
} from './config'

interface SuiWalletContextType {
  // Wallet connection state
  isConnected: boolean
  isConnecting: boolean
  address: string | null
  walletName: SupportedWallet | null

  // Balance
  balance: bigint
  formattedBalance: string

  // Actions
  connect: (walletName?: SupportedWallet) => Promise<void>
  disconnect: () => Promise<void>
  switchWallet: (walletName: SupportedWallet) => Promise<void>

  // Utilities
  shortenAddress: (address: string) => string
  formatBalance: (balance: bigint) => string
}

const SuiWalletContext = createContext<SuiWalletContextType | undefined>(undefined)

// Query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

// Custom hook to use wallet context
export const useSuiWallet = () => {
  const context = useContext(SuiWalletContext)
  if (context === undefined) {
    throw new Error('useSuiWallet must be used within a SuiWalletProvider')
  }
  return context
}

interface SuiWalletProviderProps {
  children: ReactNode
  network?: keyof typeof SUI_NETWORKS
}

export const SuiWalletProvider: React.FC<SuiWalletProviderProps> = ({
  children,
  network = 'testnet'
}) => {
  const [suiClient] = useState(() => createSuiClient(SUI_NETWORKS[network]))

  // Store current network for Walrus
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chaindrop-network', network)
    }
  }, [network])

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={SUI_NETWORKS} defaultNetwork={network}>
        <WalletProvider
          preferredWallets={SUPPORTED_WALLETS}
          autoConnect={false}
        >
          <SuiWalletContextProvider suiClient={suiClient}>
            {children}
          </SuiWalletContextProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}

interface SuiWalletContextProviderProps {
  children: ReactNode
  suiClient: any // SuiClient type from @mysten/sui.js
}

const SuiWalletContextProvider: React.FC<SuiWalletContextProviderProps> = ({
  children,
  suiClient
}) => {
  const currentAccount = useCurrentAccount()
  const { mutate: connectWallet, isPending: isConnecting } = useConnectWallet()
  const { mutate: disconnectWallet } = useDisconnectWallet()
  const wallets = useWallets()

  const [balanceData, setBalanceData] = useState<any>(null)
  const [isBalanceLoading, setIsBalanceLoading] = useState(false)
  const [balanceError, setBalanceError] = useState<any>(null)

  // Fetch balance directly using Sui client
  useEffect(() => {
    const fetchBalance = async () => {
      if (!currentAccount?.address || !suiClient) return
      
      setIsBalanceLoading(true)
      setBalanceError(null)
      
      try {
        console.log('🔍 Fetching balance for:', currentAccount.address)
        const balance = await suiClient.getBalance({
          owner: currentAccount.address,
          coinType: '0x2::sui::SUI'
        })
        console.log('✅ Balance fetched:', balance)
        setBalanceData(balance)
      } catch (error) {
        console.error('❌ Balance fetch error:', error)
        setBalanceError(error)
      } finally {
        setIsBalanceLoading(false)
      }
    }

    fetchBalance()
  }, [currentAccount?.address, suiClient])

  const [walletName, setWalletName] = useState<SupportedWallet | null>(null)

  // Determine wallet name from current account
  useEffect(() => {
    if (currentAccount) {
      // This is a simplified way to detect wallet type
      // In a real implementation, you might need to check the wallet adapter
      setWalletName('suiWallet') // Default to Sui Wallet for now
    } else {
      setWalletName(null)
    }
  }, [currentAccount])

  const connect = useCallback(async (preferredWallet?: SupportedWallet) => {
    try {
      // Find the wallet by name - handle different wallet names
      const walletToConnect = wallets.find((wallet: any) => {
        const walletName = wallet.name.toLowerCase()
        const searchName = (preferredWallet || 'sui').toLowerCase()
        
        // Handle different wallet name variations
        if (searchName === 'suiwallet' || searchName === 'sui') {
          return walletName.includes('slush') || walletName.includes('sui')
        }
        
        return walletName.includes(searchName)
      })
      
      if (!walletToConnect) {
        throw new Error(`Wallet ${preferredWallet} not found. Available wallets: ${wallets.map((w: any) => w.name).join(', ')}`)
      }
      
      console.log('Connecting to wallet:', walletToConnect.name)
      
      connectWallet({
        wallet: walletToConnect
      })
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    }
  }, [connectWallet, wallets])

  const disconnect = useCallback(async () => {
    try {
      disconnectWallet()
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
      throw error
    }
  }, [disconnectWallet])

  const switchWallet = useCallback(async (newWalletName: SupportedWallet) => {
    try {
      // Disconnect current wallet first
      await disconnect()
      // Connect new wallet
      connectWallet({
        wallet: newWalletName
      })
    } catch (error) {
      console.error('Failed to switch wallet:', error)
      throw error
    }
  }, [connectWallet, disconnect])

  const formatBalanceDisplay = useCallback((balance: bigint) => {
    return (Number(balance) / 1_000_000_000).toFixed(2)
  }, [])

  const contextValue: SuiWalletContextType = {
    isConnected: !!currentAccount,
    isConnecting,
    address: currentAccount?.address || null,
    walletName,
    balance: balanceData ? BigInt(balanceData.totalBalance) : BigInt(0),
    formattedBalance: balanceData
      ? `${formatBalanceDisplay(BigInt(balanceData.totalBalance))} SUI`
      : '0.00 SUI',
    connect,
    disconnect,
    switchWallet,
    shortenAddress,
    formatBalance: formatBalanceDisplay
  }

  return (
    <SuiWalletContext.Provider value={contextValue}>
      {children}
    </SuiWalletContext.Provider>
  )
}
