import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/inventory/[id] - Get specific inventory entry
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const entry = await prisma.inventoryEntry.findUnique({
      where: { entry_id: params.id },
      include: {
        provider: true,
        item_type: true,
        district: true,
        tehsil: true,
        village: true,
        resupply_requests: {
          include: { requester: true, reviewer: true },
          orderBy: { created_at: 'desc' }
        },
        donation_offers: {
          include: { donor: true, reviewer: true },
          orderBy: { created_at: 'desc' }
        }
      }
    })

    if (!entry) {
      return NextResponse.json({ error: 'Inventory entry not found' }, { status: 404 })
    }

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('Error fetching inventory entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/inventory/[id] - Update inventory entry
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    console.log('Updating inventory entry:', params.id, body)

    const {
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
      status,
      visibility,
      notes,
      evidenceUrls
    } = body

    // Validate quantities
    if (quantityTotal !== undefined && quantityTotal < 0) {
      return NextResponse.json({ error: 'Total quantity cannot be negative' }, { status: 400 })
    }
    if (quantityAvailable !== undefined && quantityAvailable < 0) {
      return NextResponse.json({ error: 'Available quantity cannot be negative' }, { status: 400 })
    }
    if (quantityAvailable !== undefined && quantityTotal !== undefined && quantityAvailable > quantityTotal) {
      return NextResponse.json({ error: 'Available quantity cannot exceed total quantity' }, { status: 400 })
    }

    const updateData: any = {}

    if (quantityTotal !== undefined) updateData.quantity_total = quantityTotal
    if (quantityAvailable !== undefined) updateData.quantity_available = quantityAvailable
    if (condition) updateData.condition = condition
    if (availabilityMode) updateData.availability_mode = availabilityMode
    if (availableFrom !== undefined) updateData.available_from = availableFrom ? new Date(availableFrom) : null
    if (availableUntil !== undefined) updateData.available_until = availableUntil ? new Date(availableUntil) : null
    if (responseHours !== undefined) updateData.response_hours = responseHours
    if (batchNumber !== undefined) updateData.batch_number = batchNumber
    if (expiryDate !== undefined) updateData.expiry_date = expiryDate ? new Date(expiryDate) : null
    if (storageLocation !== undefined) updateData.storage_location = storageLocation
    if (status) updateData.status = status
    if (visibility) updateData.visibility = visibility
    if (notes !== undefined) updateData.notes = notes
    if (evidenceUrls) updateData.evidence_urls = evidenceUrls

    const updatedEntry = await prisma.inventoryEntry.update({
      where: { entry_id: params.id },
      data: updateData,
      include: {
        provider: true,
        item_type: true,
        district: true,
        tehsil: true,
        village: true
      }
    })

    console.log('Inventory entry updated successfully:', params.id)
    return NextResponse.json({ entry: updatedEntry })
  } catch (error) {
    console.error('Error updating inventory entry:', error)
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Inventory entry not found' }, { status: 404 })
    }
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE /api/inventory/[id] - Delete inventory entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if entry exists and get item name for confirmation
    const entry = await prisma.inventoryEntry.findUnique({
      where: { entry_id: params.id },
      include: { item_type: true }
    })

    if (!entry) {
      return NextResponse.json({ error: 'Inventory entry not found' }, { status: 404 })
    }

    // Check for active resupply requests or donation offers
    const activeRequests = await prisma.resupplyRequest.count({
      where: {
        entry_id: params.id,
        status: { in: ['PENDING', 'APPROVED'] }
      }
    })

    const activeOffers = await prisma.donationOffer.count({
      where: {
        entry_id: params.id,
        status: { in: ['OFFERED', 'ACCEPTED'] }
      }
    })

    if (activeRequests > 0 || activeOffers > 0) {
      return NextResponse.json({
        error: 'Cannot delete inventory entry with active requests or offers',
        details: `${activeRequests} active resupply requests, ${activeOffers} active donation offers`
      }, { status: 400 })
    }

    // Delete the inventory entry (cascade will handle related records)
    await prisma.inventoryEntry.delete({
      where: { entry_id: params.id }
    })

    console.log('Inventory entry deleted successfully:', params.id)
    return NextResponse.json({
      message: 'Inventory entry deleted successfully',
      deletedEntry: {
        entry_id: params.id,
        item_name: entry.item_type.name,
        quantity: entry.quantity_total
      }
    })
  } catch (error) {
    console.error('Error deleting inventory entry:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
