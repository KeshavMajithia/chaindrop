"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TransferDetailsModal } from "@/components/transfer-details-modal"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { Trash2, Copy, ExternalLink, TrendingUp, FileText, Download, Share2 } from "lucide-react"
import { getTransfers, deleteTransfer, deleteMultipleTransfers } from "@/lib/transfer-storage"

interface DashboardTransfer {
  id: string
  fileName: string
  fileSize: string
  status: "completed" | "pending" | "expired"
  uploadedAt: string
  downloads: number
  recipient?: string
  expiresIn?: string
}

export default function DashboardPage() {
  const [transfers, setTransfers] = useState<DashboardTransfer[]>([])
  const [selectedTransfers, setSelectedTransfers] = useState<string[]>([])
  const [selectedTransferForModal, setSelectedTransferForModal] = useState<DashboardTransfer | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const storedTransfers = getTransfers()
    setTransfers(storedTransfers as DashboardTransfer[])
  }, [])

  // Calculate chart data from actual transfers
  const chartData = (() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return {
        date: days[date.getDay()],
        fullDate: date.toDateString(),
        transfers: 0,
        downloads: 0
      }
    })

    // Group transfers by day
    transfers.forEach(transfer => {
      const transferDate = new Date(transfer.uploadedAt).toDateString()
      const dayData = last7Days.find(d => d.fullDate === transferDate)
      if (dayData) {
        dayData.transfers++
        dayData.downloads += transfer.downloads
      }
    })

    return last7Days.map(({ date, transfers, downloads }) => ({ date, transfers, downloads }))
  })()

  const handleDelete = (id: string) => {
    deleteTransfer(id)
    setTransfers(transfers.filter((t) => t.id !== id))
    setSelectedTransfers(selectedTransfers.filter((s) => s !== id))
  }

  const handleSelectAll = () => {
    if (selectedTransfers.length === transfers.length) {
      setSelectedTransfers([])
    } else {
      setSelectedTransfers(transfers.map((t) => t.id))
    }
  }

  const handleViewDetails = (transfer: DashboardTransfer) => {
    setSelectedTransferForModal(transfer)
    setIsModalOpen(true)
  }

  const handleCopyLink = (id: string) => {
    const link = `${window.location.origin}/receive/${id}`
    navigator.clipboard.writeText(link)
  }

  const handleDeleteSelected = () => {
    deleteMultipleTransfers(selectedTransfers)
    setTransfers(transfers.filter((t) => !selectedTransfers.includes(t.id)))
    setSelectedTransfers([])
  }

  const stats = [
    {
      label: "Total Transfers",
      value: transfers.length,
      icon: FileText,
      color: "text-primary",
    },
    {
      label: "Total Downloads",
      value: transfers.reduce((sum, t) => sum + t.downloads, 0),
      icon: Download,
      color: "text-secondary",
    },
    {
      label: "Active Transfers",
      value: transfers.filter((t) => t.status === "completed").length,
      icon: TrendingUp,
      color: "text-accent",
    },
    {
      label: "Total Data Shared",
      value:
        transfers.length > 0
          ? `${(
              transfers.reduce((sum, t) => {
                const size = Number.parseFloat(t.fileSize)
                return sum + size
              }, 0)
            ).toFixed(1)} MB`
          : "0 MB",
      icon: Share2,
      color: "text-primary",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header walletConnected={false} />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Manage and track all your file transfers</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {stats.map((stat, idx) => {
              const Icon = stat.icon
              return (
                <div key={idx} className="glass rounded-xl p-6 hover-overlay">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-primary/20 ${stat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
              )
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <div className="glass rounded-xl p-6 hover-overlay">
              <h3 className="text-lg font-semibold text-foreground mb-6">Transfers This Week</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      backgroundColor: "rgba(10, 10, 30, 0.95)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(139, 92, 246, 0.3)",
                      borderRadius: "8px",
                      color: "rgba(255,255,255,0.9)"
                    }}
                    labelStyle={{ color: "rgba(255,255,255,0.9)" }}
                    itemStyle={{ color: "rgba(0, 217, 255, 1)" }}
                  />
                  <Bar dataKey="transfers" fill="#00d9ff" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass rounded-xl p-6 hover-overlay">
              <h3 className="text-lg font-semibold text-foreground mb-6">Downloads Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip
                    cursor={{ stroke: "transparent" }}
                    contentStyle={{
                      backgroundColor: "rgba(10, 10, 30, 0.95)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(139, 92, 246, 0.3)",
                      borderRadius: "8px",
                      color: "rgba(255,255,255,0.9)"
                    }}
                    labelStyle={{ color: "rgba(255,255,255,0.9)" }}
                    itemStyle={{ color: "rgba(217, 70, 239, 1)" }}
                  />
                  <Line type="monotone" dataKey="downloads" stroke="#d946ef" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Transfers Table */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Recent Transfers</h3>
                {selectedTransfers.length > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="text-sm text-destructive hover:text-destructive/80 transition-colors"
                  >
                    Delete Selected ({selectedTransfers.length})
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedTransfers.length === transfers.length && transfers.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">File</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Size</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Downloads</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Uploaded</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.length > 0 ? (
                    transfers.map((transfer) => (
                      <tr key={transfer.id} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedTransfers.includes(transfer.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTransfers([...selectedTransfers, transfer.id])
                              } else {
                                setSelectedTransfers(selectedTransfers.filter((s) => s !== transfer.id))
                              }
                            }}
                            className="rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-foreground truncate">{transfer.fileName}</p>
                          {transfer.recipient && <p className="text-xs text-muted-foreground">{transfer.recipient}</p>}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{transfer.fileSize}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              transfer.status === "completed"
                                ? "bg-secondary/20 text-secondary"
                                : transfer.status === "pending"
                                  ? "bg-primary/20 text-primary"
                                  : "bg-muted/20 text-muted-foreground"
                            }`}
                          >
                            {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{transfer.downloads}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{transfer.uploadedAt}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyLink(transfer.id)}
                              className="p-1 hover:bg-primary/20 rounded transition-colors"
                              title="Copy link"
                            >
                              <Copy className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleViewDetails(transfer)}
                              className="p-1 hover:bg-primary/20 rounded transition-colors"
                              title="View details"
                            >
                              <ExternalLink className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleDelete(transfer.id)}
                              className="p-1 hover:bg-destructive/20 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                        No transfers yet. Create one from the app page to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
