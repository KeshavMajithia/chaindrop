"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FileDropZone } from "@/components/file-drop-zone"
import { TransferCard } from "@/components/transfer-card"
import { TransferDetailsModal } from "@/components/transfer-details-modal"
import { Send, Settings } from "lucide-react"
import { getTransfers, saveTransfer, deleteTransfer } from "@/lib/transfer-storage"

interface Transfer {
  id: string
  fileName: string
  fileSize: string
  status: "pending" | "uploading" | "completed" | "expired"
  progress?: number
  expiresIn?: string
  uploadedAt?: string
  downloads?: number
  recipient?: string
}

export default function AppPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [recipientEmail, setRecipientEmail] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [selectedTransferForModal, setSelectedTransferForModal] = useState<Transfer | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expirationTime, setExpirationTime] = useState("7 days")
  const [downloadLimit, setDownloadLimit] = useState("Unlimited")

  useEffect(() => {
    const storedTransfers = getTransfers()
    setTransfers(storedTransfers as Transfer[])
  }, [])

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files)
  }

  const handleTransfer = () => {
    if (selectedFiles.length === 0) return

    const newTransfer: Transfer = {
      id: `0x${Math.random().toString(16).slice(2, 18)}`,
      fileName: selectedFiles[0].name,
      fileSize: `${(selectedFiles[0].size / 1024 / 1024).toFixed(1)} MB`,
      status: "uploading",
      progress: 0,
      expiresIn: expirationTime,
      uploadedAt: new Date().toLocaleString(),
      downloads: 0,
      recipient: recipientEmail || undefined,
    }

    saveTransfer(newTransfer as any)
    setTransfers([newTransfer, ...transfers])
    setSelectedFiles([])

    // Simulate upload progress
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 30
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        const completedTransfer = { ...newTransfer, status: "completed" as const, progress: 100 }
        setTransfers((prev) => prev.map((t) => (t.id === newTransfer.id ? completedTransfer : t)))
        saveTransfer(completedTransfer as any)
      } else {
        const updatingTransfer = { ...newTransfer, progress: Math.min(progress, 99) }
        setTransfers((prev) => prev.map((t) => (t.id === newTransfer.id ? updatingTransfer : t)))
      }
    }, 500)
  }

  const handleViewDetails = (transfer: Transfer) => {
    setSelectedTransferForModal(transfer)
    setIsModalOpen(true)
  }

  const handleDeleteTransfer = (id: string) => {
    deleteTransfer(id)
    setTransfers(transfers.filter((t) => t.id !== id))
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header walletConnected={true} walletAddress="0x1234567890abcdef" />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Section */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h1 className="text-4xl font-bold mb-2">Transfer Files</h1>
                <p className="text-muted-foreground">Upload files and share them securely via blockchain</p>
              </div>

              <FileDropZone onFilesSelected={handleFilesSelected} isLoading={false} />

              {/* Recipient Section */}
              <div className="glass rounded-xl p-6 space-y-4 hover-overlay">
                <h3 className="text-lg font-semibold text-foreground">Recipient</h3>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="recipient@example.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full glass rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to create a public transfer link that anyone can access
                </p>
              </div>

              {/* Transfer Options */}
              <div className="glass rounded-xl p-6 space-y-4 hover-overlay">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Transfer Options</h3>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 hover:bg-primary/20 rounded-lg transition-colors"
                  >
                    <Settings className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                {showSettings && (
                  <div className="space-y-4 pt-4 border-t border-border/50">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Expiration Time</label>
                      <select
                        value={expirationTime}
                        onChange={(e) => setExpirationTime(e.target.value)}
                        className="w-full glass rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option>7 days</option>
                        <option>24 hours</option>
                        <option>30 days</option>
                        <option>Never</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Download Limit</label>
                      <select
                        value={downloadLimit}
                        onChange={(e) => setDownloadLimit(e.target.value)}
                        className="w-full glass rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option>Unlimited</option>
                        <option>1 download</option>
                        <option>5 downloads</option>
                        <option>10 downloads</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Transfer Button */}
              <button
                onClick={handleTransfer}
                disabled={selectedFiles.length === 0}
                className="w-full glass rounded-lg px-6 py-3 font-semibold text-foreground hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all glow-primary flex items-center justify-center gap-2 hover-overlay"
              >
                <Send className="w-5 h-5" />
                Initiate Transfer
              </button>
            </div>

            {/* Recent Transfers Sidebar */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Recent Transfers</h2>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {transfers.length > 0 ? (
                  transfers.map((transfer) => (
                    <div key={transfer.id} className="group">
                      <div onClick={() => handleViewDetails(transfer)} className="cursor-pointer">
                        <TransferCard
                          transferId={transfer.id}
                          fileName={transfer.fileName}
                          fileSize={transfer.fileSize}
                          status={transfer.status}
                          progress={transfer.progress}
                          expiresIn={transfer.expiresIn}
                        />
                      </div>
                      <button
                        onClick={() => handleDeleteTransfer(transfer.id)}
                        className="text-xs text-destructive hover:text-destructive/80 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="glass rounded-xl p-6 text-center text-muted-foreground">
                    <p>No transfers yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {selectedTransferForModal && (
        <TransferDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          transfer={selectedTransferForModal}
        />
      )}
    </div>
  )
}
