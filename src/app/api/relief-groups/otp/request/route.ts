import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword, logAuthEvent, generateOTP } from '@/lib/auth'
import { formatPhoneNumber, validatePhone } from '@/lib/utils'
import { msg91Service } from '@/lib/msg91'

// Validation schema
const requestSchema = z.object({
  repPhone: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = requestSchema.parse(body)

    const { repPhone } = validatedData

    // Normalize and validate phone number
    const normalizedPhone = formatPhoneNumber(repPhone)
    if (!validatePhone(normalizedPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // Check rate limits (3/min, 10/day)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const recentRequests = await prisma.oTPRequest.count({
      where: {
        phone_e164: normalizedPhone,
        created_at: {
          gte: oneMinuteAgo,
        },
      },
    })

    const dailyRequests = await prisma.oTPRequest.count({
      where: {
        phone_e164: normalizedPhone,
        created_at: {
          gte: oneDayAgo,
        },
      },
    })

    if (recentRequests >= 3) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before trying again.' },
        { status: 429 }
      )
    }

    if (dailyRequests >= 10) {
      return NextResponse.json(
        { error: 'Daily limit exceeded. Please try again tomorrow.' },
        { status: 429 }
      )
    }

    // Generate OTP
    const otp = generateOTP()
    const otpHash = await hashPassword(otp)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Save OTP request
    await prisma.oTPRequest.create({
      data: {
        phone_e164: normalizedPhone,
        otp_hash: otpHash,
        channel: 'sms', // Default to SMS, fallback to voice
        expires_at: expiresAt,
      },
    })

    // For testing: Skip SMS sending and return success
    console.log(`OTP for ${normalizedPhone}: ${otp}`)

    // Log OTP request
    await logAuthEvent(null, 'relief_group_otp_requested', {
      phone: normalizedPhone,
      channel: 'test',
      otp: otp, // Include OTP in logs for testing
    })

    return NextResponse.json({
      status: 'sent',
      channel: 'test',
      message: `OTP sent successfully. Use: ${otp}`,
      testOtp: otp, // Include OTP in response for testing
    })
  } catch (error) {
    console.error('OTP request error:', error)

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
