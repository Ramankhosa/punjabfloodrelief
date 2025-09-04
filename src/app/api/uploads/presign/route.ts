import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-middleware'
import crypto from 'crypto'

// Validation schema
const presignSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().regex(/^image\/(jpeg|png)|application\/pdf$/),
  scope: z.enum(['group-doc']),
})

async function generatePresignedUrl(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = presignSchema.parse(body)

    const { fileName, contentType, scope } = validatedData

    // Generate unique file key
    const fileExtension = fileName.split('.').pop()?.toLowerCase()
    const timestamp = Date.now()
    const randomId = crypto.randomBytes(8).toString('hex')
    const fileKey = `${scope}/${timestamp}_${randomId}.${fileExtension}`

    // Generate upload URL for our local upload handler
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const uploadUrl = `${baseUrl}/api/uploads/${fileKey}`
    const fileUrl = `${baseUrl}/uploads/${fileKey}` // Local file URL

    // TODO: Generate actual presigned URL for cloud storage
    // const { uploadUrl, fileUrl } = await generateS3PresignedUrl(fileKey, contentType)

    return NextResponse.json({
      uploadUrl,
      fileUrl,
      maxBytes: 300 * 1024, // 300KB limit
      contentType,
      expiresIn: 3600, // 1 hour
    })
  } catch (error) {
    console.error('Presigned URL generation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = requireAuth(generatePresignedUrl)
