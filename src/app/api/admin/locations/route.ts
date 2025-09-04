import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-middleware'
import { logAuthEvent } from '@/lib/auth'

// Validation schemas
const stateSchema = z.object({
  state_code: z.string().min(1, 'State code is required'),
  state_name: z.string().min(1, 'State name is required')
})

const districtSchema = z.object({
  district_code: z.string().min(1, 'District code is required'),
  district_name: z.string().min(1, 'District name is required'),
  state_code: z.string().min(1, 'State code is required')
})

const tehsilSchema = z.object({
  tehsil_code: z.string().min(1, 'Tehsil code is required'),
  tehsil_name: z.string().min(1, 'Tehsil name is required'),
  district_code: z.string().min(1, 'District code is required')
})

const villageSchema = z.object({
  village_code: z.string().min(1, 'Village code is required'),
  village_name: z.string().min(1, 'Village name is required'),
  tehsil_code: z.string().min(1, 'Tehsil code is required'),
  district_code: z.string().min(1, 'District code is required'),
  lat: z.number().optional(),
  lon: z.number().optional()
})

// Get all locations in hierarchical structure
async function getAllLocations(request: NextRequest) {
  try {
    const [states, districts, tehsils, villages] = await Promise.all([
      prisma.state.findMany({
        include: {
          districts: {
            include: {
              tehsils: {
                include: {
                  villages: true
                }
              }
            }
          }
        },
        orderBy: { state_name: 'asc' }
      }),
      prisma.district.findMany({
        include: {
          tehsils: {
            include: {
              villages: true
            }
          }
        },
        orderBy: { district_name: 'asc' }
      }),
      prisma.tehsil.findMany({
        include: {
          villages: true
        },
        orderBy: { tehsil_name: 'asc' }
      }),
      prisma.village.findMany({
        orderBy: { village_name: 'asc' }
      })
    ])

    return NextResponse.json({
      states,
      districts,
      tehsils,
      villages
    })
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create a new state
async function createState(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = stateSchema.parse(body)

    const existingState = await prisma.state.findUnique({
      where: { state_code: validatedData.state_code }
    })

    if (existingState) {
      return NextResponse.json(
        { error: 'State with this code already exists' },
        { status: 409 }
      )
    }

    const state = await prisma.state.create({
      data: validatedData
    })

    await logAuthEvent(request.user.user_id, 'create_state', {
      state_code: state.state_code,
      state_name: state.state_name
    })

    return NextResponse.json({ state }, { status: 201 })
  } catch (error) {
    console.error('Error creating state:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid state data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create a new district
async function createDistrict(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = districtSchema.parse(body)

    // Verify state exists
    const state = await prisma.state.findUnique({
      where: { state_code: validatedData.state_code }
    })

    if (!state) {
      return NextResponse.json(
        { error: 'State not found' },
        { status: 404 }
      )
    }

    const existingDistrict = await prisma.district.findUnique({
      where: { district_code: validatedData.district_code }
    })

    if (existingDistrict) {
      return NextResponse.json(
        { error: 'District with this code already exists' },
        { status: 409 }
      )
    }

    const district = await prisma.district.create({
      data: validatedData,
      include: { state: true }
    })

    await logAuthEvent(request.user.user_id, 'create_district', {
      district_code: district.district_code,
      district_name: district.district_name,
      state_code: district.state_code
    })

    return NextResponse.json({ district }, { status: 201 })
  } catch (error) {
    console.error('Error creating district:', error)

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

// Create a new tehsil
async function createTehsil(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = tehsilSchema.parse(body)

    // Verify district exists
    const district = await prisma.district.findUnique({
      where: { district_code: validatedData.district_code }
    })

    if (!district) {
      return NextResponse.json(
        { error: 'District not found' },
        { status: 404 }
      )
    }

    const existingTehsil = await prisma.tehsil.findUnique({
      where: { tehsil_code: validatedData.tehsil_code }
    })

    if (existingTehsil) {
      return NextResponse.json(
        { error: 'Tehsil with this code already exists' },
        { status: 409 }
      )
    }

    const tehsil = await prisma.tehsil.create({
      data: validatedData,
      include: { district: true }
    })

    await logAuthEvent(request.user.user_id, 'create_tehsil', {
      tehsil_code: tehsil.tehsil_code,
      tehsil_name: tehsil.tehsil_name,
      district_code: tehsil.district_code
    })

    return NextResponse.json({ tehsil }, { status: 201 })
  } catch (error) {
    console.error('Error creating tehsil:', error)

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

// Create a new village
async function createVillage(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = villageSchema.parse(body)

    // Verify tehsil and district exist
    const tehsil = await prisma.tehsil.findUnique({
      where: { tehsil_code: validatedData.tehsil_code }
    })

    if (!tehsil) {
      return NextResponse.json(
        { error: 'Tehsil not found' },
        { status: 404 }
      )
    }

    const district = await prisma.district.findUnique({
      where: { district_code: validatedData.district_code }
    })

    if (!district) {
      return NextResponse.json(
        { error: 'District not found' },
        { status: 404 }
      )
    }

    const existingVillage = await prisma.village.findUnique({
      where: { village_code: validatedData.village_code }
    })

    if (existingVillage) {
      return NextResponse.json(
        { error: 'Village with this code already exists' },
        { status: 409 }
      )
    }

    const village = await prisma.village.create({
      data: validatedData,
      include: {
        tehsil: true,
        district: true
      }
    })

    await logAuthEvent(request.user.user_id, 'create_village', {
      village_code: village.village_code,
      village_name: village.village_name,
      tehsil_code: village.tehsil_code,
      district_code: village.district_code
    })

    return NextResponse.json({ village }, { status: 201 })
  } catch (error) {
    console.error('Error creating village:', error)

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

// Export handlers with role requirements
export const GET = requireRole(['admin'], getAllLocations)
export const POST = requireRole(['admin'], async (request: NextRequest) => {
  const url = new URL(request.url)
  const type = url.searchParams.get('type')

  switch (type) {
    case 'state':
      return createState(request)
    case 'district':
      return createDistrict(request)
    case 'tehsil':
      return createTehsil(request)
    case 'village':
      return createVillage(request)
    default:
      return NextResponse.json(
        { error: 'Invalid type parameter. Use ?type=state|district|tehsil|village' },
        { status: 400 }
      )
  }
})
