import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authenticatedFetch } from '@/lib/auth'

const prisma = new PrismaClient()

// GET /api/inventory - List inventory entries for a group/provider
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const providerId = searchParams.get('providerId')
    const status = searchParams.get('status') || 'all'
    const category = searchParams.get('category')
    const districtCode = searchParams.get('districtCode')
    const tehsilCode = searchParams.get('tehsilCode')

    let whereClause: any = {}

    if (groupId) {
      // Find provider for this group
      const provider = await prisma.provider.findFirst({
        where: { group_id: groupId }
      })
      if (!provider) {
        return NextResponse.json({ inventory: [] })
      }
      whereClause.provider_id = provider.provider_id
    } else if (providerId) {
      whereClause.provider_id = providerId
    }

    // Filter by status
    if (status !== 'all') {
      whereClause.status = status
    }

    // Filter by category
    if (category) {
      whereClause.item_type = {
        category: category
      }
    }

    // Filter by location
    if (districtCode) {
      whereClause.district_code = districtCode
    }
    if (tehsilCode) {
      whereClause.tehsil_code = tehsilCode
    }

    const inventoryEntries = await prisma.inventoryEntry.findMany({
      where: whereClause,
      include: {
        provider: true,
        item_type: true,
        district: true,
        tehsil: true,
        village: true,
        resupply_requests: {
          where: { status: 'PENDING' },
          include: { requester: true }
        },
        donation_offers: {
          where: { status: 'OFFERED' },
          include: { donor: true }
        }
      },
      orderBy: { updated_at: 'desc' }
    })

    return NextResponse.json({ inventory: inventoryEntries })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/inventory - Create new inventory entry
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/inventory - Starting inventory entry creation')

    const body = await request.json()
    console.log('Request body:', body)

    const {
      groupId,
      providerId,
      itemTypeId,
      districtCode,
      tehsilCode,
      villageCode,
      quantityTotal,
      quantityAvailable,
      condition,
      availabilityMode,
      availableFrom,
      availableUntil,
      responseHours,
      batchNumber,
      expiryDate,
      storageLocation,
      visibility,
      notes,
      evidenceUrls = [],
      alias,
      contactType,
      contactValue,
      contactVisibility
    } = body

    // Validation
    console.log('Validating input data...')
    if (!itemTypeId) {
      console.log('Validation failed: No item type')
      return NextResponse.json({ error: 'Item type is required' }, { status: 400 })
    }
    if (!districtCode || !tehsilCode) {
      console.log('Validation failed: Missing location')
      return NextResponse.json({ error: 'District and tehsil are required' }, { status: 400 })
    }
    if (!quantityTotal || quantityTotal <= 0) {
      console.log('Validation failed: Invalid quantity')
      return NextResponse.json({ error: 'Valid quantity is required' }, { status: 400 })
    }
    if (!contactType || !contactValue) {
      console.log('Validation failed: Missing contact info')
      return NextResponse.json({ error: 'Contact information is required' }, { status: 400 })
    }
    console.log('Validation passed')

    console.log('Processing provider logic...')
    let finalProviderId = providerId

    // If groupId provided, find or create provider
    if (groupId && !providerId) {
      console.log('Finding/creating provider for group:', groupId)
      let provider = await prisma.provider.findFirst({
        where: { group_id: groupId }
      })

      if (!provider) {
        console.log('Creating new provider for group')
        provider = await prisma.provider.create({
          data: {
            group_id: groupId,
            alias: alias,
            contact_type: contactType,
            contact_value: contactValue,
            visibility: { contact: contactVisibility || 'coordinators' }
          }
        })
      }
      finalProviderId = provider.provider_id
    }

    // If neither groupId nor providerId provided, create standalone provider
    if (!groupId && !providerId) {
      console.log('Creating standalone provider')
      const provider = await prisma.provider.create({
        data: {
          alias: alias,
          contact_type: contactType,
          contact_value: contactValue,
          visibility: { contact: contactVisibility || 'coordinators' }
        }
      })
      finalProviderId = provider.provider_id
    }

    console.log('Final provider ID:', finalProviderId)

    // Validate that we have a provider ID
    if (!finalProviderId) {
      console.log('ERROR: No provider ID available')
      return NextResponse.json({ error: 'Failed to create or find provider' }, { status: 400 })
    }

    // Create inventory entry
    console.log('Creating inventory entry with data:', {
      provider_id: finalProviderId,
      item_type_id: itemTypeId,
      district_code: districtCode,
      tehsil_code: tehsilCode,
      quantity_total: quantityTotal,
      quantity_available: quantityAvailable || quantityTotal
    })

    const inventoryEntry = await prisma.inventoryEntry.create({
      data: {
        provider_id: finalProviderId,
        item_type_id: itemTypeId,
        district_code: districtCode,
        tehsil_code: tehsilCode,
        village_code: villageCode,
        quantity_total: quantityTotal,
        quantity_available: quantityAvailable || quantityTotal,
        condition: condition || 'NEW',
        availability_mode: availabilityMode || 'IMMEDIATE',
        available_from: availableFrom ? new Date(availableFrom) : null,
        available_until: availableUntil ? new Date(availableUntil) : null,
        response_hours: responseHours,
        batch_number: batchNumber,
        expiry_date: expiryDate ? new Date(expiryDate) : null,
        storage_location: storageLocation,
        visibility: visibility || 'PUBLIC',
        notes,
        evidence_urls: evidenceUrls
      }
    })

    console.log('Inventory entry created successfully:', inventoryEntry.entry_id)

    // Return complete inventory entry with relations
    console.log('Fetching complete inventory entry data...')
    const fullEntry = await prisma.inventoryEntry.findUnique({
      where: { entry_id: inventoryEntry.entry_id },
      include: {
        provider: true,
        item_type: true,
        district: true,
        tehsil: true,
        village: true
      }
    })

    console.log('Inventory entry creation completed successfully')
    return NextResponse.json({ entry: fullEntry })
  } catch (error) {
    console.error('Error creating inventory entry:', error)
    console.error('Error details:', error instanceof Error ? error.message : error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
