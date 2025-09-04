import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword, logAuthEvent } from '@/lib/auth'
import { formatPhoneNumber, validateEmail, validatePhone } from '@/lib/utils'

// Validation schema
const signupSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(8).max(64),
}).refine((data) => data.email || data.phone, {
  message: 'Either email or phone must be provided',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = signupSchema.parse(body)

    // Validate and normalize contact information
    let primaryLogin: string
    let email: string | null = null
    let phone: string | null = null

    if (validatedData.email) {
      if (!validateEmail(validatedData.email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }
      primaryLogin = validatedData.email
      email = validatedData.email
    } else if (validatedData.phone) {
      const normalizedPhone = formatPhoneNumber(validatedData.phone)
      if (!validatePhone(normalizedPhone)) {
        return NextResponse.json(
          { error: 'Invalid phone format' },
          { status: 400 }
        )
      }
      primaryLogin = normalizedPhone
      phone = normalizedPhone
    } else {
      return NextResponse.json(
        { error: 'Either email or phone must be provided' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { primary_login: primaryLogin },
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone_e164: phone }] : []),
        ],
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email or phone' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password)

    // Create user
    const user = await prisma.user.create({
      data: {
        primary_login: primaryLogin,
        email,
        phone_e164: phone,
        password_hash: passwordHash,
        roles: ['user'],
      },
      select: {
        user_id: true,
        primary_login: true,
        email: true,
        phone_e164: true,
        roles: true,
        created_at: true,
      },
    })

    // Log the signup event
    await logAuthEvent(user.user_id, 'signup', {
      method: email ? 'email' : 'phone',
      contact: primaryLogin,
    })

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          userId: user.user_id,
          primaryLogin: user.primary_login,
          email: user.email,
          phone: user.phone_e164,
          roles: user.roles,
          createdAt: user.created_at,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)

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
