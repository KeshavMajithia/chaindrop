"use client"

import { useState } from "react"
import { Wallet } from "lucide-react"

interface WalletButtonProps {
  isConnected?: boolean
  address?: string
  onConnect?: () => void
  onDisconnect?: () => void
}

export function WalletButton({ isConnected = false, address = "", onConnect, onDisconnect }: WalletButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-primary/20 transition-colors glow-primary hover-overlay"
      >
        <Wallet className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">{isConnected ? truncateAddress(address) : "Connect Wallet"}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 glass rounded-lg p-2 min-w-48 z-50 animate-fadeInUp">
          {isConnected ? (
            <>
              <div className="px-3 py-2 text-xs text-muted-foreground">Connected: {truncateAddress(address)}</div>
              <button
                onClick={() => {
                  onDisconnect?.()
                  setIsOpen(false)
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-destructive/20 text-destructive rounded transition-colors"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                onConnect?.()
                setIsOpen(false)
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-primary/20 text-primary rounded transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </div>
      )}
    </div>
  )
}
