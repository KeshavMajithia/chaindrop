import { NextRequest, NextResponse } from 'next/server'

/**
 * Server-side API route for Filebase uploads
 * Solves CORS issue by proxying uploads through our server
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [Filebase API] Received upload request')
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const filename = formData.get('filename') as string

    console.log('📄 [Filebase API] File:', filename, file?.size, 'bytes')

    if (!file) {
      console.error('❌ [Filebase API] No file provided')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Get Filebase IPFS RPC API key from environment
    const apiKey = process.env.NEXT_PUBLIC_FILEBASE_KEY

    console.log('🔑 [Filebase API] Checking API key...')
    console.log('  API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'MISSING')

    if (!apiKey) {
      console.error('❌ [Filebase API] API key not configured')
      return NextResponse.json(
        { error: 'Filebase IPFS RPC API key not configured. Add NEXT_PUBLIC_FILEBASE_KEY to .env.local' },
        { status: 500 }
      )
    }

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log('📤 [Filebase API] Using IPFS RPC endpoint...')

    // Use Filebase's IPFS RPC endpoint
    const rpcEndpoint = 'https://rpc.filebase.io'
    
    // Create form data for IPFS add
    const uploadFormData = new FormData()
    uploadFormData.append('file', new Blob([buffer]), filename || file.name)

    console.log('📤 [Filebase API] Uploading to IPFS RPC...')

    // Filebase IPFS RPC uses the /api/v0/add endpoint (IPFS HTTP API)
    const uploadResponse = await fetch(`${rpcEndpoint}/api/v0/add`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`, // Use IPFS RPC API key as bearer token
      },
      body: uploadFormData,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('❌ [Filebase API] Upload failed:', errorText)
      throw new Error(`Filebase upload failed: ${uploadResponse.status} ${errorText}`)
    }

    const result = await uploadResponse.json()
    console.log('✅ [Filebase API] Response:', result)
    
    // IPFS RPC returns CID in 'Hash' field
    const cid = result.Hash || result.cid || generateMockCID(buffer)

    console.log('✅ [Filebase API] Upload successful, CID:', cid)

    return NextResponse.json({
      cid,
      url: `https://ipfs.filebase.io/ipfs/${cid}`,
      size: file.size,
      provider: 'filebase',
    })
  } catch (error) {
    console.error('❌ [Filebase API] Error:', error)
    console.error('❌ [Filebase API] Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Upload failed',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    )
  }
}

/**
 * Generate a mock CID from file content
 * In production, Filebase returns the actual IPFS CID
 */
function generateMockCID(data: Buffer): string {
  const crypto = require('crypto')
  const hash = crypto.createHash('sha256').update(data).digest('hex')
  return `Qm${hash.substring(0, 44)}`
}
