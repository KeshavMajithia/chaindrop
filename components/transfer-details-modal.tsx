"use client"

import { X, Copy, Share2 } from "lucide-react"
import { useEffect } from "react"
import QRCode from "qrcode"

interface TransferDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  transfer: {
    id: string
    fileName: string
    fileSize: string
    status: "completed" | "pending" | "expired"
    uploadedAt: string
    downloads: number
    recipient?: string
    expiresIn?: string
  }
}

export function TransferDetailsModal({ isOpen, onClose, transfer }: TransferDetailsModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      const canvas = document.getElementById("qr-code-canvas") as HTMLCanvasElement
      if (canvas) {
        const link = `${window.location.origin}/receive/${transfer.id}`
        QRCode.toCanvas(canvas, link, { width: 200 }, (error) => {
          if (error) console.error("QR Code generation error:", error)
        })
      }
    }
  }, [isOpen, transfer.id])

  if (!isOpen) return null

  const handleCopyLink = () => {
    const link = `${window.location.origin}/receive/${transfer.id}`
    navigator.clipboard.writeText(link)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative glass rounded-2xl p-8 max-w-md w-full space-y-6 animate-fadeInUp max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Transfer Details</h2>
            <p className="text-sm text-muted-foreground mt-1">View and manage this transfer</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-primary/20 rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="glass-dark rounded-lg p-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">File Name</p>
              <p className="text-foreground font-medium truncate">{transfer.fileName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">File Size</p>
                <p className="text-foreground font-medium">{transfer.fileSize}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium inline-block ${
                    transfer.status === "completed"
                      ? "bg-secondary/20 text-secondary"
                      : transfer.status === "pending"
                        ? "bg-primary/20 text-primary"
                        : "bg-muted/20 text-muted-foreground"
                  }`}
                >
                  {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Uploaded</p>
                <p className="text-foreground font-medium text-sm">{transfer.uploadedAt}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Downloads</p>
                <p className="text-foreground font-medium">{transfer.downloads}</p>
              </div>
            </div>
            {transfer.recipient && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Recipient</p>
                <p className="text-foreground font-medium text-sm">{transfer.recipient}</p>
              </div>
            )}
            {transfer.expiresIn && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Expires In</p>
                <p className="text-foreground font-medium text-sm">{transfer.expiresIn}</p>
              </div>
            )}
          </div>

          <div className="glass-dark rounded-lg p-4 flex flex-col items-center">
            <p className="text-xs text-muted-foreground mb-3">Share via QR Code</p>
            <canvas id="qr-code-canvas" className="bg-white p-2 rounded" />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopyLink}
            className="flex-1 glass rounded-lg px-4 py-2 font-medium text-foreground hover:bg-primary/30 transition-all flex items-center justify-center gap-2 group"
          >
            <Copy className="w-4 h-4" />
            Copy Link
          </button>
          <button className="flex-1 glass rounded-lg px-4 py-2 font-medium text-foreground hover:bg-primary/30 transition-all flex items-center justify-center gap-2 group">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full glass rounded-lg px-4 py-2 font-medium text-foreground hover:bg-primary/30 transition-all"
        >
          Close
        </button>
      </div>
    </div>
  )
}
