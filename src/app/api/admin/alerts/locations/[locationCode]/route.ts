import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-middleware'
import { logAuthEvent } from '@/lib/auth'

// Validation schemas
const updateAlertSchema = z.object({
  status_id: z.string().optional(),
  notes: z.string().optional(),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
  is_active: z.boolean().optional()
})

// Get alerts for a specific location
async function getLocationAlerts(request: NextRequest, { params }: { params: { locationCode: string } }) {
  try {
    const locationCode = params.locationCode
    const { searchParams } = new URL(request.url)
    const locationType = searchParams.get('type') as 'state' | 'district' | 'tehsil' | 'village'
    const categoryId = searchParams.get('category_id')
    const includeInactive = searchParams.get('include_inactive') === 'true'

    if (!locationType || !['state', 'district', 'tehsil', 'village'].includes(locationType)) {
      return NextResponse.json(
        { error: 'Valid location type is required (state, district, tehsil, village)' },
        { status: 400 }
      )
    }

    let whereClause: any = {
      location_type: locationType
    }

    // Set the appropriate location code based on type
    switch (locationType) {
      case 'state':
        whereClause.state_code = locationCode
        break
      case 'district':
        whereClause.district_code = locationCode
        break
      case 'tehsil':
        whereClause.tehsil_code = locationCode
        break
      case 'village':
        whereClause.village_code = locationCode
        break
    }

    if (categoryId) {
      whereClause.category_id = categoryId
    }

    if (!includeInactive) {
      whereClause.is_active = true
    }

    const alerts = await prisma.alert.findMany({
      where: whereClause,
      include: {
        category: {
          include: {
            statuses: {
              where: { is_active: true },
              orderBy: { order_index: 'asc' }
            }
          }
        },
        status: true,
        created_by: {
          select: {
            user_id: true,
            primary_login: true
          }
        },
        updated_by: {
          select: {
            user_id: true,
            primary_login: true
          }
        },
        state: true,
        district: true,
        tehsil: true,
        village: true
      },
      orderBy: [
        { category: { order_index: 'asc' } },
        { created_at: 'desc' }
      ]
    })

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error('Error fetching alerts for location:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update an alert for a specific location
async function updateLocationAlert(request: NextRequest, { params }: { params: { locationCode: string } }) {
  try {
    const locationCode = params.locationCode
    const { searchParams } = new URL(request.url)
    const locationType = searchParams.get('type') as 'state' | 'district' | 'tehsil' | 'village'
    const categoryId = searchParams.get('category_id')

    if (!locationType || !['state', 'district', 'tehsil', 'village'].includes(locationType)) {
      return NextResponse.json(
        { error: 'Valid location type is required (state, district, tehsil, village)' },
        { status: 400 }
      )
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateAlertSchema.parse(body)

    // Find the alert to update
    let whereClause: any = {
      category_id: categoryId,
      location_type: locationType
    }

    switch (locationType) {
      case 'state':
        whereClause.state_code = locationCode
        break
      case 'district':
        whereClause.district_code = locationCode
        break
      case 'tehsil':
        whereClause.tehsil_code = locationCode
        break
      case 'village':
        whereClause.village_code = locationCode
        break
    }

    const existingAlert = await prisma.alert.findFirst({
      where: whereClause,
      include: {
        category: true,
        status: true
      }
    })

    if (!existingAlert) {
      return NextResponse.json(
        { error: 'Alert not found for this location and category' },
        { status: 404 }
      )
    }

    // Validate status if provided
    if (validatedData.status_id) {
      const status = await prisma.alertStatus.findUnique({
        where: { status_id: validatedData.status_id }
      })

      if (!status) {
        return NextResponse.json(
          { error: 'Alert status not found' },
          { status: 404 }
        )
      }

      // Ensure status belongs to the same category
      if (status.category_id !== categoryId) {
        return NextResponse.json(
          { error: 'Status does not belong to the specified category' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {
      ...validatedData,
      updated_by_id: request.user.user_id,
      updated_at: new Date()
    }

    const alert = await prisma.alert.update({
      where: { alert_id: existingAlert.alert_id },
      data: updateData,
      include: {
        category: true,
        status: true,
        created_by: {
          select: {
            user_id: true,
            primary_login: true
          }
        },
        updated_by: {
          select: {
            user_id: true,
            primary_login: true
          }
        },
        state: true,
        district: true,
        tehsil: true,
        village: true
      }
    })

    await logAuthEvent(request.user.user_id, 'update_location_alert', {
      alert_id: alert.alert_id,
      location_type: alert.location_type,
      location_code: locationCode,
      category_name: alert.category.name,
      old_status: existingAlert.status.name,
      new_status: alert.status.name
    })

    return NextResponse.json({ alert })
  } catch (error) {
    console.error('Error updating location alert:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid alert data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete an alert for a specific location
async function deleteLocationAlert(request: NextRequest, { params }: { params: { locationCode: string } }) {
  try {
    const locationCode = params.locationCode
    const { searchParams } = new URL(request.url)
    const locationType = searchParams.get('type') as 'state' | 'district' | 'tehsil' | 'village'
    const categoryId = searchParams.get('category_id')

    if (!locationType || !['state', 'district', 'tehsil', 'village'].includes(locationType)) {
      return NextResponse.json(
        { error: 'Valid location type is required (state, district, tehsil, village)' },
        { status: 400 }
      )
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    // Find the alert to delete
    let whereClause: any = {
      category_id: categoryId,
      location_type: locationType
    }

    switch (locationType) {
      case 'state':
        whereClause.state_code = locationCode
        break
      case 'district':
        whereClause.district_code = locationCode
        break
      case 'tehsil':
        whereClause.tehsil_code = locationCode
        break
      case 'village':
        whereClause.village_code = locationCode
        break
    }

    const existingAlert = await prisma.alert.findFirst({
      where: whereClause,
      include: {
        category: true,
        status: true
      }
    })

    if (!existingAlert) {
      return NextResponse.json(
        { error: 'Alert not found for this location and category' },
        { status: 404 }
      )
    }

    // Soft delete by setting is_active to false
    await prisma.alert.update({
      where: { alert_id: existingAlert.alert_id },
      data: {
        is_active: false,
        updated_by_id: request.user.user_id,
        updated_at: new Date()
      }
    })

    await logAuthEvent(request.user.user_id, 'delete_location_alert', {
      alert_id: existingAlert.alert_id,
      location_type: locationType,
      location_code: locationCode,
      category_name: existingAlert.category.name,
      status_name: existingAlert.status.name
    })

    return NextResponse.json({ message: 'Alert deleted successfully' })
  } catch (error) {
    console.error('Error deleting location alert:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export handlers with role requirements
export const GET = requireRole(['admin'], getLocationAlerts)
export const PATCH = requireRole(['admin'], updateLocationAlert)
export const DELETE = requireRole(['admin'], deleteLocationAlert)
