"use client"

import { useState } from "react"
import { Wallet, Coins, ChevronDown, Copy, ExternalLink } from "lucide-react"
import { useSuiWallet } from "@/lib/sui/wallet-provider"
import { SUPPORTED_WALLETS, WALLET_NAMES } from "@/lib/sui/config"

export function WalletButton() {
  const [isOpen, setIsOpen] = useState(false)
  const {
    isConnected,
    address,
    walletName,
    formattedBalance,
    connect,
    disconnect,
    shortenAddress
  } = useSuiWallet()

  const handleConnect = async (walletId: string) => {
    try {
      console.log('Connecting to wallet:', walletId)
      await connect(walletId as any)
      console.log('Wallet connected successfully!')
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      alert(`Failed to connect wallet: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
    }
  }

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      // You could add a toast notification here
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-primary/20 transition-colors glow-primary hover-overlay"
      >
        <Wallet className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">
          {isConnected && address ? shortenAddress(address) : "Connect Wallet"}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 glass rounded-lg p-4 min-w-64 z-50 animate-fadeInUp shadow-lg">
          {isConnected && address ? (
            <>
              {/* Wallet Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      {walletName ? WALLET_NAMES[walletName] : 'Sui Wallet'}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {shortenAddress(address)}
                  </span>
                </div>

                {/* Balance */}
                <div className="flex items-center gap-2 p-3 glass rounded-lg">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">SUI Balance</p>
                    <p className="text-xs text-muted-foreground">Sui Devnet</p>
                  </div>
                  <span className="text-sm font-mono">{formattedBalance}</span>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={copyAddress}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary/20 text-primary rounded transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    Copy Address
                  </button>

                  <button
                    onClick={() => window.open(`https://suiscan.xyz/devnet/account/${address}`, '_blank')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary/20 text-primary rounded transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View on Explorer
                  </button>

                  <button
                    onClick={handleDisconnect}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-destructive/20 text-destructive rounded transition-colors"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Wallet Selection */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-center mb-3">Connect Wallet</p>

                {SUPPORTED_WALLETS.map((walletId) => (
                  <button
                    key={walletId}
                    onClick={() => handleConnect(walletId)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-primary/20 text-primary rounded transition-colors"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>{walletId === 'suiWallet' ? 'Slush Wallet' : WALLET_NAMES[walletId]}</span>
                  </button>
                ))}

                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground text-center">
                    Supported on Sui Devnet
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
