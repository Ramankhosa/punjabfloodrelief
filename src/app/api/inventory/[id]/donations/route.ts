import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/inventory/[id]/donations - Get donation offers for an inventory entry
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    let whereClause: any = { entry_id: params.id }

    if (status !== 'all') {
      whereClause.status = status
    }

    const donationOffers = await prisma.donationOffer.findMany({
      where: whereClause,
      include: {
        donor: {
          select: {
            user_id: true,
            primary_login: true,
            email: true,
            phone_e164: true
          }
        },
        reviewer: {
          select: {
            user_id: true,
            primary_login: true,
            email: true,
            phone_e164: true
          }
        },
        inventory_entry: {
          include: {
            item_type: true,
            provider: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json({ donationOffers })
  } catch (error) {
    console.error('Error fetching donation offers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/inventory/[id]/donations - Create donation offer for an inventory entry
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user from authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const {
      quantityOffered,
      condition = 'NEW',
      availableDate,
      deliveryMethod,
      notes,
      donorName,
      donorContact
    } = body

    // Validate input
    if (!quantityOffered || quantityOffered <= 0) {
      return NextResponse.json({ error: 'Valid quantity offered is required' }, { status: 400 })
    }

    if (!donorName || !donorContact) {
      return NextResponse.json({ error: 'Donor name and contact information are required' }, { status: 400 })
    }

    // Verify inventory entry exists
    const inventoryEntry = await prisma.inventoryEntry.findUnique({
      where: { entry_id: params.id },
      include: { item_type: true }
    })

    if (!inventoryEntry) {
      return NextResponse.json({ error: 'Inventory entry not found' }, { status: 404 })
    }

    // Find user by auth token (simplified - in real app, use proper JWT validation)
    const token = authHeader.replace('Bearer ', '')
    const user = await prisma.user.findFirst({
      where: {
        // This is a placeholder - implement proper token validation
        OR: [
          { primary_login: token },
          { email: token },
          { phone_e164: token }
        ]
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    // Check if user already has a pending offer for this item
    const existingOffer = await prisma.donationOffer.findFirst({
      where: {
        entry_id: params.id,
        offered_by: user.user_id,
        status: 'OFFERED'
      }
    })

    if (existingOffer) {
      return NextResponse.json({
        error: 'You already have a pending donation offer for this item',
        existingOffer: existingOffer
      }, { status: 400 })
    }

    // Validate condition
    const validConditions = ['NEW', 'GOOD', 'FAIR', 'POOR']
    if (!validConditions.includes(condition)) {
      return NextResponse.json({
        error: 'Invalid condition',
        validConditions
      }, { status: 400 })
    }

    // Create donation offer
    const donationOffer = await prisma.donationOffer.create({
      data: {
        entry_id: params.id,
        offered_by: user.user_id,
        donor_name: donorName,
        donor_contact: donorContact,
        quantity_offered: quantityOffered,
        condition,
        available_date: availableDate ? new Date(availableDate) : null,
        delivery_method: deliveryMethod,
        notes
      },
      include: {
        donor: {
          select: {
            user_id: true,
            primary_login: true,
            email: true,
            phone_e164: true
          }
        },
        inventory_entry: {
          include: {
            item_type: true,
            provider: true
          }
        }
      }
    })

    console.log('Donation offer created successfully:', donationOffer.offer_id)
    return NextResponse.json({ donationOffer })
  } catch (error) {
    console.error('Error creating donation offer:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
