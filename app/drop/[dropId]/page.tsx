"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Download, Clock, Shield, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

interface DropDetails {
  dropId: string
  fileName: string
  fileSize: number
  walrusBlobId: string
  encryptionKey: string
  encryptionIV: string
  createdAt: string
  expiresAt: string
  downloadCount: number
  maxDownloads: number
  isExpired: boolean
  txHash: string
  network: string
}

export default function DropPage({ params }: { params: Promise<{ dropId: string }> }) {
  const [dropDetails, setDropDetails] = useState<DropDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const { dropId } = use(params)

  useEffect(() => {
    // Load drop details from decentralized storage
    const loadDropDetails = async () => {
      try {
        // Extract metadata blob ID from URL query parameter
        const urlParams = new URLSearchParams(window.location.search)
        const metadataBlobId = urlParams.get('meta')
        
        console.log('🆔 Drop ID:', dropId)
        console.log('📋 Metadata Blob ID from URL:', metadataBlobId)
        
        if (!metadataBlobId) {
          throw new Error('Metadata blob ID missing from URL')
        }
        
        const { getRealDropMetadata } = await import('@/lib/storage/real-decentralized-storage')
        
        const drop = await getRealDropMetadata(dropId, metadataBlobId, 'testnet')
        
        console.log('📝 Decentralized drop loaded:', drop?.fileName || 'not found')
        setDropDetails(drop)
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load decentralized drop details:', error)
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        if (errorMsg.includes('propagated')) {
          setError('Blob is propagating to Walrus aggregators. Please wait 30-60 seconds and try again.')
        } else {
          setError('Failed to load drop details: ' + errorMsg)
        }
        setIsLoading(false)
      }
    }

    loadDropDetails()
  }, [dropId, retryCount])

  const handleDownload = async () => {
    if (!dropDetails) return
    
    setIsDownloading(true)
    
    try {
      console.log('🔄 Downloading file from decentralized storage:', dropDetails.fileName)
      
      // Get file data from decentralized storage (IPFS)
      // txHash contains the metadata CID
        const { downloadFromRealDecentralizedDrop } = await import('@/lib/storage/real-decentralized-storage')
        const fileBlob = await downloadFromRealDecentralizedDrop(dropDetails.dropId, dropDetails.txHash, 'testnet')
      
      if (!fileBlob) {
        throw new Error('File not found in decentralized storage')
      }
      
      // Trigger download
      const url = URL.createObjectURL(fileBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = dropDetails.fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      console.log('✅ File downloaded from decentralized storage successfully')
    } catch (error) {
      console.error('❌ Download from decentralized storage failed:', error)
      setError('Download failed. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading drop details...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !dropDetails) {
    if (error) {
      const isPropagationError = error.includes('propagating') || error.includes('propagated')
      
      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold mb-4">
              {isPropagationError ? '⏳ Blob Propagating' : 'Drop Not Found'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {error}
            </p>
            {isPropagationError && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Walrus uses a distributed storage network. New blobs take 30-60 seconds to propagate across aggregators.
                </p>
                <Button 
                  onClick={() => {
                    setError(null)
                    setIsLoading(true)
                    setRetryCount(prev => prev + 1)
                  }}
                  className="mr-2"
                >
                  Retry Now
                </Button>
              </div>
            )}
            <Link href="/">
              <Button variant="outline" className="mt-4">Go Home</Button>
            </Link>
          </div>
        </div>
      )
    } else {
      return (
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Drop Not Found</h1>
              <p className="text-muted-foreground mb-4">
                The requested file drop could not be found or has expired.
              </p>
              <Link href="/">
                <Button variant="outline" className="mt-4">Go Home</Button>
              </Link>
            </div>
          </main>
          <Footer />
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">File Drop</h1>
            <p className="text-muted-foreground">
              Secure file sharing powered by blockchain
            </p>
          </div>

          <div className="glass rounded-xl p-8 space-y-6">
            {/* File Info */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{dropDetails.fileName}</h2>
              <p className="text-muted-foreground">
                {formatFileSize(dropDetails.fileSize)} • Drop ID: {dropDetails.dropId}
              </p>
            </div>

            {/* Status */}
            <div className="flex items-center justify-center gap-2">
              {dropDetails.isExpired ? (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Expired</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Available</span>
                </div>
              )}
            </div>

            {/* Download Button */}
            <div className="text-center">
              <button
                onClick={handleDownload}
                disabled={isDownloading || dropDetails.isExpired}
                className="glass rounded-lg px-8 py-4 font-semibold text-foreground hover:bg-primary/30 transition-all glow-primary inline-flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Download File
                  </>
                )}
              </button>
            </div>

            {/* Details */}
            <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-border/50">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">File Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File Name:</span>
                    <span className="font-mono">{dropDetails.fileName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File Size:</span>
                    <span>{formatFileSize(dropDetails.fileSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Blob ID:</span>
                    <span className="font-mono text-xs">{dropDetails.walrusBlobId}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Drop Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{formatDate(dropDetails.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires:</span>
                    <span>{formatDate(dropDetails.expiresAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Downloads:</span>
                    <span>{dropDetails.downloadCount} / {dropDetails.maxDownloads === -1 ? '∞' : dropDetails.maxDownloads}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction:</span>
                    <a
                      href={`https://suiscan.xyz/testnet/tx/${dropDetails.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-mono text-xs"
                    >
                      {dropDetails.txHash.slice(0, 8)}...
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-500 mb-1">Secure Transfer</h4>
                  <p className="text-sm text-blue-400">
                    This file is encrypted and stored on decentralized storage. 
                    Only you can access it with this unique link.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
