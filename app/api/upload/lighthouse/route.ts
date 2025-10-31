import { NextRequest, NextResponse } from 'next/server'

/**
 * Lighthouse.storage Upload API Route
 * Handles file uploads to Lighthouse IPFS storage
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [Lighthouse API] Received upload request')

    // Get API key from environment
    const apiKey = process.env.LIGHTHOUSE_API_KEY
    if (!apiKey) {
      console.error('❌ [Lighthouse API] API key not configured')
      return NextResponse.json(
        { error: 'Lighthouse API key not configured' },
        { status: 500 }
      )
    }

    console.log('🔑 [Lighthouse API] API Key:', apiKey.substring(0, 8) + '...')

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log(`📄 [Lighthouse API] File: ${file.name} ${file.size} bytes`)

    // Upload to Lighthouse
    console.log('📤 [Lighthouse API] Uploading to Lighthouse...')
    
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)

    const uploadResponse = await fetch('https://upload.lighthouse.storage/api/v0/add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: uploadFormData,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('❌ [Lighthouse API] Upload failed:', uploadResponse.status, errorText)
      return NextResponse.json(
        { error: `Lighthouse upload failed: ${uploadResponse.statusText}` },
        { status: uploadResponse.status }
      )
    }

    const result = await uploadResponse.json()
    console.log('✅ [Lighthouse API] Response:', result)

    // Lighthouse returns: { Name: "file.txt", Hash: "Qm...", Size: "12345" }
    const cid = result.Hash

    if (!cid) {
      console.error('❌ [Lighthouse API] No CID in response')
      return NextResponse.json(
        { error: 'No CID returned from Lighthouse' },
        { status: 500 }
      )
    }

    console.log(`✅ [Lighthouse API] Upload successful, CID: ${cid}`)

    return NextResponse.json({
      success: true,
      cid,
      size: parseInt(result.Size || '0'),
      name: result.Name,
    })

  } catch (error) {
    console.error('❌ [Lighthouse API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
