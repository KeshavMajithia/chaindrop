"use client"

import Link from "next/link"
import { WalletButton } from "./wallet-button"
import { Zap, Radio } from "lucide-react"

interface HeaderProps {
  walletConnected?: boolean
  walletAddress?: string
}

export function Header({ walletConnected = false, walletAddress = "" }: HeaderProps) {
  return (
    <header className="glass sticky top-0 z-40 border-b">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="glow-primary p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ChainDrop
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Home
          </Link>
          <Link href="/app" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Transfer
          </Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Dashboard
          </Link>
          
          {/* Network Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30">
            <Radio className="w-3 h-3 text-yellow-500 animate-pulse" />
            <span className="text-xs font-medium text-yellow-600">Devnet</span>
          </div>
        </nav>

        <WalletButton />
      </div>
    </header>
  )
}
