"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileIcon } from "lucide-react"

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void
  isLoading?: boolean
}

export function FileDropZone({ onFilesSelected, isLoading = false }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    setSelectedFiles(files)
    onFilesSelected(files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(files)
    onFilesSelected(files)
  }

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`glass rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 ease-out ${
          isDragging ? "border-primary bg-primary/10 scale-105" : "border-primary/30 hover:border-primary/60"
        } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
          id="file-input"
          disabled={isLoading}
        />
        <label htmlFor="file-input" className="cursor-pointer block">
          <div className="flex justify-center mb-4">
            <div className={`glow-primary p-4 rounded-full bg-primary/20 ${isDragging ? "animate-pulse-glow" : ""}`}>
              <Upload className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Drop files here</h3>
          <p className="text-muted-foreground mb-4">or click to browse</p>
          <p className="text-sm text-muted-foreground">Supports any file type • Max 100MB per file</p>
        </label>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-6 space-y-2 animate-fadeInUp">
          <h4 className="text-sm font-semibold text-foreground">Selected Files:</h4>
          {selectedFiles.map((file, idx) => (
            <div key={idx} className="glass rounded-lg p-3 flex items-center gap-3 hover-glow">
              <FileIcon className="w-4 h-4 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
