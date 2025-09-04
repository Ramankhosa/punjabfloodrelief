import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect()

    // Test OTP requests table
    const otpCount = await prisma.oTPRequest.count()
    const userCount = await prisma.user.count()

    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      data: {
        otpRequestsCount: otpCount,
        usersCount: userCount,
      }
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
