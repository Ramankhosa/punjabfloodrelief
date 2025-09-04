import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { msg91Service } from '@/lib/msg91'
import { generateOTP } from '@/lib/auth'

// Validation schema
const testSmsSchema = z.object({
  phoneNumber: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = testSmsSchema.parse(body)

    const { phoneNumber } = validatedData

    // Generate test OTP
    const testOTP = generateOTP()

    // Send test SMS
    const result = await msg91Service.sendOTP(phoneNumber, testOTP)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test SMS sent successfully',
        otp: testOTP, // Only for testing - remove in production
      })
    } else {
      return NextResponse.json({
        success: false,
        message: result.message,
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Test SMS error:', error)

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
