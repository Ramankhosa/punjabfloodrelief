import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-middleware'
import { logAuthEvent } from '@/lib/auth'

// Validation schemas
const approveSchema = z.object({
  notes: z.string().optional(),
})

const rejectSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
  notes: z.string().optional(),
})

// Get specific relief group details
async function getReliefGroup(request: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const { groupId } = params

    const group = await prisma.reliefGroup.findUnique({
      where: { group_id: groupId },
      include: {
        created_by_user: {
          select: {
            user_id: true,
            primary_login: true,
            email: true,
            phone_e164: true,
            roles: true,
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
            checksum: true,
            size_bytes: true,
            created_at: true,
          },
        },
        audit_logs: {
          include: {
            actor: {
              select: {
                user_id: true,
                primary_login: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Relief group not found' },
        { status: 404 }
      )
    }

    const formattedGroup = {
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
        roles: group.created_by_user.roles,
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
        checksum: doc.checksum,
        sizeBytes: doc.size_bytes,
        createdAt: doc.created_at,
      })),
      auditLogs: group.audit_logs.map(log => ({
        logId: log.log_id,
        action: log.action,
        targetType: log.target_type,
        targetId: log.target_id,
        metadata: log.metadata,
        createdAt: log.created_at,
        actor: log.actor ? {
          userId: log.actor.user_id,
          primaryLogin: log.actor.primary_login,
        } : null,
      })),
    }

    return NextResponse.json({ group: formattedGroup })
  } catch (error) {
    console.error('Error fetching relief group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Approve a relief group
async function approveReliefGroup(request: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const { groupId } = params
    const body = await request.json()
    const validatedData = approveSchema.parse(body)
    const { notes } = validatedData

    const user = (request as any).user

    // Check if group exists and is in a reviewable state
    const existingGroup = await prisma.reliefGroup.findUnique({
      where: { group_id: groupId },
      include: { created_by_user: true },
    })

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Relief group not found' },
        { status: 404 }
      )
    }

    if (existingGroup.status === 'verified') {
      return NextResponse.json(
        { error: 'Relief group is already approved' },
        { status: 400 }
      )
    }

    if (existingGroup.status === 'rejected') {
      return NextResponse.json(
        { error: 'Cannot approve a rejected relief group' },
        { status: 400 }
      )
    }

    // Update group status
    const updatedGroup = await prisma.reliefGroup.update({
      where: { group_id: groupId },
      data: {
        status: 'verified',
        reviewed_by_user_id: user.userId,
        reviewed_at: new Date(),
        review_notes: notes,
        updated_at: new Date(),
      },
      include: {
        created_by_user: {
          select: { user_id: true, primary_login: true, email: true },
        },
        reviewed_by_user: {
          select: { user_id: true, primary_login: true, email: true },
        },
      },
    })

    // Update user role to include group_rep if not already present
    if (!existingGroup.created_by_user.roles.includes('group_rep')) {
      await prisma.user.update({
        where: { user_id: existingGroup.created_by_user_id },
        data: {
          roles: [...existingGroup.created_by_user.roles, 'group_rep'],
        },
      })
    }

    // Log the approval action
    await logAuthEvent(user.userId, 'relief_group_approved', {
      groupId,
      groupName: updatedGroup.group_name,
      orgType: updatedGroup.org_type,
      reviewedBy: user.userId,
      reviewNotes: notes,
    })

    return NextResponse.json({
      message: 'Relief group approved successfully',
      group: {
        groupId: updatedGroup.group_id,
        groupName: updatedGroup.group_name,
        status: updatedGroup.status,
        reviewedAt: updatedGroup.reviewed_at,
        reviewedBy: {
          userId: updatedGroup.reviewed_by_user?.user_id,
          primaryLogin: updatedGroup.reviewed_by_user?.primary_login,
        },
      },
    })
  } catch (error) {
    console.error('Error approving relief group:', error)

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

// Reject a relief group
async function rejectReliefGroup(request: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const { groupId } = params
    const body = await request.json()
    const validatedData = rejectSchema.parse(body)
    const { reason, notes } = validatedData

    const user = (request as any).user

    // Check if group exists and is in a reviewable state
    const existingGroup = await prisma.reliefGroup.findUnique({
      where: { group_id: groupId },
    })

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Relief group not found' },
        { status: 404 }
      )
    }

    if (existingGroup.status === 'verified') {
      return NextResponse.json(
        { error: 'Cannot reject an already approved relief group' },
        { status: 400 }
      )
    }

    if (existingGroup.status === 'rejected') {
      return NextResponse.json(
        { error: 'Relief group is already rejected' },
        { status: 400 }
      )
    }

    // Update group status
    const updatedGroup = await prisma.reliefGroup.update({
      where: { group_id: groupId },
      data: {
        status: 'rejected',
        reviewed_by_user_id: user.userId,
        reviewed_at: new Date(),
        review_notes: notes ? `${reason}\n\n${notes}` : reason,
        updated_at: new Date(),
      },
      include: {
        reviewed_by_user: {
          select: { user_id: true, primary_login: true, email: true },
        },
      },
    })

    // Log the rejection action
    await logAuthEvent(user.userId, 'relief_group_rejected', {
      groupId,
      groupName: updatedGroup.group_name,
      orgType: updatedGroup.org_type,
      reviewedBy: user.userId,
      rejectionReason: reason,
      reviewNotes: notes,
    })

    return NextResponse.json({
      message: 'Relief group rejected successfully',
      group: {
        groupId: updatedGroup.group_id,
        groupName: updatedGroup.group_name,
        status: updatedGroup.status,
        reviewedAt: updatedGroup.reviewed_at,
        reviewedBy: {
          userId: updatedGroup.reviewed_by_user?.user_id,
          primaryLogin: updatedGroup.reviewed_by_user?.primary_login,
        },
        rejectionReason: reason,
      },
    })
  } catch (error) {
    console.error('Error rejecting relief group:', error)

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
export const GET = requireRole(['admin', 'group_approver'], getReliefGroup)

export const PATCH = requireRole(['admin', 'group_approver'], async (request: NextRequest, context: { params: { groupId: string } }) => {
  const url = new URL(request.url)
  const action = url.searchParams.get('action')

  switch (action) {
    case 'approve':
      return approveReliefGroup(request, context)
    case 'reject':
      return rejectReliefGroup(request, context)
    default:
      return NextResponse.json(
        { error: 'Invalid action. Use ?action=approve or ?action=reject' },
        { status: 400 }
      )
  }
})
