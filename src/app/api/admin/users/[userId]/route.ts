import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-middleware'
import { logAuthEvent } from '@/lib/auth'

// Validation schemas
const updateRolesSchema = z.object({
  roles: z.array(z.string()).min(1, 'At least one role is required'),
  reason: z.string().min(1, 'Reason for role change is required'),
})

// Get user details
async function getUser(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params

    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        primary_login: true,
        email: true,
        phone_e164: true,
        roles: true,
        phone_verified_at: true,
        created_at: true,
        last_login_at: true,
        is_active: true,
        _count: {
          select: {
            relief_groups: true,
            reviewed_groups: true,
            password_resets: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update user roles
async function updateUserRoles(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params
    const body = await request.json()
    const validatedData = updateRolesSchema.parse(body)
    const { roles, reason } = validatedData

    const adminUser = (request as any).user

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        primary_login: true,
        email: true,
        roles: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent admin from removing their own admin role
    if (userId === adminUser.userId && !roles.includes('admin')) {
      return NextResponse.json(
        { error: 'Cannot remove admin role from yourself' },
        { status: 400 }
      )
    }

    // Prevent non-admin users from granting admin role
    if (roles.includes('admin') && !adminUser.roles.includes('admin')) {
      return NextResponse.json(
        { error: 'Only admins can grant admin role' },
        { status: 403 }
      )
    }

    // Update user roles
    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: {
        roles,
        last_login_at: new Date(), // Update last activity
      },
      select: {
        user_id: true,
        primary_login: true,
        email: true,
        roles: true,
        updated_at: true,
      },
    })

    // Log the role change action
    await logAuthEvent(adminUser.userId, 'user_roles_updated', {
      targetUserId: userId,
      targetUserLogin: targetUser.primary_login,
      oldRoles: targetUser.roles,
      newRoles: roles,
      reason,
    })

    return NextResponse.json({
      message: 'User roles updated successfully',
      user: updatedUser,
      changes: {
        oldRoles: targetUser.roles,
        newRoles: roles,
        reason,
      },
    })
  } catch (error) {
    console.error('Error updating user roles:', error)

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

// Export handlers with role requirements
export const GET = requireRole(['admin'], getUser)
export const PATCH = requireRole(['admin'], updateUserRoles)
