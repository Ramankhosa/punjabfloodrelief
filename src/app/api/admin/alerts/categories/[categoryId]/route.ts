import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-middleware'
import { logAuthEvent } from '@/lib/auth'
import { AuthenticatedRequest } from '@/lib/auth-middleware'

// Validation schema for updating category
const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100).optional(),
  description: z.string().optional(),
  order_index: z.number().int().min(0).optional(),
  is_active: z.boolean().optional()
})

// Get a specific alert category with its statuses
async function getAlertCategory(request: NextRequest, { params }: { params: { categoryId: string } }) {
  try {
    const { categoryId } = params

    const category = await prisma.alertCategory.findUnique({
      where: { category_id: categoryId },
      include: {
        statuses: {
          orderBy: { order_index: 'asc' }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Alert category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error fetching alert category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update an alert category
async function updateAlertCategory(request: AuthenticatedRequest, { params }: { params: { categoryId: string } }) {
  try {
    const { categoryId } = params
    const body = await request.json()
    const validatedData = updateCategorySchema.parse(body)

    const existingCategory = await prisma.alertCategory.findUnique({
      where: { category_id: categoryId }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Alert category not found' },
        { status: 404 }
      )
    }

    // Check if new name conflicts with existing category
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const nameConflict = await prisma.alertCategory.findUnique({
        where: { name: validatedData.name }
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Category with this name already exists' },
          { status: 409 }
        )
      }
    }

    const updatedCategory = await prisma.alertCategory.update({
      where: { category_id: categoryId },
      data: validatedData,
      include: {
        statuses: {
          orderBy: { order_index: 'asc' }
        }
      }
    })

    await logAuthEvent(request.user.user_id, 'update_alert_category', {
      category_id: updatedCategory.category_id,
      old_name: existingCategory.name,
      new_name: updatedCategory.name
    })

    return NextResponse.json({ category: updatedCategory })
  } catch (error) {
    console.error('Error updating alert category:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid category data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete an alert category (soft delete by setting is_active to false)
async function deleteAlertCategory(request: AuthenticatedRequest, { params }: { params: { categoryId: string } }) {
  try {
    const { categoryId } = params

    const category = await prisma.alertCategory.findUnique({
      where: { category_id: categoryId },
      include: { statuses: true }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Alert category not found' },
        { status: 404 }
      )
    }

    // Soft delete the category
    await prisma.alertCategory.update({
      where: { category_id: categoryId },
      data: { is_active: false }
    })

    // Also soft delete all statuses in this category
    await prisma.alertStatus.updateMany({
      where: { category_id: categoryId },
      data: { is_active: false }
    })

    await logAuthEvent(request.user.user_id, 'delete_alert_category', {
      category_id: categoryId,
      category_name: category.name
    })

    return NextResponse.json({ message: 'Alert category deleted successfully' })
  } catch (error) {
    console.error('Error deleting alert category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export handlers with role requirements
export const GET = requireRole(['admin'], getAlertCategory)
export const PUT = requireRole(['admin'], updateAlertCategory)
export const DELETE = requireRole(['admin'], deleteAlertCategory)
