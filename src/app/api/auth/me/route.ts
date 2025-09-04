import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header missing or invalid' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    const payload = verifyAccessToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Fetch current user data from database to ensure it's up to date
    const user = await prisma.user.findUnique({
      where: { user_id: payload.userId },
      select: {
        user_id: true,
        primary_login: true,
        email: true,
        phone_e164: true,
        roles: true,
        phone_verified_at: true,
        created_at: true,
        last_login_at: true,
        is_active: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is inactive' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        userId: user.user_id,
        primaryLogin: user.primary_login,
        email: user.email,
        phone: user.phone_e164,
        roles: user.roles,
        phoneVerified: !!user.phone_verified_at,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at,
        isActive: user.is_active,
      },
    })
  } catch (error) {
    console.error('Error fetching user data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
