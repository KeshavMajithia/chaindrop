import { NextRequest, NextResponse } from 'next/server'

/**
 * Server-side API route for Apillon uploads
 * Solves CORS issue by proxying uploads through our server
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const filename = formData.get('filename') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Get Apillon credentials from environment (try both server-side and client-side vars)
    const apiKey = process.env.APILLON_API_KEY || process.env.NEXT_PUBLIC_APILLON_API_KEY
    const apiSecret = process.env.APILLON_API_SECRET || process.env.NEXT_PUBLIC_APILLON_API_SECRET
    const bucketUuid = process.env.APILLON_BUCKET_UUID || process.env.NEXT_PUBLIC_APILLON_BUCKET_UUID

    console.log('🔑 [Apillon API] Checking credentials...')
    console.log('  API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'MISSING')
    console.log('  API Secret:', apiSecret ? `${apiSecret.substring(0, 8)}...` : 'MISSING')
    console.log('  Bucket UUID:', bucketUuid ? `${bucketUuid.substring(0, 8)}...` : 'MISSING')

    if (!apiKey || !apiSecret || !bucketUuid) {
      console.error('❌ [Apillon API] Missing credentials')
      return NextResponse.json(
        { 
          error: 'Apillon credentials not configured',
          details: 'Add APILLON_API_KEY, APILLON_API_SECRET, and APILLON_BUCKET_UUID to .env.local'
        },
        { status: 500 }
      )
    }

    const apiEndpoint = 'https://api.apillon.io'

    console.log('📤 [Apillon API] Starting upload for:', filename || file.name)

    // Step 1: Request upload session
    console.log('📋 [Apillon API] Step 1: Requesting upload session...')
    
    // Apillon uses Basic Auth with API Key and Secret
    const authString = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
    
    const requestHeaders = {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json',
    }
    
    const requestBody = {
      files: [
        {
          fileName: filename || file.name,
          contentType: file.type || 'application/octet-stream',
        },
      ],
    }
    
    console.log('🔍 [Apillon API] Request details:')
    console.log('  URL:', `${apiEndpoint}/storage/buckets/${bucketUuid}/upload`)
    console.log('  Headers:', JSON.stringify(requestHeaders, null, 2))
    console.log('  Body:', JSON.stringify(requestBody, null, 2))
    
    const sessionResponse = await fetch(`${apiEndpoint}/storage/buckets/${bucketUuid}/upload`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(requestBody),
    })

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text()
      console.error('❌ [Apillon API] Session request failed!')
      console.error('  Status:', sessionResponse.status)
      console.error('  Status Text:', sessionResponse.statusText)
      console.error('  Response:', errorText)
      return NextResponse.json(
        { 
          error: 'Failed to request upload session',
          status: sessionResponse.status,
          details: errorText
        },
        { status: 500 }
      )
    }

    const sessionData = await sessionResponse.json()
    console.log('📦 [Apillon API] Session response:', JSON.stringify(sessionData, null, 2))
    
    const uploadUrl = sessionData.data?.files?.[0]?.url
    const sessionUuid = sessionData.data?.sessionUuid

    if (!uploadUrl || !sessionUuid) {
      console.error('❌ [Apillon API] Invalid session response structure')
      console.error('  Expected: data.files[0].url and data.sessionUuid')
      console.error('  Got:', JSON.stringify(sessionData, null, 2))
      return NextResponse.json(
        { 
          error: 'Invalid session response from Apillon',
          details: 'Missing uploadUrl or sessionUuid',
          response: sessionData
        },
        { status: 500 }
      )
    }

    console.log('✅ [Apillon API] Session created:', sessionUuid)

    // Step 2: Upload file to the provided URL
    console.log('📤 [Apillon API] Step 2: Uploading file...')
    const arrayBuffer = await file.arrayBuffer()
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: arrayBuffer,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('❌ [Apillon API] File upload failed!')
      console.error('  Status:', uploadResponse.status)
      console.error('  Response:', errorText)
      return NextResponse.json(
        { 
          error: 'File upload failed',
          status: uploadResponse.status,
          details: errorText
        },
        { status: 500 }
      )
    }

    console.log('✅ [Apillon API] File uploaded')

    // Step 3: Finalize the session
    console.log('🔒 [Apillon API] Step 3: Finalizing session...')
    const finalizeResponse = await fetch(`${apiEndpoint}/storage/buckets/${bucketUuid}/upload/${sessionUuid}/end`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
    })

    if (!finalizeResponse.ok) {
      const errorText = await finalizeResponse.text()
      console.error('❌ [Apillon API] Finalize failed!')
      console.error('  Status:', finalizeResponse.status)
      console.error('  Response:', errorText)
      return NextResponse.json(
        { 
          error: 'Failed to finalize upload',
          status: finalizeResponse.status,
          details: errorText
        },
        { status: 500 }
      )
    }

    const finalizeData = await finalizeResponse.json()
    console.log('✅ [Apillon API] Session finalized')

    // Step 4: Quick check for CID (Apillon processes files asynchronously)
    // Note: Apillon can take 1-5 minutes to process files to IPFS
    console.log('📋 [Apillon API] Step 4: Checking for CID...')
    
    let cid = 'pending'
    let cidv1 = null
    const fileUuid = sessionData.data?.files?.[0]?.fileUuid
    
    // Do a quick check (3 attempts, 3 seconds each = 9 seconds max)
    const maxPolls = 3
    const pollInterval = 3000
    
    for (let i = 0; i < maxPolls; i++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval))
      
      // Query by sessionUuid to get all files in this session
      const fileInfoResponse = await fetch(`${apiEndpoint}/storage/buckets/${bucketUuid}/files?sessionUuid=${sessionUuid}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authString}`,
        },
      })
      
      if (fileInfoResponse.ok) {
        const fileInfo = await fileInfoResponse.json()
        
        // Find the specific file by fileUuid
        const fileData = fileInfo.data?.items?.find((item: any) => item.fileUuid === fileUuid)
        
        if (fileData) {
          const retrievedCid = fileData.CID || fileData.cid
          cidv1 = fileData.CIDv1 || fileData.cidv1
          const fileStatus = fileData.fileStatus
          
          console.log(`📦 [Apillon API] File ${fileUuid.substring(0, 8)}... status: ${fileStatus}, CID: ${retrievedCid || 'null'}, CIDv1: ${cidv1 || 'null'}`)
          
          // Use CIDv1 if available (Apillon prefers CIDv1)
          if (cidv1 && cidv1 !== null) {
            cid = cidv1
            console.log(`✅ [Apillon API] CIDv1 retrieved for ${filename}:`, cid)
            break
          } else if (retrievedCid && retrievedCid !== 'pending' && retrievedCid !== null) {
            cid = retrievedCid
            console.log(`✅ [Apillon API] CID retrieved for ${filename}:`, cid)
            break
          }
        } else {
          console.log(`⏳ [Apillon API] File ${fileUuid.substring(0, 8)}... not found in session yet`)
        }
      }
    }
    
    if (cid === 'pending') {
      console.warn('⚠️ [Apillon API] CID not ready yet - Apillon is still processing (this is normal, can take 1-5 minutes)')
      console.warn('💡 [Apillon API] File uploaded successfully, CID will be available later')
    }

    return NextResponse.json({
      cid,
      url: cid !== 'pending' ? `https://ipfs.apillon.io/ipfs/${cid}` : 'pending',
      size: file.size,
      provider: 'apillon',
      sessionUuid,
      fileUuid,
      status: cid !== 'pending' ? 'ready' : 'processing',
    })
  } catch (error) {
    console.error('❌ [Apillon API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
