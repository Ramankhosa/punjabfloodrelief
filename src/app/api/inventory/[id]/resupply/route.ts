import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authenticatedFetch } from '@/lib/auth'

const prisma = new PrismaClient()

// GET /api/inventory/[id]/resupply - Get resupply requests for an inventory entry
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

    const resupplyRequests = await prisma.resupplyRequest.findMany({
      where: whereClause,
      include: {
        requester: {
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

    return NextResponse.json({ resupplyRequests })
  } catch (error) {
    console.error('Error fetching resupply requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/inventory/[id]/resupply - Create resupply request for an inventory entry
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
      quantityRequested,
      urgencyLevel = 'normal',
      reason,
      preferredDeliveryDate
    } = body

    // Validate input
    if (!quantityRequested || quantityRequested <= 0) {
      return NextResponse.json({ error: 'Valid quantity requested is required' }, { status: 400 })
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

    // Check if user already has a pending request for this item
    const existingRequest = await prisma.resupplyRequest.findFirst({
      where: {
        entry_id: params.id,
        requested_by: user.user_id,
        status: 'PENDING'
      }
    })

    if (existingRequest) {
      return NextResponse.json({
        error: 'You already have a pending resupply request for this item',
        existingRequest: existingRequest
      }, { status: 400 })
    }

    // Create resupply request
    const resupplyRequest = await prisma.resupplyRequest.create({
      data: {
        entry_id: params.id,
        requested_by: user.user_id,
        quantity_requested: quantityRequested,
        urgency_level: urgencyLevel,
        reason,
        preferred_delivery_date: preferredDeliveryDate ? new Date(preferredDeliveryDate) : null
      },
      include: {
        requester: {
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

    console.log('Resupply request created successfully:', resupplyRequest.request_id)
    return NextResponse.json({ resupplyRequest })
  } catch (error) {
    console.error('Error creating resupply request:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
