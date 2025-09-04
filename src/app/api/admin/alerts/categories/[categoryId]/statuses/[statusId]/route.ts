import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-middleware'
import { logAuthEvent } from '@/lib/auth'
import { AuthenticatedRequest } from '@/lib/auth-middleware'

// Validation schema for updating status
const updateStatusSchema = z.object({
  name: z.string().min(1, 'Status name is required').max(50).optional(),
  value: z.string().min(1, 'Status value is required').max(50).optional(),
  color: z.string().min(1, 'Color is required').optional(),
  order_index: z.number().int().min(0).optional(),
  is_active: z.boolean().optional()
})

// Get a specific alert status
async function getAlertStatus(request: NextRequest, { params }: { params: { categoryId: string, statusId: string } }) {
  try {
    const { categoryId, statusId } = params

    const status = await prisma.alertStatus.findUnique({
      where: { status_id: statusId },
      include: { category: true }
    })

    if (!status || status.category_id !== categoryId) {
      return NextResponse.json(
        { error: 'Alert status not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ status })
  } catch (error) {
    console.error('Error fetching alert status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update an alert status
async function updateAlertStatus(request: AuthenticatedRequest, { params }: { params: { categoryId: string, statusId: string } }) {
  try {
    const { categoryId, statusId } = params
    const body = await request.json()
    const validatedData = updateStatusSchema.parse(body)

    const existingStatus = await prisma.alertStatus.findUnique({
      where: { status_id: statusId },
      include: { category: true }
    })

    if (!existingStatus || existingStatus.category_id !== categoryId) {
      return NextResponse.json(
        { error: 'Alert status not found' },
        { status: 404 }
      )
    }

    // Check for conflicts if name or value is being changed
    if (validatedData.name && validatedData.name !== existingStatus.name) {
      const nameConflict = await prisma.alertStatus.findUnique({
        where: {
          category_id_name: {
            category_id: categoryId,
            name: validatedData.name
          }
        }
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Status with this name already exists in this category' },
          { status: 409 }
        )
      }
    }

    if (validatedData.value && validatedData.value !== existingStatus.value) {
      const valueConflict = await prisma.alertStatus.findUnique({
        where: {
          category_id_value: {
            category_id: categoryId,
            value: validatedData.value
          }
        }
      })

      if (valueConflict) {
        return NextResponse.json(
          { error: 'Status with this value already exists in this category' },
          { status: 409 }
        )
      }
    }

    const updatedStatus = await prisma.alertStatus.update({
      where: { status_id: statusId },
      data: validatedData,
      include: { category: true }
    })

    await logAuthEvent(request.user.user_id, 'update_alert_status', {
      category_id: categoryId,
      status_id: updatedStatus.status_id,
      old_name: existingStatus.name,
      new_name: updatedStatus.name,
      old_value: existingStatus.value,
      new_value: updatedStatus.value
    })

    return NextResponse.json({ status: updatedStatus })
  } catch (error) {
    console.error('Error updating alert status:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid status data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete an alert status (soft delete)
async function deleteAlertStatus(request: AuthenticatedRequest, { params }: { params: { categoryId: string, statusId: string } }) {
  try {
    const { categoryId, statusId } = params

    const status = await prisma.alertStatus.findUnique({
      where: { status_id: statusId },
      include: { category: true }
    })

    if (!status || status.category_id !== categoryId) {
      return NextResponse.json(
        { error: 'Alert status not found' },
        { status: 404 }
      )
    }

    // Soft delete the status
    await prisma.alertStatus.update({
      where: { status_id: statusId },
      data: { is_active: false }
    })

    await logAuthEvent(request.user.user_id, 'delete_alert_status', {
      category_id: categoryId,
      status_id: statusId,
      status_name: status.name,
      status_value: status.value
    })

    return NextResponse.json({ message: 'Alert status deleted successfully' })
  } catch (error) {
    console.error('Error deleting alert status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export handlers with role requirements
export const GET = requireRole(['admin'], getAlertStatus)
export const PUT = requireRole(['admin'], updateAlertStatus)
export const DELETE = requireRole(['admin'], deleteAlertStatus)
