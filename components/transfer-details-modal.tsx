"use client"

import { X, Copy, Share2, Download } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { QRCodeSVG } from "qrcode.react"

interface TransferDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  transfer: {
    id: string
    fileName: string
    fileSize: string
    status: "pending" | "connecting" | "waiting" | "transferring" | "completed" | "failed" | "expired"
    uploadedAt?: string
    downloads?: number
    recipient?: string
    expiresIn?: string
  }
}

export function TransferDetailsModal({ isOpen, onClose, transfer }: TransferDetailsModalProps) {
  const [qrSize, setQrSize] = useState(200)
  const qrRef = useRef<HTMLDivElement>(null)

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

  // Calculate responsive QR code size
  useEffect(() => {
    const updateQrSize = () => {
      if (qrRef.current) {
        const containerWidth = qrRef.current.offsetWidth
        const newSize = Math.min(containerWidth - 40, 300) // Max 300px, with 20px padding on each side
        setQrSize(Math.max(newSize, 150)) // Min 150px
      }
    }

    if (isOpen) {
      updateQrSize()
      window.addEventListener('resize', updateQrSize)
      return () => window.removeEventListener('resize', updateQrSize)
    }
  }, [isOpen])

  if (!isOpen) return null

  const transferLink = `${window.location.origin}/receive/${transfer.id}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(transferLink)
  }

  const handleDownloadQR = () => {
    const svg = document.querySelector('#qr-code svg') as SVGElement
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)
      const link = document.createElement('a')
      link.download = `chaindrop-transfer-${transfer.id}.svg`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    }
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
                <p className="text-foreground font-medium text-sm">{transfer.uploadedAt || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Downloads</p>
                <p className="text-foreground font-medium">{transfer.downloads ?? 0}</p>
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

          <div className="glass-dark rounded-lg p-6 flex flex-col items-center space-y-4">
            <div className="text-center">
              <p className="text-sm font-medium text-foreground mb-1">Share via QR Code</p>
              <p className="text-xs text-muted-foreground">Scan to receive the file</p>
            </div>
            
            <div 
              ref={qrRef}
              className="relative p-4 bg-white rounded-xl shadow-lg animate-qr-appear animate-qr-glow"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '4px'
              }}
            >
              <div className="bg-white rounded-lg p-3">
                <div id="qr-code" className="animate-fadeInUp">
                  <QRCodeSVG
                    value={transferLink}
                    size={qrSize}
                    level="M"
                    includeMargin={true}
                    style={{
                      width: '100%',
                      height: '100%'
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleDownloadQR}
                className="flex items-center gap-2 px-3 py-2 glass rounded-lg text-sm font-medium text-foreground hover:bg-primary/30 transition-all"
              >
                <Download className="w-4 h-4" />
                Download QR
              </button>
            </div>
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
