"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Download, CheckCircle, AlertCircle, Lock, Clock } from "lucide-react"

interface TransferDetails {
  id: string
  fileName: string
  fileSize: string
  sender: string
  uploadedAt: string
  expiresAt: string
  downloads: number
  maxDownloads: number
  isExpired: boolean
}

export default function ReceivePage({ params }: { params: { transferId: string } }) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloaded, setIsDownloaded] = useState(false)

  // Mock transfer details
  const transfer: TransferDetails = {
    id: params.transferId,
    fileName: "project-proposal.pdf",
    fileSize: "2.4 MB",
    sender: "john@example.com",
    uploadedAt: "2 hours ago",
    expiresAt: "in 6 days",
    downloads: 1,
    maxDownloads: 5,
    isExpired: false,
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    setDownloadProgress(0)

    // Simulate download progress
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsDownloading(false)
          setIsDownloaded(true)
          return 100
        }
        return prev + Math.random() * 30
      })
    }, 300)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-12">
          {/* Status Card */}
          <div className="glass rounded-2xl p-8 space-y-6 mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">File Transfer Received</h1>
                <p className="text-muted-foreground">From: {transfer.sender}</p>
              </div>
              {!transfer.isExpired ? (
                <div className="p-3 rounded-lg bg-secondary/20">
                  <CheckCircle className="w-6 h-6 text-secondary" />
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-destructive/20">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
              )}
            </div>

            {/* File Details */}
            <div className="space-y-4 border-t border-border/50 pt-6">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">File Name</span>
                <span className="font-semibold text-foreground">{transfer.fileName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">File Size</span>
                <span className="font-semibold text-foreground">{transfer.fileSize}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Uploaded</span>
                <span className="font-semibold text-foreground">{transfer.uploadedAt}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Expires</span>
                <span className="font-semibold text-foreground">{transfer.expiresAt}</span>
              </div>
            </div>

            {/* Security Info */}
            <div className="space-y-3 border-t border-border/50 pt-6">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground text-sm">End-to-End Encrypted</p>
                  <p className="text-xs text-muted-foreground">This file is encrypted and verified on the blockchain</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground text-sm">Limited Time Access</p>
                  <p className="text-xs text-muted-foreground">
                    Downloads: {transfer.downloads}/{transfer.maxDownloads}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Download Section */}
          {!transfer.isExpired ? (
            <div className="space-y-4">
              {isDownloading && (
                <div className="glass rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Downloading...</span>
                    <span className="text-sm text-muted-foreground">{Math.round(downloadProgress)}%</span>
                  </div>
                  <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary to-accent h-full transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {isDownloaded && (
                <div className="glass rounded-xl p-6 flex items-center gap-3 bg-secondary/10 border border-secondary/50">
                  <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Download Complete</p>
                    <p className="text-sm text-muted-foreground">Your file has been downloaded successfully</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleDownload}
                disabled={isDownloading || isDownloaded}
                className="w-full glass rounded-lg px-6 py-4 font-semibold text-foreground hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all glow-primary flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                {isDownloaded ? "Downloaded" : "Download File"}
              </button>

              <p className="text-xs text-muted-foreground text-center">
                This link will expire {transfer.expiresAt}. Download now to ensure you don't lose access.
              </p>
            </div>
          ) : (
            <div className="glass rounded-xl p-6 flex items-center gap-3 bg-destructive/10 border border-destructive/50">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Transfer Expired</p>
                <p className="text-sm text-muted-foreground">
                  This transfer link has expired and is no longer available
                </p>
              </div>
            </div>
          )}

          {/* Transfer ID */}
          <div className="mt-8 glass rounded-xl p-6">
            <p className="text-xs text-muted-foreground mb-2">Transfer ID</p>
            <code className="text-sm font-mono text-primary break-all">{transfer.id}</code>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
