import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-middleware'
import { logAuthEvent } from '@/lib/auth'

// Validation schemas
const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().optional(),
  order_index: z.number().int().min(0).optional()
})

const statusSchema = z.object({
  name: z.string().min(1, 'Status name is required').max(50),
  value: z.string().min(1, 'Status value is required').max(50),
  color: z.string().min(1, 'Color is required'),
  order_index: z.number().int().min(0).optional()
})

// Get all alert categories with their statuses
async function getAllAlertCategories(request: NextRequest) {
  try {
    const categories = await prisma.alertCategory.findMany({
      where: { is_active: true },
      include: {
        statuses: {
          where: { is_active: true },
          orderBy: { order_index: 'asc' }
        }
      },
      orderBy: { order_index: 'asc' }
    })

    return NextResponse.json({
      categories: categories.map(category => ({
        ...category,
        statusCount: category.statuses.length
      }))
    })
  } catch (error) {
    console.error('Error fetching alert categories:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create a new alert category
async function createAlertCategory(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = categorySchema.parse(body)

    // Check if category already exists
    const existingCategory = await prisma.alertCategory.findUnique({
      where: { name: validatedData.name }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 409 }
      )
    }

    const category = await prisma.alertCategory.create({
      data: {
        ...validatedData,
        order_index: validatedData.order_index || 0
      }
    })

    await logAuthEvent(request.user.user_id, 'create_alert_category', {
      category_id: category.category_id,
      category_name: category.name
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Error creating alert category:', error)

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

// Export handlers with role requirements
export const GET = requireRole(['admin'], getAllAlertCategories)
export const POST = requireRole(['admin'], createAlertCategory)
