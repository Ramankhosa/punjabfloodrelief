import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'
import { User } from '@prisma/client'

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'default-access-secret-for-development'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-for-development'
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12')

export interface JWTPayload {
  userId: string
  email?: string
  phone?: string
  roles: string[]
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// OTP generation - Fixed OTP for testing
export function generateOTP(): string {
  // Return a fixed OTP for testing purposes
  return '123456'
}

// Get current test OTP
export function getTestOTP(): string {
  return '123456'
}

// JWT token utilities
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '1h' })
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '14d' })
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string }
  } catch (error) {
    return null
  }
}

// Client-side token refresh utility
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      return null
    }

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      // If refresh fails, clear tokens
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      return null
    }

    const data = await response.json()
    localStorage.setItem('accessToken', data.accessToken)
    return data.accessToken
  } catch (error) {
    console.error('Token refresh failed:', error)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    return null
  }
}

// API call wrapper with automatic token refresh
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const accessToken = localStorage.getItem('accessToken')

  // Add authorization header if token exists
  const headers = new Headers(options.headers)
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const requestOptions = {
    ...options,
    headers,
  }

  let response = await fetch(url, requestOptions)

  // If we get a 401 (Unauthorized) and have a refresh token, try to refresh
  if (response.status === 401 && localStorage.getItem('refreshToken')) {
    console.log('Access token expired, attempting refresh...')
    const newToken = await refreshAccessToken()

    if (newToken) {
      // Retry the request with the new token
      headers.set('Authorization', `Bearer ${newToken}`)
      response = await fetch(url, {
        ...options,
        headers,
      })
    }
  }

  return response
}

// Session management
export async function createSession(
  userId: string,
  refreshToken: string,
  deviceFingerprint?: string,
  ip?: string,
  userAgent?: string
): Promise<string> {
  const session = await prisma.session.create({
    data: {
      user_id: userId,
      refresh_token_hash: await hashPassword(refreshToken),
      device_fingerprint: deviceFingerprint,
      ip,
      user_agent: userAgent,
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    },
  })
  return session.session_id
}

export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.session.update({
    where: { session_id: sessionId },
    data: { revoked_at: new Date() },
  })
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { user_id: userId },
    data: { revoked_at: new Date() },
  })
}

// User validation
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' }
  }
  if (password.length > 64) {
    return { valid: false, message: 'Password must be less than 64 characters long' }
  }
  return { valid: true }
}

// Audit logging
export async function logAuthEvent(
  userId: string | null,
  action: string,
  metadata?: Record<string, any>
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actor_user_id: userId,
      action,
      target_type: 'auth',
      metadata,
    },
  })
}
