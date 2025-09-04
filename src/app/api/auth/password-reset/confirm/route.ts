import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword, logAuthEvent } from '@/lib/auth'
import { validatePassword } from '@/lib/utils'

// Validation schema
const confirmSchema = z.object({
  token: z.string().optional(),
  otp: z.string().optional(),
  identifier: z.string().min(1), // email or phone to identify user
  newPassword: z.string().min(8).max(64),
}).refine((data) => data.token || data.otp, {
  message: 'Either token or OTP must be provided',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = confirmSchema.parse(body)

    const { token, otp, identifier, newPassword } = validatedData

    // Validate password strength
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      )
    }

    // Find user by identifier
    let user = null
    if (validateEmail(identifier)) {
      user = await prisma.user.findUnique({ where: { email: identifier } })
    } else {
      const normalizedPhone = identifier.replace(/^\+?91/, '')
      user = await prisma.user.findUnique({ where: { phone_e164: `+91${normalizedPhone}` } })
    }

    if (!user) {
      await logAuthEvent(null, 'password_reset_failed', {
        reason: 'user_not_found',
        identifier,
      })
      return NextResponse.json(
        { error: 'Invalid reset request' },
        { status: 400 }
      )
    }

    // Find valid reset token for this user
    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        user_id: user.user_id,
        expires_at: {
          gt: new Date(),
        },
        used_at: null,
      },
    })

    if (!resetRecord) {
      await logAuthEvent(user.user_id, 'password_reset_failed', {
        reason: 'no_valid_reset_record',
      })
      return NextResponse.json(
        { error: 'No valid reset request found' },
        { status: 400 }
      )
    }

    // Verify token or OTP
    let isValid = false
    if (token) {
      // Email token verification
      isValid = await verifyPassword(token, resetRecord.token_hash)
    } else if (otp) {
      // SMS OTP verification
      isValid = await verifyPassword(otp, resetRecord.token_hash)
    }

    if (!isValid) {
      await logAuthEvent(user.user_id, 'password_reset_failed', {
        reason: 'invalid_token_or_otp',
      })
      return NextResponse.json(
        { error: 'Invalid token or OTP' },
        { status: 400 }
      )
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update user password
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: {
        password_hash: newPasswordHash,
        last_login_at: new Date(),
      },
    })

    // Mark reset token as used
    await prisma.passwordReset.update({
      where: { token_hash: resetRecord.token_hash },
      data: {
        used_at: new Date(),
      },
    })

    // Revoke all existing sessions for security
    await prisma.session.updateMany({
      where: { user_id: user.user_id },
      data: { revoked_at: new Date() },
    })

    // Log successful password reset
    await logAuthEvent(user.user_id, 'password_reset_success', {
      method: user.email ? 'email' : 'phone',
    })

    return NextResponse.json({
      message: 'Password reset successfully. Please log in with your new password.',
    })
  } catch (error) {
    console.error('Password reset confirmation error:', error)

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
