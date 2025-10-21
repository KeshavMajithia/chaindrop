"use client"

import { Copy, Check } from "lucide-react"
import { useState } from "react"

interface TransferCardProps {
  transferId: string
  fileName: string
  fileSize: string
  status: "pending" | "connecting" | "waiting" | "transferring" | "completed" | "failed" | "expired"
  progress?: number
  speed?: number
  expiresIn?: string
}

export function TransferCard({ transferId, fileName, fileSize, status, progress = 0, speed, expiresIn }: TransferCardProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transferId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const statusColors = {
    pending: "bg-muted/50 text-muted-foreground",
    connecting: "bg-blue-500/20 text-blue-500",
    waiting: "bg-yellow-500/20 text-yellow-500",
    transferring: "bg-primary/20 text-primary",
    completed: "bg-green-500/20 text-green-500",
    failed: "bg-red-500/20 text-red-500",
    expired: "bg-destructive/20 text-destructive",
  }

  return (
    <div className="glass rounded-xl p-6 space-y-4 hover-overlay animate-slideInRight">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground truncate">{fileName}</h3>
          <p className="text-sm text-muted-foreground">{fileSize}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {status === "transferring" && (
        <div className="space-y-2">
          <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-accent h-full transition-all duration-300 ease-out animate-shimmer"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress}%</span>
            {speed && (
              <span>{(speed / 1024 / 1024).toFixed(2)} MB/s</span>
            )}
          </div>
        </div>
      )}

      {status === "waiting" && (
        <div className="text-center py-2">
          <div className="animate-pulse text-yellow-500 mb-1">
            <div className="w-4 h-4 mx-auto border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-xs text-muted-foreground">Waiting for receiver...</p>
        </div>
      )}

      {status === "connecting" && (
        <div className="text-center py-2">
          <div className="animate-pulse text-blue-500 mb-1">
            <div className="w-4 h-4 mx-auto border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-xs text-muted-foreground">Connecting...</p>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Transfer ID</p>
        <div className="flex items-center gap-2 bg-muted/20 rounded-lg p-3 hover-overlay">
          <code className="text-sm font-mono text-primary flex-1 truncate">{transferId}</code>
          <button
            onClick={copyToClipboard}
            className="p-1 hover:bg-primary/20 rounded transition-all duration-300 ease-out"
            title="Copy transfer ID"
          >
            {copied ? (
              <Check className="w-4 h-4 text-secondary animate-pulse" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {expiresIn && <p className="text-xs text-muted-foreground">Expires in {expiresIn}</p>}
    </div>
  )
}
