import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, JWTPayload } from './auth'

export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload
}

export async function authenticateRequest(
  request: NextRequest
): Promise<{ user: JWTPayload } | { error: NextResponse }> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      error: NextResponse.json(
        { error: 'Authorization header missing or invalid' },
        { status: 401 }
      ),
    }
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix
  const payload = verifyAccessToken(token)

  if (!payload) {
    return {
      error: NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      ),
    }
  }

  return { user: payload }
}

export function requireAuth(
  handler: (request: AuthenticatedRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]) => {
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return authResult.error
    }

    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = authResult.user

    return handler(authenticatedRequest, ...args)
  }
}

export function requireRole(
  roles: string[],
  handler: (request: AuthenticatedRequest, ...args: any[]) => Promise<NextResponse>
) {
  return requireAuth(async (request: AuthenticatedRequest, ...args: any[]) => {
    const userRoles = request.user.roles

    const hasRequiredRole = roles.some(role => userRoles.includes(role))

    if (!hasRequiredRole) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return handler(request, ...args)
  })
}
