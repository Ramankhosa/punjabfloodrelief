import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Get all locations in hierarchical structure for public access
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

// Search villages by name (fuzzy search)
async function searchVillages(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ villages: [] })
    }

    const villages = await prisma.village.findMany({
      where: {
        village_name: {
          contains: query,
          mode: 'insensitive'
        }
      },
      include: {
        tehsil: {
          include: {
            district: true
          }
        }
      },
      orderBy: { village_name: 'asc' },
      take: 50
    })

    return NextResponse.json({ villages })
  } catch (error) {
    console.error('Error searching villages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get districts for a state
async function getDistricts(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const stateCode = searchParams.get('stateCode')

    if (!stateCode) {
      return NextResponse.json(
        { error: 'State code is required' },
        { status: 400 }
      )
    }

    const districts = await prisma.district.findMany({
      where: { state_code: stateCode },
      include: {
        tehsils: {
          include: {
            villages: true
          }
        }
      },
      orderBy: { district_name: 'asc' }
    })

    return NextResponse.json({ districts })
  } catch (error) {
    console.error('Error fetching districts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get tehsils for a district
async function getTehsils(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const districtCode = searchParams.get('districtCode')

    if (!districtCode) {
      return NextResponse.json(
        { error: 'District code is required' },
        { status: 400 }
      )
    }

    const tehsils = await prisma.tehsil.findMany({
      where: { district_code: districtCode },
      include: {
        villages: true,
        district: true
      },
      orderBy: { tehsil_name: 'asc' }
    })

    return NextResponse.json({ tehsils })
  } catch (error) {
    console.error('Error fetching tehsils:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get villages for a tehsil
async function getVillages(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tehsilCode = searchParams.get('tehsilCode')

    if (!tehsilCode) {
      return NextResponse.json(
        { error: 'Tehsil code is required' },
        { status: 400 }
      )
    }

    const villages = await prisma.village.findMany({
      where: { tehsil_code: tehsilCode },
      include: {
        tehsil: {
          include: {
            district: true
          }
        }
      },
      orderBy: { village_name: 'asc' }
    })

    return NextResponse.json({ villages })
  } catch (error) {
    console.error('Error fetching villages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Find nearest villages by coordinates
async function getNearestVillages(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    // Simple distance calculation (Haversine formula approximation)
    // In production, you'd want to use PostGIS or similar for proper geospatial queries
    const villages = await prisma.village.findMany({
      where: {
        lat: { not: null },
        lon: { not: null }
      },
      include: {
        tehsil: {
          include: {
            district: true
          }
        }
      }
    })

    // Calculate distances and sort
    const villagesWithDistance = villages.map(village => {
      if (!village.lat || !village.lon) return null

      const distance = Math.sqrt(
        Math.pow(village.lat - lat, 2) + Math.pow(village.lon - lng, 2)
      )

      return {
        ...village,
        distance
      }
    }).filter(Boolean).sort((a, b) => a!.distance - b!.distance).slice(0, 10)

    return NextResponse.json({ villages: villagesWithDistance })
  } catch (error) {
    console.error('Error finding nearest villages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  switch (action) {
    case 'search':
      return searchVillages(request)
    case 'districts':
      return getDistricts(request)
    case 'tehsils':
      return getTehsils(request)
    case 'villages':
      return getVillages(request)
    case 'nearest':
      return getNearestVillages(request)
    default:
      return getAllLocations(request)
  }
}
