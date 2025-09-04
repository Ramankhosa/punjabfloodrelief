import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword, logAuthEvent, generateOTP } from '@/lib/auth'
import { validateEmail, validatePhone, formatPhoneNumber } from '@/lib/utils'
import { msg91Service } from '@/lib/msg91'
import crypto from 'crypto'

// Validation schema
const requestSchema = z.object({
  identifier: z.string().min(1), // email or phone
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = requestSchema.parse(body)

    const { identifier } = validatedData

    // Find user by identifier
    let user = null
    let contactMethod = 'unknown'

    // Check if identifier is email or phone
    if (validateEmail(identifier)) {
      user = await prisma.user.findUnique({ where: { email: identifier } })
      contactMethod = 'email'
    } else {
      // Try to normalize as phone
      const normalizedPhone = formatPhoneNumber(identifier)
      if (validatePhone(normalizedPhone)) {
        user = await prisma.user.findUnique({ where: { phone_e164: normalizedPhone } })
        contactMethod = 'phone'
      } else {
        // Search by primary_login
        user = await prisma.user.findUnique({ where: { primary_login: identifier } })
      }
    }

    // Always return success to prevent user enumeration
    // But only send reset email/SMS if user exists
    if (!user) {
      await logAuthEvent(null, 'password_reset_request_failed', {
        identifier,
        reason: 'user_not_found',
      })
      return NextResponse.json({
        message: 'If an account exists, a password reset link has been sent.',
      })
    }

    // Check if user is active
    if (!user.is_active) {
      await logAuthEvent(user.user_id, 'password_reset_request_failed', {
        reason: 'account_inactive',
      })
      return NextResponse.json({
        message: 'If an account exists, a password reset link has been sent.',
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = await hashPassword(resetToken)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    // Save reset token
    await prisma.passwordReset.create({
      data: {
        user_id: user.user_id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    })

    // Send reset link via email or SMS
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`

    if (contactMethod === 'email' && user.email) {
      // TODO: Send email with reset link
      console.log(`Password reset email sent to ${user.email}: ${resetUrl}`)

      // For now, log the reset link (replace with actual email sending)
      await logAuthEvent(user.user_id, 'password_reset_email_sent', {
        email: user.email,
      })
    } else if (contactMethod === 'phone' && user.phone_e164) {
      // Send OTP via MSG91 SMS for password reset
      const otp = generateOTP()
      const otpHash = await hashPassword(otp)

      // Update the reset token to include OTP for SMS
      await prisma.passwordReset.update({
        where: { token_hash: tokenHash },
        data: { token_hash: otpHash }, // Use OTP as the token for SMS
      })

      const smsResult = await msg91Service.sendOTP(user.phone_e164, otp)

      if (!smsResult.success) {
        console.error('Failed to send password reset SMS:', smsResult.message)
        // Still return success to prevent user enumeration
      } else {
        console.log(`Password reset OTP sent to ${user.phone_e164}: ${otp}`)
      }

      await logAuthEvent(user.user_id, 'password_reset_sms_sent', {
        phone: user.phone_e164,
        success: smsResult.success,
      })
    }

    await logAuthEvent(user.user_id, 'password_reset_requested', {
      method: contactMethod,
    })

    return NextResponse.json({
      message: 'If an account exists, a password reset link has been sent.',
    })
  } catch (error) {
    console.error('Password reset request error:', error)

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
