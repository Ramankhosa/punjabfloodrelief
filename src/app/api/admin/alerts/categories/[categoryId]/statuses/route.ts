import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-middleware'
import { logAuthEvent } from '@/lib/auth'
import { AuthenticatedRequest } from '@/lib/auth-middleware'

// Validation schema for creating status
const createStatusSchema = z.object({
  name: z.string().min(1, 'Status name is required').max(50),
  value: z.string().min(1, 'Status value is required').max(50),
  color: z.string().min(1, 'Color is required'),
  order_index: z.number().int().min(0).optional()
})

// Create a new alert status for a category
async function createAlertStatus(request: AuthenticatedRequest, { params }: { params: { categoryId: string } }) {
  try {
    const { categoryId } = params
    const body = await request.json()
    const validatedData = createStatusSchema.parse(body)

    // Verify category exists
    const category = await prisma.alertCategory.findUnique({
      where: { category_id: categoryId }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Alert category not found' },
        { status: 404 }
      )
    }

    // Check if status name already exists in this category
    const existingStatus = await prisma.alertStatus.findUnique({
      where: {
        category_id_name: {
          category_id: categoryId,
          name: validatedData.name
        }
      }
    })

    if (existingStatus) {
      return NextResponse.json(
        { error: 'Status with this name already exists in this category' },
        { status: 409 }
      )
    }

    // Check if status value already exists in this category
    const existingValue = await prisma.alertStatus.findUnique({
      where: {
        category_id_value: {
          category_id: categoryId,
          value: validatedData.value
        }
      }
    })

    if (existingValue) {
      return NextResponse.json(
        { error: 'Status with this value already exists in this category' },
        { status: 409 }
      )
    }

    const status = await prisma.alertStatus.create({
      data: {
        category_id: categoryId,
        ...validatedData,
        order_index: validatedData.order_index || 0
      }
    })

    await logAuthEvent(request.user.user_id, 'create_alert_status', {
      category_id: categoryId,
      status_id: status.status_id,
      status_name: status.name,
      status_value: status.value
    })

    return NextResponse.json({ status }, { status: 201 })
  } catch (error) {
    console.error('Error creating alert status:', error)

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

// Export handlers with role requirements
export const POST = requireRole(['admin'], createAlertStatus)
