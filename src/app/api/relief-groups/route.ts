import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { logAuthEvent } from '@/lib/auth'
import { requireAuth } from '@/lib/auth-middleware'
import jwt from 'jsonwebtoken'

// Validation schemas
const orgTypeSchema = z.enum(['government', 'ngo', 'independent'])
const groupStatusSchema = z.enum(['submitted', 'pending_review', 'verified', 'rejected', 'needs_more_info'])

const registerSchema = z.object({
  otpToken: z.string(),
  groupName: z.string().min(2).max(120),
  orgType: orgTypeSchema,
  registrationNumber: z.string().optional(),
  homeDistrictCode: z.string().optional(),
  homeTehsilCode: z.string().optional(),
  homeLat: z.number().optional(),
  homeLon: z.number().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string(),
  intendedOperations: z.array(z.string()),
  serviceArea: z.array(z.string()).optional(), // Array of district/tehsil codes
  repName: z.string().min(2),
  repPhone: z.string(),
  docUrls: z.array(z.string()).optional(), // Array of uploaded document URLs
})

async function registerReliefGroup(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    const {
      otpToken,
      groupName,
      orgType,
      registrationNumber,
      homeDistrictCode,
      homeTehsilCode,
      homeLat,
      homeLon,
      contactEmail,
      contactPhone,
      intendedOperations,
      serviceArea,
      repName,
      repPhone,
      docUrls,
    } = validatedData

    // Get user from auth middleware
    const user = (request as any).user

    // Verify OTP token
    try {
      const otpData = jwt.verify(otpToken, process.env.JWT_ACCESS_SECRET!) as any

      if (otpData.purpose !== 'relief_group_registration' || !otpData.verified) {
        return NextResponse.json(
          { error: 'Invalid OTP token' },
          { status: 400 }
        )
      }

      // Ensure the phone matches
      if (otpData.phone !== repPhone) {
        return NextResponse.json(
          { error: 'OTP phone does not match representative phone' },
          { status: 400 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP token' },
        { status: 400 }
      )
    }

    // Check if user already has a relief group
    const existingGroup = await prisma.reliefGroup.findFirst({
      where: { created_by_user_id: user.userId },
    })

    if (existingGroup) {
      return NextResponse.json(
        { error: 'User already has a registered relief group' },
        { status: 409 }
      )
    }

    // Start transaction for group and representative creation
    const result = await prisma.$transaction(async (tx) => {
      // Create relief group
      const group = await tx.reliefGroup.create({
        data: {
          group_name: groupName,
          org_type: orgType,
          registration_number: registrationNumber,
          home_district_code: homeDistrictCode,
          home_tehsil_code: homeTehsilCode,
          home_lat: homeLat,
          home_lon: homeLon,
          contact_email: contactEmail,
          contact_phone_e164: contactPhone,
          intended_operations: intendedOperations,
          service_area: serviceArea ? JSON.stringify(serviceArea) : null,
          status: 'submitted',
          created_by_user_id: user.userId,
        },
      })

      // Create group representative
      const representative = await tx.groupRepresentative.create({
        data: {
          group_id: group.group_id,
          user_id: user.userId,
          rep_name: repName,
          rep_phone_e164: repPhone,
          otp_verified_at: new Date(),
        },
      })

      // Create document records if URLs provided
      if (docUrls && docUrls.length > 0) {
        const documents = docUrls.map((url, index) => ({
          group_id: group.group_id,
          user_id: user.userId,
          type: index === 0 ? 'rep_id' : 'org_cert',
          file_url: url,
          checksum: '', // TODO: Calculate checksum
          size_bytes: 0, // TODO: Get file size
        }))

        await tx.document.createMany({
          data: documents,
        })
      }

      return { group, representative }
    })

    // Update user role to include group_rep
    await prisma.user.update({
      where: { user_id: user.userId },
      data: {
        roles: [...user.roles, 'group_rep'],
      },
    })

    // Log successful registration
    await logAuthEvent(user.userId, 'relief_group_registered', {
      groupId: result.group.group_id,
      orgType,
      operations: intendedOperations,
    })

    return NextResponse.json({
      message: 'Relief group registered successfully',
      group: {
        groupId: result.group.group_id,
        groupName: result.group.group_name,
        orgType: result.group.org_type,
        status: result.group.status,
        createdAt: result.group.created_at,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Relief group registration error:', error)

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

async function getUserReliefGroups(request: NextRequest) {
  try {
    const user = (request as any).user

    const groups = await prisma.reliefGroup.findMany({
      where: {
        created_by_user_id: user.userId,
      },
      include: {
        home_district: {
          select: {
            district_name: true,
          },
        },
        home_tehsil: {
          select: {
            tehsil_name: true,
          },
        },
        home_village: {
          select: {
            village_name: true,
          },
        },
        representatives: {
          where: {
            user_id: user.userId,
          },
          select: {
            rep_name: true,
            rep_phone_e164: true,
            otp_verified_at: true,
          },
        },
        _count: {
          select: {
            documents: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    const formattedGroups = groups.map(group => ({
      groupId: group.group_id,
      groupName: group.group_name,
      orgType: group.org_type,
      status: group.status,
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
      representative: group.representatives[0] ? {
        name: group.representatives[0].rep_name,
        phone: group.representatives[0].rep_phone_e164,
        verified: !!group.representatives[0].otp_verified_at,
      } : null,
      documentCount: group._count.documents,
      createdAt: group.created_at,
      updatedAt: group.updated_at,
    }))

    return NextResponse.json({
      groups: formattedGroups,
    })
  } catch (error) {
    console.error('Error fetching user relief groups:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(getUserReliefGroups)
export const POST = requireAuth(registerReliefGroup)
