export interface StoredTransfer {
  id: string
  fileName: string
  fileSize: string
  status: "pending" | "uploading" | "completed" | "expired"
  progress?: number
  expiresIn?: string
  uploadedAt: string
  downloads: number
  recipient?: string
  createdAt: number
}

const STORAGE_KEY = "chaindrop_transfers"

export function getTransfers(): StoredTransfer[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function saveTransfer(transfer: StoredTransfer): void {
  if (typeof window === "undefined") return
  try {
    const transfers = getTransfers()
    const index = transfers.findIndex((t) => t.id === transfer.id)
    if (index >= 0) {
      transfers[index] = transfer
    } else {
      transfers.unshift(transfer)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transfers))
  } catch (error) {
    console.error("Error saving transfer:", error)
  }
}

export function deleteTransfer(id: string): void {
  if (typeof window === "undefined") return
  try {
    const transfers = getTransfers()
    const filtered = transfers.filter((t) => t.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error("Error deleting transfer:", error)
  }
}

export function deleteMultipleTransfers(ids: string[]): void {
  if (typeof window === "undefined") return
  try {
    const transfers = getTransfers()
    const filtered = transfers.filter((t) => !ids.includes(t.id))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error("Error deleting transfers:", error)
  }
}
