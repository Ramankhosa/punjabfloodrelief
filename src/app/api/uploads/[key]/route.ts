import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import fs from 'fs'
import path from 'path'

async function handleUpload(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const { key } = params

    // Validate file key format (should be scope/timestamp_randomId.extension)
    if (!key || !key.match(/^group-doc\/\d+_[a-f0-9]+\.(jpg|jpeg|png|pdf)$/i)) {
      return NextResponse.json(
        { error: 'Invalid file key format' },
        { status: 400 }
      )
    }

    // Get the uploaded file
    const arrayBuffer = await request.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    // Save file to public/uploads directory
    const filePath = path.join(uploadsDir, key)
    fs.writeFileSync(filePath, buffer)

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      filePath: `/uploads/${key}`
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

export const PUT = requireAuth(handleUpload)
