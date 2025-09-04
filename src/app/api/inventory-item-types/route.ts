import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/inventory-item-types - List all active inventory item types
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const whereClause: any = {}
    if (!includeInactive) {
      whereClause.is_active = true
    }
    if (category) {
      whereClause.category = category
    }

    const itemTypes = await prisma.inventoryItemType.findMany({
      where: whereClause,
      orderBy: [
        { category: 'asc' },
        { sort_order: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({ itemTypes })
  } catch (error) {
    console.error('Error fetching inventory item types:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/inventory-item-types - Create new inventory item type (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      category,
      subcategory,
      name,
      description,
      icon,
      unit,
      is_perishable,
      shelf_life_days,
      sort_order
    } = body

    // Basic validation
    if (!category || !subcategory || !name) {
      return NextResponse.json({
        error: 'Category, subcategory, and name are required'
      }, { status: 400 })
    }

    // Check if item type already exists
    const existingType = await prisma.inventoryItemType.findFirst({
      where: {
        category,
        subcategory
      }
    })

    if (existingType) {
      return NextResponse.json({
        error: 'Item type with this category and subcategory already exists'
      }, { status: 400 })
    }

    // Validate category enum
    const validCategories = ['FOOD', 'SHELTER', 'MEDICAL', 'WATER_SANITATION', 'TRANSPORT', 'COMMUNICATION', 'OTHER']
    if (!validCategories.includes(category)) {
      return NextResponse.json({
        error: 'Invalid category',
        validCategories
      }, { status: 400 })
    }

    const itemType = await prisma.inventoryItemType.create({
      data: {
        category,
        subcategory,
        name,
        description,
        icon,
        unit: unit || 'pieces',
        is_perishable: is_perishable || false,
        shelf_life_days,
        sort_order: sort_order || 0
      }
    })

    console.log('Inventory item type created successfully:', itemType.item_type_id)
    return NextResponse.json({ itemType })
  } catch (error) {
    console.error('Error creating inventory item type:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
