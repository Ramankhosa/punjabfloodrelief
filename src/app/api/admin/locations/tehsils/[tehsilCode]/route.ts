import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-middleware'
import { logAuthEvent } from '@/lib/auth'
import { AuthenticatedRequest } from '@/lib/auth-middleware'

// Validation schema
const updateTehsilSchema = z.object({
  tehsil_name: z.string().min(1, 'Tehsil name is required').optional(),
  district_code: z.string().min(1, 'District code is required').optional()
})

// Get a specific tehsil
async function getTehsil(request: NextRequest, { params }: { params: { tehsilCode: string } }) {
  try {
    const { tehsilCode } = params

    const tehsil = await prisma.tehsil.findUnique({
      where: { tehsil_code: tehsilCode },
      include: {
        district: true,
        villages: true
      }
    })

    if (!tehsil) {
      return NextResponse.json(
        { error: 'Tehsil not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ tehsil })
  } catch (error) {
    console.error('Error fetching tehsil:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update a tehsil
async function updateTehsil(request: AuthenticatedRequest, { params }: { params: { tehsilCode: string } }) {
  try {
    const { tehsilCode } = params
    const body = await request.json()
    const validatedData = updateTehsilSchema.parse(body)

    const existingTehsil = await prisma.tehsil.findUnique({
      where: { tehsil_code: tehsilCode },
      include: { district: true }
    })

    if (!existingTehsil) {
      return NextResponse.json(
        { error: 'Tehsil not found' },
        { status: 404 }
      )
    }

    // If district_code is being changed, verify the new district exists
    if (validatedData.district_code && validatedData.district_code !== existingTehsil.district_code) {
      const newDistrict = await prisma.district.findUnique({
        where: { district_code: validatedData.district_code }
      })

      if (!newDistrict) {
        return NextResponse.json(
          { error: 'New district not found' },
          { status: 404 }
        )
      }
    }

    const updatedTehsil = await prisma.tehsil.update({
      where: { tehsil_code: tehsilCode },
      data: validatedData,
      include: { district: true }
    })

    await logAuthEvent(request.user.user_id, 'update_tehsil', {
      tehsil_code: updatedTehsil.tehsil_code,
      old_name: existingTehsil.tehsil_name,
      new_name: updatedTehsil.tehsil_name,
      old_district: existingTehsil.district_code,
      new_district: updatedTehsil.district_code
    })

    return NextResponse.json({ tehsil: updatedTehsil })
  } catch (error) {
    console.error('Error updating tehsil:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid tehsil data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete a tehsil (only if no villages exist)
async function deleteTehsil(request: AuthenticatedRequest, { params }: { params: { tehsilCode: string } }) {
  try {
    const { tehsilCode } = params

    const tehsil = await prisma.tehsil.findUnique({
      where: { tehsil_code: tehsilCode },
      include: { villages: true }
    })

    if (!tehsil) {
      return NextResponse.json(
        { error: 'Tehsil not found' },
        { status: 404 }
      )
    }

    if (tehsil.villages.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete tehsil with existing villages' },
        { status: 409 }
      )
    }

    await prisma.tehsil.delete({
      where: { tehsil_code: tehsilCode }
    })

    await logAuthEvent(request.user.user_id, 'delete_tehsil', {
      tehsil_code: tehsilCode,
      tehsil_name: tehsil.tehsil_name,
      district_code: tehsil.district_code
    })

    return NextResponse.json({ message: 'Tehsil deleted successfully' })
  } catch (error) {
    console.error('Error deleting tehsil:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export handlers with role requirements
export const GET = requireRole(['admin'], getTehsil)
export const PUT = requireRole(['admin'], updateTehsil)
export const DELETE = requireRole(['admin'], deleteTehsil)
