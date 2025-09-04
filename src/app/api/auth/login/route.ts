import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  createSession,
  logAuthEvent
} from '@/lib/auth'
import { formatPhoneNumber, validateEmail, validatePhone } from '@/lib/utils'

// Validation schema
const loginSchema = z.object({
  identifier: z.string().min(1), // email or phone
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    const { identifier, password } = validatedData

    // Normalize identifier
    let searchCriteria: any = {}
    let contactType = 'unknown'

    // Check if identifier is email or phone
    if (validateEmail(identifier)) {
      searchCriteria.email = identifier
      contactType = 'email'
    } else {
      // Try to normalize as phone
      const normalizedPhone = formatPhoneNumber(identifier)
      if (validatePhone(normalizedPhone)) {
        searchCriteria.phone_e164 = normalizedPhone
        contactType = 'phone'
      } else {
        // Search by primary_login
        searchCriteria.primary_login = identifier
      }
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: searchCriteria,
    })

    if (!user) {
      // Log failed login attempt
      await logAuthEvent(null, 'login_failed', {
        identifier,
        reason: 'user_not_found',
      })

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.is_active) {
      await logAuthEvent(user.user_id, 'login_failed', {
        reason: 'account_inactive',
      })

      return NextResponse.json(
        { error: 'Account is inactive' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash)

    if (!isValidPassword) {
      // Log failed login attempt
      await logAuthEvent(user.user_id, 'login_failed', {
        reason: 'invalid_password',
      })

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate tokens
    const jwtPayload = {
      userId: user.user_id,
      email: user.email,
      phone: user.phone_e164,
      roles: user.roles,
    }

    const accessToken = generateAccessToken(jwtPayload)
    const refreshToken = generateRefreshToken(user.user_id)

    // Create session
    const sessionId = await createSession(
      user.user_id,
      refreshToken,
      request.headers.get('user-agent') || undefined,
      request.ip || undefined,
      request.headers.get('user-agent') || undefined
    )

    // Update last login
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { last_login_at: new Date() },
    })

    // Log successful login
    await logAuthEvent(user.user_id, 'login_success', {
      method: contactType,
      sessionId,
    })

    return NextResponse.json({
      message: 'Login successful',
      tokens: {
        accessToken,
        refreshToken,
      },
      user: {
        userId: user.user_id,
        primaryLogin: user.primary_login,
        email: user.email,
        phone: user.phone_e164,
        roles: user.roles,
        lastLoginAt: user.last_login_at,
      },
    })
  } catch (error) {
    console.error('Login error:', error)

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
