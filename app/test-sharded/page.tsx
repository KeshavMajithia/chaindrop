"use client"

import { useState } from 'react'
import { uploadSharded, downloadSharded, estimateUploadTime, type UploadProgress, type DownloadProgress } from '@/lib/storage/sharded-storage-manager'
import { Database, Cloud, FileIcon, Upload, Download, CheckCircle, AlertCircle } from 'lucide-react'

export default function TestShardedPage() {
  const [file, setFile] = useState<File | null>(null)
  const [metadataCID, setMetadataCID] = useState<string>('')
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError('')
      setResult('')
      console.log('📁 File selected:', selectedFile.name, selectedFile.size, 'bytes')
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }

    setIsUploading(true)
    setError('')
    setResult('')
    setUploadProgress(null)

    try {
      console.log('🚀 Starting sharded upload...')
      
      const cid = await uploadSharded(file, (progress) => {
        setUploadProgress(progress)
        console.log('📊 Upload progress:', progress)
      })

      setMetadataCID(cid)
      setResult(`✅ Upload successful!\n\nMetadata CID: ${cid}\n\nYou can now download using this CID.`)
      console.log('✅ Upload complete! CID:', cid)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(`Upload failed: ${errorMsg}`)
      console.error('❌ Upload failed:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = async () => {
    if (!metadataCID) {
      setError('Please enter a metadata CID')
      return
    }

    setIsDownloading(true)
    setError('')
    setResult('')
    setDownloadProgress(null)

    try {
      console.log('🔄 Starting sharded download...')
      
      const blob = await downloadSharded(metadataCID, (progress) => {
        setDownloadProgress(progress)
        console.log('📊 Download progress:', progress)
      })

      // Trigger download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file?.name || 'downloaded_file'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setResult(`✅ Download successful!\n\nFile size: ${blob.size} bytes\n\nFile has been downloaded to your device.`)
      console.log('✅ Download complete!')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(`Download failed: ${errorMsg}`)
      console.error('❌ Download failed:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          🧩 Sharded Storage Test
        </h1>
        <p className="text-gray-300 mb-8">
          Test multi-provider sharded storage with automatic distribution across Pinata, Filebase, and Lighthouse
        </p>

        {/* File Upload Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl mb-6 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Upload className="w-6 h-6" />
            Upload File
          </h2>
          
          <div className="space-y-4">
            <div>
              <input
                type="file"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-300
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-purple-600 file:text-white
                  hover:file:bg-purple-700
                  cursor-pointer"
              />
            </div>

            {file && (
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <p className="text-sm text-gray-300">
                  <strong>Selected:</strong> {file.name}
                </p>
                <p className="text-sm text-gray-300">
                  <strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="text-sm text-gray-300">
                  <strong>Estimated time:</strong> {estimateUploadTime(file.size)}
                </p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors w-full"
            >
              {isUploading ? '⏳ Uploading...' : '🚀 Upload with Sharding'}
            </button>
          </div>
        </div>

        {/* Upload Progress */}
        {uploadProgress && (
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl mb-6 border border-gray-700">
            <h3 className="text-xl font-bold mb-4">📊 Upload Progress</h3>
            
            {/* Service Progress Bars */}
            <div className="space-y-4 mb-6">
              {/* Filebase */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-green-400" />
                    <span className="font-semibold">Filebase</span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {uploadProgress.filebaseCounts} chunks
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.filebase}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 text-right">{uploadProgress.filebase.toFixed(1)}%</p>
              </div>

              {/* Pinata */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileIcon className="w-5 h-5 text-blue-400" />
                    <span className="font-semibold">Pinata</span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {uploadProgress.pinataCounts} chunks
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.pinata}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 text-right">{uploadProgress.pinata.toFixed(1)}%</p>
              </div>

              {/* Lighthouse */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-purple-400" />
                    <span className="font-semibold">Lighthouse</span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {uploadProgress.lighthouseCounts} chunks
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.lighthouse}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 text-right">{uploadProgress.lighthouse.toFixed(1)}%</p>
              </div>
            </div>

            {/* Overall Progress */}
            <div className="border-t border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg">Overall Progress</span>
                <span className="text-2xl font-bold text-purple-400">
                  {uploadProgress.overall.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4 mb-2">
                <div
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.overall}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 text-center">
                {uploadProgress.uploaded} / {uploadProgress.total} chunks uploaded
              </p>
            </div>
          </div>
        )}

        {/* Download Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl mb-6 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Download className="w-6 h-6" />
            Download File
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Metadata CID</label>
              <input
                type="text"
                value={metadataCID}
                onChange={(e) => setMetadataCID(e.target.value)}
                placeholder="Enter metadata CID..."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              onClick={handleDownload}
              disabled={!metadataCID || isDownloading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors w-full"
            >
              {isDownloading ? '⏳ Downloading...' : '📥 Download File'}
            </button>
          </div>
        </div>

        {/* Download Progress */}
        {downloadProgress && (
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl mb-6 border border-gray-700">
            <h3 className="text-xl font-bold mb-4">📥 Download Progress</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Progress</span>
                <span className="text-2xl font-bold text-blue-400">
                  {downloadProgress.overall.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div
                  className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress.overall}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 text-center">
                {downloadProgress.downloaded} / {downloadProgress.total} chunks downloaded
              </p>
              <p className="text-xs text-gray-500 text-center">
                Current chunk: {downloadProgress.currentChunk}
              </p>
            </div>
          </div>
        )}

        {/* Result/Error Display */}
        {result && (
          <div className="bg-green-900/30 border border-green-500 p-6 rounded-xl mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <pre className="text-sm text-green-100 whitespace-pre-wrap flex-1">{result}</pre>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-500 p-6 rounded-xl mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              <p className="text-sm text-red-100 flex-1">{error}</p>
            </div>
          </div>
        )}

        {/* Success Notice */}
        <div className="bg-green-900/30 border border-green-500/50 p-6 rounded-xl mb-6">
          <h3 className="text-lg font-bold mb-3 text-green-400">✅ Multi-Provider Sharding Active!</h3>
          <div className="space-y-2 text-sm text-green-100">
            <p>
              <strong>Chunks are distributed across all three IPFS providers:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>40% Filebase</strong> - Largest free tier (5GB)</li>
              <li><strong>20% Pinata</strong> - Reliable industry standard (1GB)</li>
              <li><strong>40% Lighthouse</strong> - 100GB perpetual storage (Free)</li>
            </ul>
            <p className="text-green-200 mt-2">
              🔒 <strong>CORS solved:</strong> Server-side API routes proxy uploads to Filebase & Lighthouse
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-bold mb-3">ℹ️ How It Works</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• Files are encrypted client-side before upload</li>
            <li>• <strong className="text-blue-400">Dynamic chunk sizing</strong>: Automatically calculated to ensure all services get chunks (50KB-1MB)</li>
            <li>• <strong className="text-green-400">Chunks distributed: 40% Filebase, 20% Pinata, 40% Lighthouse</strong></li>
            <li>• Each chunk uploaded with SHA-256 checksum verification</li>
            <li>• Server-side API routes handle Filebase & Lighthouse (CORS bypass)</li>
            <li>• Chunk map (metadata) stored on Pinata as single source of truth</li>
            <li>• Download retrieves chunks from all services in parallel</li>
            <li>• Checksums verified on download, file decrypted client-side</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
