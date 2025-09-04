import { NextResponse } from 'next/server'
import { getTestOTP } from '@/lib/auth'

export async function GET() {
  return NextResponse.json({
    testOtp: getTestOTP(),
    message: 'Use this OTP for testing the relief group registration flow'
  })
}
