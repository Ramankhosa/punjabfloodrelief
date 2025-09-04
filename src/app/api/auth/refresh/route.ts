import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyRefreshToken, generateAccessToken, logAuthEvent } from '@/lib/auth'

// Validation schema
const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = refreshSchema.parse(body)

    const { refreshToken } = validatedData

    // Verify refresh token
    const tokenData = verifyRefreshToken(refreshToken)

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      )
    }

    // Find active session
    const session = await prisma.session.findFirst({
      where: {
        user_id: tokenData.userId,
        revoked_at: null,
        expires_at: {
          gt: new Date(),
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session expired or invalid' },
        { status: 401 }
      )
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { user_id: tokenData.userId },
      select: {
        user_id: true,
        primary_login: true,
        email: true,
        phone_e164: true,
        roles: true,
        is_active: true,
      },
    })

    if (!user || !user.is_active) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      )
    }

    // Generate new access token
    const jwtPayload = {
      userId: user.user_id,
      email: user.email,
      phone: user.phone_e164,
      roles: user.roles,
    }

    const newAccessToken = generateAccessToken(jwtPayload)

    // Log token refresh
    await logAuthEvent(user.user_id, 'token_refresh', {
      sessionId: session.session_id,
    })

    return NextResponse.json({
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
    })
  } catch (error) {
    console.error('Token refresh error:', error)

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
