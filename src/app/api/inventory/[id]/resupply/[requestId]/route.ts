import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PUT /api/inventory/[id]/resupply/[requestId] - Update resupply request (approve/reject)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string, requestId: string } }
) {
  try {
    const body = await request.json()
    const { status, reviewNotes, reviewedBy } = body

    // Validate status
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'FULFILLED', 'CANCELLED']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({
        error: 'Invalid status',
        validStatuses
      }, { status: 400 })
    }

    // Find the resupply request
    const resupplyRequest = await prisma.resupplyRequest.findUnique({
      where: { request_id: params.requestId },
      include: { inventory_entry: true }
    })

    if (!resupplyRequest) {
      return NextResponse.json({ error: 'Resupply request not found' }, { status: 404 })
    }

    // Verify the request belongs to the correct inventory entry
    if (resupplyRequest.entry_id !== params.id) {
      return NextResponse.json({ error: 'Request does not belong to this inventory entry' }, { status: 400 })
    }

    // Find reviewer user
    let reviewerUser = null
    if (reviewedBy) {
      reviewerUser = await prisma.user.findUnique({
        where: { user_id: reviewedBy }
      })
      if (!reviewerUser) {
        return NextResponse.json({ error: 'Reviewer not found' }, { status: 400 })
      }
    }

    // Update the resupply request
    const updateData: any = {
      status,
      review_notes: reviewNotes
    }

    if (reviewerUser) {
      updateData.reviewed_by = reviewerUser.user_id
      updateData.reviewed_at = new Date()
    }

    const updatedRequest = await prisma.resupplyRequest.update({
      where: { request_id: params.requestId },
      data: updateData,
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
      }
    })

    // If request is fulfilled, potentially update inventory quantities
    if (status === 'FULFILLED') {
      // You could add logic here to update inventory quantities
      // based on the fulfilled resupply request
      console.log(`Resupply request ${params.requestId} marked as fulfilled`)
    }

    console.log(`Resupply request ${params.requestId} updated to ${status}`)
    return NextResponse.json({ resupplyRequest: updatedRequest })
  } catch (error) {
    console.error('Error updating resupply request:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE /api/inventory/[id]/resupply/[requestId] - Delete resupply request
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, requestId: string } }
) {
  try {
    // Verify the request exists and belongs to the correct inventory entry
    const resupplyRequest = await prisma.resupplyRequest.findUnique({
      where: { request_id: params.requestId },
      include: { inventory_entry: { include: { item_type: true } } }
    })

    if (!resupplyRequest) {
      return NextResponse.json({ error: 'Resupply request not found' }, { status: 404 })
    }

    if (resupplyRequest.entry_id !== params.id) {
      return NextResponse.json({ error: 'Request does not belong to this inventory entry' }, { status: 400 })
    }

    // Only allow deletion of pending requests
    if (resupplyRequest.status !== 'PENDING') {
      return NextResponse.json({
        error: 'Only pending requests can be deleted',
        currentStatus: resupplyRequest.status
      }, { status: 400 })
    }

    // Delete the resupply request
    await prisma.resupplyRequest.delete({
      where: { request_id: params.requestId }
    })

    console.log('Resupply request deleted successfully:', params.requestId)
    return NextResponse.json({
      message: 'Resupply request deleted successfully',
      deletedRequest: {
        request_id: params.requestId,
        item_name: resupplyRequest.inventory_entry.item_type.name,
        quantity_requested: resupplyRequest.quantity_requested
      }
    })
  } catch (error) {
    console.error('Error deleting resupply request:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
