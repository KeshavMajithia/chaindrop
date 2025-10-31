"use client"

import { useState } from 'react'
import { ipfsAdapterFactory } from '@/lib/storage/adapters/adapter-factory'

export default function TestAdaptersPage() {
  const [status, setStatus] = useState<any[]>([])
  const [health, setHealth] = useState<Map<string, boolean>>(new Map())
  const [testResult, setTestResult] = useState<string>('')

  const checkStatus = () => {
    const adapters = ipfsAdapterFactory.getStatus()
    setStatus(adapters)
    console.log('📊 Adapter Status:', adapters)
  }

  const checkHealth = async () => {
    setTestResult('Checking health...')
    const healthMap = await ipfsAdapterFactory.checkHealth()
    setHealth(healthMap)
    setTestResult('Health check complete!')
    console.log('🏥 Health Results:', healthMap)
  }

  const testUpload = async () => {
    try {
      setTestResult('Testing upload...')
      
      // Create a small test file
      const testData = new TextEncoder().encode('Hello from ChainDrop Phase 4!')
      const testBlob = new Blob([testData], { type: 'text/plain' })
      
      console.log('📤 Uploading test file...')
      const result = await ipfsAdapterFactory.upload(
        testBlob,
        'test.txt',
        (progress) => {
          console.log(`Upload progress: ${progress}%`)
          setTestResult(`Uploading... ${progress}%`)
        }
      )
      
      console.log('✅ Upload successful!', result)
      setTestResult(`✅ Upload successful!\nCID: ${result.cid}\nProvider: ${result.provider}`)
      
      // Test download
      console.log('📥 Testing download...')
      const downloadResult = await ipfsAdapterFactory.download(result.cid)
      const text = await downloadResult.data.text()
      console.log('✅ Download successful!', text)
      setTestResult(prev => prev + `\n✅ Download successful!\nContent: ${text}`)
      
    } catch (error) {
      console.error('❌ Test failed:', error)
      setTestResult(`❌ Error: ${error}`)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🧪 IPFS Adapter Test Page</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={checkStatus}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
          >
            Check Adapter Status
          </button>
          
          <button
            onClick={checkHealth}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold ml-4"
          >
            Check Health
          </button>
          
          <button
            onClick={testUpload}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold ml-4"
          >
            Test Upload & Download
          </button>
        </div>

        {/* Status Display */}
        {status.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-lg mb-6">
            <h2 className="text-2xl font-bold mb-4">📊 Adapter Status</h2>
            <div className="space-y-4">
              {status.map((adapter, idx) => (
                <div key={idx} className="bg-gray-700 p-4 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold">{adapter.name}</h3>
                    <span className={`px-3 py-1 rounded ${adapter.isConfigured ? 'bg-green-600' : 'bg-red-600'}`}>
                      {adapter.isConfigured ? '✅ Configured' : '❌ Not Configured'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p>Max File Size: {(adapter.maxFileSize / 1024 / 1024 / 1024).toFixed(2)} GB</p>
                    <p>Free Storage: {adapter.freeStorage}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Health Display */}
        {health.size > 0 && (
          <div className="bg-gray-800 p-6 rounded-lg mb-6">
            <h2 className="text-2xl font-bold mb-4">🏥 Health Check Results</h2>
            <div className="space-y-2">
              {Array.from(health.entries()).map(([name, isHealthy]) => (
                <div key={name} className="flex items-center justify-between bg-gray-700 p-3 rounded">
                  <span className="font-semibold">{name}</span>
                  <span className={isHealthy ? 'text-green-400' : 'text-red-400'}>
                    {isHealthy ? '✅ Healthy' : '❌ Unhealthy'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Result */}
        {testResult && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">🧪 Test Results</h2>
            <pre className="bg-gray-900 p-4 rounded text-sm whitespace-pre-wrap">
              {testResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
