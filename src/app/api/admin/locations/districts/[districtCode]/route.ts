import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-middleware'
import { logAuthEvent } from '@/lib/auth'
import { AuthenticatedRequest } from '@/lib/auth-middleware'

// Validation schema
const updateDistrictSchema = z.object({
  district_name: z.string().min(1, 'District name is required').optional(),
  state_code: z.string().min(1, 'State code is required').optional()
})

// Get a specific district
async function getDistrict(request: NextRequest, { params }: { params: { districtCode: string } }) {
  try {
    const { districtCode } = params

    const district = await prisma.district.findUnique({
      where: { district_code: districtCode },
      include: {
        state: true,
        tehsils: {
          include: {
            villages: true
          }
        }
      }
    })

    if (!district) {
      return NextResponse.json(
        { error: 'District not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ district })
  } catch (error) {
    console.error('Error fetching district:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update a district
async function updateDistrict(request: AuthenticatedRequest, { params }: { params: { districtCode: string } }) {
  try {
    const { districtCode } = params
    const body = await request.json()
    const validatedData = updateDistrictSchema.parse(body)

    const existingDistrict = await prisma.district.findUnique({
      where: { district_code: districtCode },
      include: { state: true }
    })

    if (!existingDistrict) {
      return NextResponse.json(
        { error: 'District not found' },
        { status: 404 }
      )
    }

    // If state_code is being changed, verify the new state exists
    if (validatedData.state_code && validatedData.state_code !== existingDistrict.state_code) {
      const newState = await prisma.state.findUnique({
        where: { state_code: validatedData.state_code }
      })

      if (!newState) {
        return NextResponse.json(
          { error: 'New state not found' },
          { status: 404 }
        )
      }
    }

    const updatedDistrict = await prisma.district.update({
      where: { district_code: districtCode },
      data: validatedData,
      include: { state: true }
    })

    await logAuthEvent(request.user.user_id, 'update_district', {
      district_code: updatedDistrict.district_code,
      old_name: existingDistrict.district_name,
      new_name: updatedDistrict.district_name,
      old_state: existingDistrict.state_code,
      new_state: updatedDistrict.state_code
    })

    return NextResponse.json({ district: updatedDistrict })
  } catch (error) {
    console.error('Error updating district:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid district data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete a district (only if no tehsils exist)
async function deleteDistrict(request: AuthenticatedRequest, { params }: { params: { districtCode: string } }) {
  try {
    const { districtCode } = params

    const district = await prisma.district.findUnique({
      where: { district_code: districtCode },
      include: { tehsils: true }
    })

    if (!district) {
      return NextResponse.json(
        { error: 'District not found' },
        { status: 404 }
      )
    }

    if (district.tehsils.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete district with existing tehsils' },
        { status: 409 }
      )
    }

    await prisma.district.delete({
      where: { district_code: districtCode }
    })

    await logAuthEvent(request.user.user_id, 'delete_district', {
      district_code: districtCode,
      district_name: district.district_name,
      state_code: district.state_code
    })

    return NextResponse.json({ message: 'District deleted successfully' })
  } catch (error) {
    console.error('Error deleting district:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export handlers with role requirements
export const GET = requireRole(['admin'], getDistrict)
export const PUT = requireRole(['admin'], updateDistrict)
export const DELETE = requireRole(['admin'], deleteDistrict)
