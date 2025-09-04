import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface ServiceRequestData {
  name: string
  phone: string
  alternateNumber?: string
  lang: string
  location: {
    lat?: number
    lng?: number
    accuracy?: number
    source: string
  }
  admin: {
    district_id: string
    tehsil_id: string
    village_id: string
    village_text: string
  }
  needs: string[]
  details?: Record<string, any>
  client: {
    offline_id?: string
    ts: string
    net: string
  }
  note?: string
}

// Generate unique request number (format: PFR + YYYYMMDD + 4-digit sequence)
async function generateRequestNumber(): Promise<string> {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD

  // Get the count of requests for today to generate sequence
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

  const todayCount = await prisma.serviceRequest.count({
    where: {
      submitted_at: {
        gte: todayStart,
        lt: todayEnd
      }
    }
  })

  const sequence = String(todayCount + 1).padStart(4, '0')
  return `PFR${dateStr}${sequence}`
}

// POST - Create new service request
export async function POST(request: NextRequest) {
  try {
    const body: ServiceRequestData = await request.json()

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Requester name is required' },
        { status: 400 }
      )
    }

    if (!body.phone?.trim()) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    if (!body.admin?.village_id) {
      return NextResponse.json(
        { error: 'Village selection is required' },
        { status: 400 }
      )
    }

    if (!body.needs?.length) {
      return NextResponse.json(
        { error: 'At least one service must be selected' },
        { status: 400 }
      )
    }

    // Fetch location details to populate names
    const village = await prisma.village.findUnique({
      where: { village_code: body.admin.village_id },
      include: {
        tehsil: {
          include: {
            district: true
          }
        }
      }
    })

    if (!village) {
      return NextResponse.json(
        { error: 'Selected village not found' },
        { status: 400 }
      )
    }

    // Generate request number
    const requestNumber = await generateRequestNumber()

    // Create service request
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        request_number: requestNumber,
        requester_name: body.name.trim(),
        requester_phone: body.phone,
        requester_alt_phone: body.alternateNumber || null,
        village_id: body.admin.village_id,
        village_name: body.admin.village_text || village.village_name,
        tehsil_id: body.admin.tehsil_id || village.tehsil.tehsil_code,
        tehsil_name: village.tehsil.tehsil_name,
        district_id: body.admin.district_id || village.tehsil.district.district_code,
        district_name: village.tehsil.district.district_name,
        latitude: body.location?.lat || null,
        longitude: body.location?.lng || null,
        location_accuracy: body.location?.accuracy || null,
        location_source: body.location?.source || null,
        requested_services: body.needs,
        service_details: body.details || null,
        additional_notes: body.note || null,
        language: body.lang || 'pa',
        network_quality: body.client?.net || 'good',
        client_timestamp: body.client?.ts ? new Date(body.client.ts) : null
      }
    })

    return NextResponse.json({
      success: true,
      request_id: serviceRequest.request_id,
      request_number: serviceRequest.request_number,
      submitted_at: serviceRequest.submitted_at,
      status: serviceRequest.status
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating service request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Retrieve service requests (for admin use)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (status) {
      where.status = status
    }

    const serviceRequests = await prisma.serviceRequest.findMany({
      where,
      include: {
        village: {
          include: {
            tehsil: {
              include: {
                district: true
              }
            }
          }
        },
        assigned_group: {
          select: {
            group_id: true,
            group_name: true
          }
        }
      },
      orderBy: { submitted_at: 'desc' },
      take: Math.min(limit, 100), // Max 100 per request
      skip: offset
    })

    const total = await prisma.serviceRequest.count({ where })

    return NextResponse.json({
      service_requests: serviceRequests,
      total,
      limit,
      offset
    })

  } catch (error) {
    console.error('Error fetching service requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
