import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-middleware'
import { logAuthEvent } from '@/lib/auth'
import { AuthenticatedRequest } from '@/lib/auth-middleware'

// Validation schema
const updateServiceSchema = z.object({
  broad_category: z.string().min(1, 'Broad category is required').max(100).optional(),
  subcategory: z.string().min(1, 'Subcategory is required').max(100).optional(),
})

// Get a specific service
async function getService(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const { serviceId } = params

    const service = await prisma.service.findUnique({
      where: { service_id: serviceId }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ service })
  } catch (error) {
    console.error('Error fetching service:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update a service
async function updateService(request: AuthenticatedRequest, { params }: { params: { serviceId: string } }) {
  try {
    const userId = request.user.user_id
    const { serviceId } = params
    const body = await request.json()
    const validatedData = updateServiceSchema.parse(body)

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { service_id: serviceId }
    })

    if (!existingService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Check for duplicate if both fields are being updated
    if (validatedData.broad_category && validatedData.subcategory) {
      const duplicateService = await prisma.service.findUnique({
        where: {
          broad_category_subcategory: {
            broad_category: validatedData.broad_category,
            subcategory: validatedData.subcategory,
          }
        }
      })

      if (duplicateService && duplicateService.service_id !== serviceId) {
        return NextResponse.json(
          { error: 'Service with this broad category and subcategory already exists' },
          { status: 409 }
        )
      }
    }

    const updatedService = await prisma.service.update({
      where: { service_id: serviceId },
      data: validatedData
    })

    // Log the update
    await logAuthEvent(userId, 'update_service', {
      target_type: 'service',
      target_id: updatedService.service_id,
      old_broad_category: existingService.broad_category,
      old_subcategory: existingService.subcategory,
      new_broad_category: updatedService.broad_category,
      new_subcategory: updatedService.subcategory
    })

    return NextResponse.json({ service: updatedService })
  } catch (error) {
    console.error('Error updating service:', error)

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

// Delete a service
async function deleteService(request: AuthenticatedRequest, { params }: { params: { serviceId: string } }) {
  try {
    const userId = request.user.user_id
    const { serviceId } = params

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { service_id: serviceId }
    })

    if (!existingService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    await prisma.service.delete({
      where: { service_id: serviceId }
    })

    // Log the deletion
    await logAuthEvent(userId, 'delete_service', {
      target_type: 'service',
      target_id: serviceId,
      broad_category: existingService.broad_category,
      subcategory: existingService.subcategory
    })

    return NextResponse.json({ message: 'Service deleted successfully' })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export handlers with role requirements
export const GET = requireRole(['admin'], getService)
export const PUT = requireRole(['admin'], updateService)
export const DELETE = requireRole(['admin'], deleteService)
