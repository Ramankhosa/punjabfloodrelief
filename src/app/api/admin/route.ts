import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-middleware'
import { logAuthEvent } from '@/lib/auth'

// Validation schemas
const getGroupsQuerySchema = z.object({
  status: z.enum(['submitted', 'pending_review', 'verified', 'rejected', 'needs_more_info']).optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0),
})

const getUsersQuerySchema = z.object({
  role: z.string().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0),
})

// Get admin dashboard stats
async function getAdminStats(request: NextRequest) {
  try {
    const [
      totalGroups,
      pendingGroups,
      approvedGroups,
      rejectedGroups,
      totalUsers,
      adminUsers,
    ] = await Promise.all([
      prisma.reliefGroup.count(),
      prisma.reliefGroup.count({ where: { status: { in: ['submitted', 'pending_review'] } } }),
      prisma.reliefGroup.count({ where: { status: 'verified' } }),
      prisma.reliefGroup.count({ where: { status: 'rejected' } }),
      prisma.user.count(),
      prisma.user.count({ where: { roles: { has: 'admin' } } }),
    ])

    return NextResponse.json({
      stats: {
        totalGroups,
        pendingGroups,
        approvedGroups,
        rejectedGroups,
        totalUsers,
        adminUsers,
      },
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get all relief groups for admin review
async function getAllReliefGroups(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const validatedQuery = getGroupsQuerySchema.parse(queryParams)

    const { status, limit, offset } = validatedQuery

    const where = status ? { status } : {}

    const [groups, total] = await Promise.all([
      prisma.reliefGroup.findMany({
        where,
        include: {
          created_by_user: {
            select: {
              user_id: true,
              primary_login: true,
              email: true,
              phone_e164: true,
            },
          },
          reviewed_by_user: {
            select: {
              user_id: true,
              primary_login: true,
              email: true,
              phone_e164: true,
            },
          },
          home_district: {
            select: { district_name: true },
          },
          home_tehsil: {
            select: { tehsil_name: true },
          },
          home_village: {
            select: { village_name: true },
          },
          representatives: {
            select: {
              rep_name: true,
              rep_phone_e164: true,
              otp_verified_at: true,
            },
          },
          documents: {
            select: {
              doc_id: true,
              type: true,
              file_url: true,
            },
          },
          _count: {
            select: { documents: true },
          },
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.reliefGroup.count({ where }),
    ])

    const formattedGroups = groups.map(group => ({
      groupId: group.group_id,
      groupName: group.group_name,
      orgType: group.org_type,
      status: group.status,
      registrationNumber: group.registration_number,
      createdAt: group.created_at,
      updatedAt: group.updated_at,
      reviewedAt: group.reviewed_at,
      reviewNotes: group.review_notes,
      homeLocation: {
        district: group.home_district?.district_name,
        tehsil: group.home_tehsil?.tehsil_name,
        village: group.home_village?.village_name,
        lat: group.home_lat,
        lon: group.home_lon,
      },
      contactInfo: {
        email: group.contact_email,
        phone: group.contact_phone_e164,
      },
      intendedOperations: group.intended_operations,
      serviceArea: group.service_area,
      createdBy: {
        userId: group.created_by_user.user_id,
        primaryLogin: group.created_by_user.primary_login,
        email: group.created_by_user.email,
        phone: group.created_by_user.phone_e164,
      },
      reviewedBy: group.reviewed_by_user ? {
        userId: group.reviewed_by_user.user_id,
        primaryLogin: group.reviewed_by_user.primary_login,
        email: group.reviewed_by_user.email,
        phone: group.reviewed_by_user.phone_e164,
      } : null,
      representative: group.representatives[0] ? {
        name: group.representatives[0].rep_name,
        phone: group.representatives[0].rep_phone_e164,
        verified: !!group.representatives[0].otp_verified_at,
      } : null,
      documents: group.documents.map(doc => ({
        docId: doc.doc_id,
        type: doc.type,
        fileUrl: doc.file_url,
      })),
      documentCount: group._count.documents,
    }))

    return NextResponse.json({
      groups: formattedGroups,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching relief groups:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get all users for admin management
async function getAllUsers(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const validatedQuery = getUsersQuerySchema.parse(queryParams)

    const { role, limit, offset } = validatedQuery

    const where = role ? { roles: { has: role } } : {}

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
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
export const GET = requireRole(['admin', 'group_approver'], async (request: NextRequest) => {
  const url = new URL(request.url)
  const path = url.pathname

  // Route to appropriate handler based on query parameters
  if (url.searchParams.has('stats')) {
    return getAdminStats(request)
  } else if (url.searchParams.has('users') || path.includes('/users')) {
    return getAllUsers(request)
  } else {
    return getAllReliefGroups(request)
  }
})
