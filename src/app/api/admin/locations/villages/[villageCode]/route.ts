import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-middleware'
import { logAuthEvent } from '@/lib/auth'
import { AuthenticatedRequest } from '@/lib/auth-middleware'

// Validation schema
const updateVillageSchema = z.object({
  village_name: z.string().min(1, 'Village name is required').optional(),
  tehsil_code: z.string().min(1, 'Tehsil code is required').optional(),
  district_code: z.string().min(1, 'District code is required').optional(),
  lat: z.number().optional(),
  lon: z.number().optional()
})

// Get a specific village
async function getVillage(request: NextRequest, { params }: { params: { villageCode: string } }) {
  try {
    const { villageCode } = params

    const village = await prisma.village.findUnique({
      where: { village_code: villageCode },
      include: {
        tehsil: true,
        district: true
      }
    })

    if (!village) {
      return NextResponse.json(
        { error: 'Village not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ village })
  } catch (error) {
    console.error('Error fetching village:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update a village
async function updateVillage(request: AuthenticatedRequest, { params }: { params: { villageCode: string } }) {
  try {
    const { villageCode } = params
    const body = await request.json()
    const validatedData = updateVillageSchema.parse(body)

    const existingVillage = await prisma.village.findUnique({
      where: { village_code: villageCode },
      include: {
        tehsil: true,
        district: true
      }
    })

    if (!existingVillage) {
      return NextResponse.json(
        { error: 'Village not found' },
        { status: 404 }
      )
    }

    // If tehsil_code is being changed, verify the new tehsil exists
    if (validatedData.tehsil_code && validatedData.tehsil_code !== existingVillage.tehsil_code) {
      const newTehsil = await prisma.tehsil.findUnique({
        where: { tehsil_code: validatedData.tehsil_code }
      })

      if (!newTehsil) {
        return NextResponse.json(
          { error: 'New tehsil not found' },
          { status: 404 }
        )
      }
    }

    // If district_code is being changed, verify the new district exists
    if (validatedData.district_code && validatedData.district_code !== existingVillage.district_code) {
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

    const updatedVillage = await prisma.village.update({
      where: { village_code: villageCode },
      data: validatedData,
      include: {
        tehsil: true,
        district: true
      }
    })

    await logAuthEvent(request.user.user_id, 'update_village', {
      village_code: updatedVillage.village_code,
      old_name: existingVillage.village_name,
      new_name: updatedVillage.village_name,
      old_tehsil: existingVillage.tehsil_code,
      new_tehsil: updatedVillage.tehsil_code,
      old_district: existingVillage.district_code,
      new_district: updatedVillage.district_code
    })

    return NextResponse.json({ village: updatedVillage })
  } catch (error) {
    console.error('Error updating village:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid village data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete a village
async function deleteVillage(request: AuthenticatedRequest, { params }: { params: { villageCode: string } }) {
  try {
    const { villageCode } = params

    const village = await prisma.village.findUnique({
      where: { village_code: villageCode }
    })

    if (!village) {
      return NextResponse.json(
        { error: 'Village not found' },
        { status: 404 }
      )
    }

    await prisma.village.delete({
      where: { village_code: villageCode }
    })

    await logAuthEvent(request.user.user_id, 'delete_village', {
      village_code: villageCode,
      village_name: village.village_name,
      tehsil_code: village.tehsil_code,
      district_code: village.district_code
    })

    return NextResponse.json({ message: 'Village deleted successfully' })
  } catch (error) {
    console.error('Error deleting village:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export handlers with role requirements
export const GET = requireRole(['admin'], getVillage)
export const PUT = requireRole(['admin'], updateVillage)
export const DELETE = requireRole(['admin'], deleteVillage)
