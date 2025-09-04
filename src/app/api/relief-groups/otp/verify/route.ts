import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyPassword, logAuthEvent } from '@/lib/auth'
import { formatPhoneNumber, validatePhone } from '@/lib/utils'
import jwt from 'jsonwebtoken'

// Validation schema
const verifySchema = z.object({
  repPhone: z.string().min(1),
  code: z.string().length(6),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = verifySchema.parse(body)

    const { repPhone, code } = validatedData

    // Normalize and validate phone number
    const normalizedPhone = formatPhoneNumber(repPhone)
    if (!validatePhone(normalizedPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // Find valid OTP request
    const otpRequest = await prisma.oTPRequest.findFirst({
      where: {
        phone_e164: normalizedPhone,
        expires_at: {
          gt: new Date(),
        },
        used_at: null,
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    if (!otpRequest) {
      await logAuthEvent(null, 'relief_group_otp_failed', {
        phone: normalizedPhone,
        reason: 'no_valid_otp',
      })
      return NextResponse.json(
        { error: 'No valid OTP found. Please request a new one.' },
        { status: 400 }
      )
    }

    // Verify OTP code
    const isValidOTP = await verifyPassword(code, otpRequest.otp_hash)
    if (!isValidOTP) {
      await logAuthEvent(null, 'relief_group_otp_failed', {
        phone: normalizedPhone,
        reason: 'invalid_code',
      })
      return NextResponse.json(
        { error: 'Invalid OTP code' },
        { status: 400 }
      )
    }

    // Mark OTP as used
    await prisma.oTPRequest.update({
      where: { id: otpRequest.id },
      data: {
        used_at: new Date(),
      },
    })

    // Generate short-lived OTP token for group registration
    const otpToken = jwt.sign(
      {
        phone: normalizedPhone,
        verified: true,
        purpose: 'relief_group_registration',
      },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '15m' }
    )

    // Log successful verification
    await logAuthEvent(null, 'relief_group_otp_verified', {
      phone: normalizedPhone,
    })

    return NextResponse.json({
      otpToken,
      message: 'OTP verified successfully',
    })
  } catch (error) {
    console.error('OTP verification error:', error)

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
