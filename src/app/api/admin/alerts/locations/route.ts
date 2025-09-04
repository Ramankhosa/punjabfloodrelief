import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-middleware'
import { logAuthEvent } from '@/lib/auth'

// Validation schemas
const alertSchema = z.object({
  category_id: z.string().min(1, 'Category ID is required'),
  status_id: z.string().min(1, 'Status ID is required'),
  location_type: z.enum(['state', 'district', 'tehsil', 'village']),
  state_code: z.string().optional(),
  district_code: z.string().optional(),
  tehsil_code: z.string().optional(),
  village_code: z.string().optional(),
  notes: z.string().optional(),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
  is_active: z.boolean().optional()
})

const bulkUpdateSchema = z.object({
  category_id: z.string().min(1, 'Category ID is required'),
  status_id: z.string().min(1, 'Status ID is required'),
  location_type: z.enum(['district', 'tehsil']),
  location_codes: z.array(z.string()).min(1, 'At least one location code is required'),
  notes: z.string().optional(),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
  is_active: z.boolean().optional()
})

// Get all alerts for locations with hierarchical structure
async function getLocationAlerts(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const stateCode = searchParams.get('state_code')
    const districtCode = searchParams.get('district_code')
    const tehsilCode = searchParams.get('tehsil_code')
    const categoryId = searchParams.get('category_id')
    const isActive = searchParams.get('is_active') !== 'false' // Default to true

    let whereClause: any = {
      is_active: isActive
    }

    // Filter by location hierarchy
    if (stateCode) {
      whereClause.state_code = stateCode
    }
    if (districtCode) {
      whereClause.district_code = districtCode
    }
    if (tehsilCode) {
      whereClause.tehsil_code = tehsilCode
    }
    if (categoryId) {
      whereClause.category_id = categoryId
    }

    const alerts = await prisma.alert.findMany({
      where: whereClause,
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
      },
      orderBy: [
        { location_type: 'asc' },
        { created_at: 'desc' }
      ]
    })

    // Group alerts by location for easier consumption
    const groupedAlerts = {
      states: alerts.filter(a => a.location_type === 'state'),
      districts: alerts.filter(a => a.location_type === 'district'),
      tehsils: alerts.filter(a => a.location_type === 'tehsil'),
      villages: alerts.filter(a => a.location_type === 'village')
    }

    return NextResponse.json({
      alerts: groupedAlerts,
      total: alerts.length
    })
  } catch (error) {
    console.error('Error fetching location alerts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get alerts for a specific location
async function getLocationAlertsById(request: NextRequest, { params }: { params: { locationCode: string } }) {
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

    let whereClause: any = {
      location_type: locationType,
      is_active: true
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

    const alerts = await prisma.alert.findMany({
      where: whereClause,
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
        }
      },
      orderBy: { created_at: 'desc' }
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

// Create a new alert for a location
async function createLocationAlert(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = alertSchema.parse(body)

    // Validate location exists and matches the type
    let locationExists = false
    let locationName = ''

    switch (validatedData.location_type) {
      case 'state':
        if (!validatedData.state_code) {
          return NextResponse.json(
            { error: 'State code is required for state-level alerts' },
            { status: 400 }
          )
        }
        const state = await prisma.state.findUnique({
          where: { state_code: validatedData.state_code }
        })
        locationExists = !!state
        locationName = state?.state_name || ''
        break

      case 'district':
        if (!validatedData.district_code) {
          return NextResponse.json(
            { error: 'District code is required for district-level alerts' },
            { status: 400 }
          )
        }
        const district = await prisma.district.findUnique({
          where: { district_code: validatedData.district_code }
        })
        locationExists = !!district
        locationName = district?.district_name || ''
        break

      case 'tehsil':
        if (!validatedData.tehsil_code) {
          return NextResponse.json(
            { error: 'Tehsil code is required for tehsil-level alerts' },
            { status: 400 }
          )
        }
        const tehsil = await prisma.tehsil.findUnique({
          where: { tehsil_code: validatedData.tehsil_code }
        })
        locationExists = !!tehsil
        locationName = tehsil?.tehsil_name || ''
        break

      case 'village':
        if (!validatedData.village_code) {
          return NextResponse.json(
            { error: 'Village code is required for village-level alerts' },
            { status: 400 }
          )
        }
        const village = await prisma.village.findUnique({
          where: { village_code: validatedData.village_code }
        })
        locationExists = !!village
        locationName = village?.village_name || ''
        break
    }

    if (!locationExists) {
      return NextResponse.json(
        { error: `${validatedData.location_type} not found` },
        { status: 404 }
      )
    }

    // Check if alert category and status exist
    const [category, status] = await Promise.all([
      prisma.alertCategory.findUnique({
        where: { category_id: validatedData.category_id }
      }),
      prisma.alertStatus.findUnique({
        where: { status_id: validatedData.status_id }
      })
    ])

    if (!category) {
      return NextResponse.json(
        { error: 'Alert category not found' },
        { status: 404 }
      )
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Alert status not found' },
        { status: 404 }
      )
    }

    // Check if alert already exists for this location and category
    const existingAlert = await prisma.alert.findFirst({
      where: {
        category_id: validatedData.category_id,
        location_type: validatedData.location_type,
        state_code: validatedData.state_code,
        district_code: validatedData.district_code,
        tehsil_code: validatedData.tehsil_code,
        village_code: validatedData.village_code,
        is_active: true
      }
    })

    if (existingAlert) {
      return NextResponse.json(
        { error: 'An active alert already exists for this location and category' },
        { status: 409 }
      )
    }

    const alert = await prisma.alert.create({
      data: {
        ...validatedData,
        severity: validatedData.severity || 'info',
        is_active: validatedData.is_active !== false,
        created_by_id: request.user.userId,
        updated_by_id: request.user.userId
      },
      include: {
        category: true,
        status: true,
        created_by: {
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

    await logAuthEvent(request.user.userId, 'create_location_alert', {
      alert_id: alert.alert_id,
      location_type: alert.location_type,
      location_name: locationName,
      category_name: category.name,
      status_name: status.name
    })

    return NextResponse.json({ alert }, { status: 201 })
  } catch (error) {
    console.error('Error creating location alert:', error)

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

// Bulk update alerts for multiple locations
async function bulkUpdateLocationAlerts(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = bulkUpdateSchema.parse(body)

    // Validate category and status exist
    const [category, status] = await Promise.all([
      prisma.alertCategory.findUnique({
        where: { category_id: validatedData.category_id }
      }),
      prisma.alertStatus.findUnique({
        where: { status_id: validatedData.status_id }
      })
    ])

    if (!category) {
      return NextResponse.json(
        { error: 'Alert category not found' },
        { status: 404 }
      )
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Alert status not found' },
        { status: 404 }
      )
    }

    // Validate all locations exist
    let locationsExist = true
    const locationNames: string[] = []

    for (const locationCode of validatedData.location_codes) {
      let location: any = null

      switch (validatedData.location_type) {
        case 'district':
          location = await prisma.district.findUnique({
            where: { district_code: locationCode }
          })
          break
        case 'tehsil':
          location = await prisma.tehsil.findUnique({
            where: { tehsil_code: locationCode }
          })
          break
      }

      if (!location) {
        locationsExist = false
        break
      }

      locationNames.push(
        validatedData.location_type === 'district'
          ? location.district_name
          : location.tehsil_name
      )
    }

    if (!locationsExist) {
      return NextResponse.json(
        { error: 'One or more locations not found' },
        { status: 404 }
      )
    }

    // Use a transaction to update/create alerts for all locations
    const results = await prisma.$transaction(async (tx) => {
      const updates = []

      for (const locationCode of validatedData.location_codes) {
        let whereClause: any = {
          category_id: validatedData.category_id,
          location_type: validatedData.location_type,
          is_active: true
        }

        // Set the appropriate location code
        if (validatedData.location_type === 'district') {
          whereClause.district_code = locationCode
        } else if (validatedData.location_type === 'tehsil') {
          whereClause.tehsil_code = locationCode
        }

        // Check if alert exists
        const existingAlert = await tx.alert.findFirst({
          where: whereClause
        })

        if (existingAlert) {
          // Update existing alert
          const updatedAlert = await tx.alert.update({
            where: { alert_id: existingAlert.alert_id },
            data: {
              status_id: validatedData.status_id,
              notes: validatedData.notes || existingAlert.notes,
              severity: validatedData.severity || existingAlert.severity,
              is_active: validatedData.is_active !== false,
              updated_by_id: request.user.userId,
              updated_at: new Date()
            },
            include: {
              category: true,
              status: true,
              district: validatedData.location_type === 'district',
              tehsil: validatedData.location_type === 'tehsil'
            }
          })
          updates.push({ action: 'updated', alert: updatedAlert })
        } else {
          // Create new alert
          let createData: any = {
            category_id: validatedData.category_id,
            status_id: validatedData.status_id,
            location_type: validatedData.location_type,
            notes: validatedData.notes,
            severity: validatedData.severity || 'info',
            is_active: validatedData.is_active !== false,
            created_by_id: request.user.userId,
            updated_by_id: request.user.userId
          }

          if (validatedData.location_type === 'district') {
            createData.district_code = locationCode
          } else if (validatedData.location_type === 'tehsil') {
            createData.tehsil_code = locationCode
          }

          const newAlert = await tx.alert.create({
            data: {
              ...createData,
              created_by_id: request.user.userId,
              updated_by_id: request.user.userId
            },
            include: {
              category: true,
              status: true,
              district: validatedData.location_type === 'district',
              tehsil: validatedData.location_type === 'tehsil'
            }
          })
          updates.push({ action: 'created', alert: newAlert })
        }
      }

      return updates
    })

    await logAuthEvent(request.user.userId, 'bulk_update_location_alerts', {
      location_type: validatedData.location_type,
      location_count: validatedData.location_codes.length,
      category_name: category.name,
      status_name: status.name,
      created_count: results.filter(r => r.action === 'created').length,
      updated_count: results.filter(r => r.action === 'updated').length
    })

    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        created: results.filter(r => r.action === 'created').length,
        updated: results.filter(r => r.action === 'updated').length
      }
    })
  } catch (error) {
    console.error('Error bulk updating location alerts:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid bulk update data', details: error.errors },
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
export const GET = requireRole(['admin'], getLocationAlerts)
export const POST = requireRole(['admin'], createLocationAlert)
export const PATCH = requireRole(['admin'], bulkUpdateLocationAlerts)
