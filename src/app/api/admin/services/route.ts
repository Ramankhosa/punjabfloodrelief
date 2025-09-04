import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-middleware'
import { logAuthEvent } from '@/lib/auth'
import { AuthenticatedRequest } from '@/lib/auth-middleware'

// Validation schemas
const createServiceSchema = z.object({
  broad_category: z.string().min(1, 'Broad category is required').max(100),
  subcategory: z.string().min(1, 'Subcategory is required').max(100),
})

// Update schema defined but not used in this file - used in [serviceId]/route.ts

const getServicesQuerySchema = z.object({
  broad_category: z.string().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0),
})

// Get all services with optional filtering
async function getAllServices(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const validatedQuery = getServicesQuerySchema.parse(queryParams)

    const { broad_category, limit, offset } = validatedQuery

    const where = broad_category ? { broad_category } : {}

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        orderBy: [
          { broad_category: 'asc' },
          { subcategory: 'asc' }
        ],
        take: limit,
        skip: offset,
      }),
      prisma.service.count({ where }),
    ])

    return NextResponse.json({
      services,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching services:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create a new service
async function createService(request: AuthenticatedRequest) {
  try {
    const userId = request.user.user_id
    const body = await request.json()
    const validatedData = createServiceSchema.parse(body)

    // Check if service already exists
    const existingService = await prisma.service.findUnique({
      where: {
        broad_category_subcategory: {
          broad_category: validatedData.broad_category,
          subcategory: validatedData.subcategory,
        }
      }
    })

    if (existingService) {
      return NextResponse.json(
        { error: 'Service with this broad category and subcategory already exists' },
        { status: 409 }
      )
    }

    const service = await prisma.service.create({
      data: validatedData
    })

    // Log the creation
    await logAuthEvent(userId, 'create_service', {
      target_type: 'service',
      target_id: service.service_id,
      broad_category: service.broad_category,
      subcategory: service.subcategory
    })

    return NextResponse.json({ service }, { status: 201 })
  } catch (error) {
    console.error('Error creating service:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid service data', details: error.errors },
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
export const GET = requireRole(['admin'], getAllServices)
export const POST = requireRole(['admin'], createService)
