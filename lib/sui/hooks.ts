/**
 * Sui Wallet Hooks
 * Custom hooks for wallet connection and balance management
 */

// Dynamic imports for packages that might not be installed yet
let useWallet: any
let useBalance: any
let useSuiClient: any
let useQuery: any
let SuiClient: any

try {
  const dappKitModule = require('@mysten/dapp-kit')
  const reactQueryModule = require('@tanstack/react-query')
  const suiModule = require('@mysten/sui.js')

  useWallet = dappKitModule.useWallet
  useBalance = dappKitModule.useBalance
  useSuiClient = dappKitModule.useSuiClient
  useQuery = reactQueryModule.useQuery
  SuiClient = suiModule.SuiClient
} catch (error) {
  console.warn('Sui/React Query packages not found, using fallback implementations')

  // Fallback implementations
  useWallet = () => ({
    currentAccount: null,
    isConnecting: false,
    connectionStatus: 'disconnected',
    selectWallet: async () => {}
  })
  useBalance = () => ({ data: null, isLoading: false, error: null })
  useSuiClient = () => ({})
  useQuery = () => ({ data: null, isLoading: false, error: null })
  SuiClient = class MockSuiClient {}
}

import { getWalletBalance, formatBalance, SUI_NETWORKS } from './config'

/**
 * Hook to get current wallet connection status
 */
export const useWalletConnection = () => {
  const { currentAccount, isConnecting, connectionStatus } = useWallet()

  return {
    isConnected: connectionStatus === 'connected' && !!currentAccount,
    isConnecting,
    address: currentAccount?.address || null,
    status: connectionStatus
  }
}

/**
 * Hook to get SUI balance for current wallet
 */
export const useSuiBalance = () => {
  const { currentAccount } = useWallet()
  const suiClient = useSuiClient()

  const { data: balanceData, isLoading, error } = useBalance({
    address: currentAccount?.address,
    coinType: '0x2::sui::SUI'
  })

  return {
    balance: balanceData ? BigInt(balanceData.totalBalance) : BigInt(0),
    formattedBalance: balanceData
      ? `${formatBalance(BigInt(balanceData.totalBalance))} SUI`
      : '0.00 SUI',
    isLoading,
    error
  }
}

/**
 * Hook to get balance for any coin type
 */
export const useCoinBalance = (coinType: string = '0x2::sui::SUI') => {
  const { currentAccount } = useWallet()
  const suiClient = useSuiClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['coinBalance', currentAccount?.address, coinType],
    queryFn: async () => {
      if (!currentAccount?.address) return null
      return await suiClient.getBalance({
        owner: currentAccount.address,
        coinType
      })
    },
    enabled: !!currentAccount?.address,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  })

  return {
    balance: data ? BigInt(data.totalBalance) : BigInt(0),
    formattedBalance: data ? `${formatBalance(BigInt(data.totalBalance))} ${coinType.split('::').pop()}` : '0.00',
    coinType: data?.coinType || coinType,
    isLoading,
    error
  }
}

/**
 * Hook to check if wallet is on the correct network
 */
export const useNetworkCheck = () => {
  const suiClient = useSuiClient()
  const { currentAccount } = useWallet()

  const { data: chainId, isLoading } = useQuery({
    queryKey: ['chainId'],
    queryFn: async () => {
      return await suiClient.getChainIdentifier()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const currentNetwork = SUI_NETWORKS.devnet // Default to devnet for now
  const isCorrectNetwork = chainId === currentNetwork.rpcUrl

  return {
    currentNetwork: chainId || 'unknown',
    expectedNetwork: currentNetwork.name,
    isCorrectNetwork,
    isLoading
  }
}

/**
 * Hook for wallet actions
 */
export const useWalletActions = () => {
  const { selectWallet } = useWallet()

  const connectWallet = async (walletName: string = 'suiWallet') => {
    try {
      await selectWallet(walletName as any)
      return true
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      return false
    }
  }

  const disconnectWallet = async () => {
    // The wallet provider handles disconnection
    // You might need to implement this based on the specific wallet
    console.log('Disconnecting wallet...')
  }

  return {
    connectWallet,
    disconnectWallet
  }
}

/**
 * Hook to get wallet capabilities
 */
export const useWalletCapabilities = () => {
  const { currentAccount } = useWallet()

  const canSignTransactions = !!currentAccount
  const canManageCoins = !!currentAccount
  const canStake = !!currentAccount

  return {
    canSignTransactions,
    canManageCoins,
    canStake,
    isWalletConnected: !!currentAccount
  }
}

/**
 * Hook for transaction building utilities
 */
export const useTransactionBuilder = () => {
  const suiClient = useSuiClient()

  const buildTransferTransaction = async (
    recipient: string,
    amount: bigint,
    coinType: string = '0x2::sui::SUI'
  ) => {
    // This would use the transaction builder from @mysten/sui.js
    // For now, return a placeholder
    return {
      type: 'transfer',
      recipient,
      amount,
      coinType
    }
  }

  return {
    buildTransferTransaction
  }
}
