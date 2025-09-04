import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyRefreshToken, logAuthEvent } from '@/lib/auth'

// Validation schema
const logoutSchema = z.object({
  refreshToken: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = logoutSchema.parse(body)

    const { refreshToken } = validatedData

    // Verify refresh token
    const tokenData = verifyRefreshToken(refreshToken)

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      )
    }

    // Find and revoke the session
    const session = await prisma.session.findFirst({
      where: {
        user_id: tokenData.userId,
        revoked_at: null,
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    if (session) {
      await prisma.session.update({
        where: { session_id: session.session_id },
        data: { revoked_at: new Date() },
      })
    }

    // Log logout event
    await logAuthEvent(tokenData.userId, 'logout', {
      sessionId: session?.session_id,
    })

    return NextResponse.json({
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('Logout error:', error)

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
