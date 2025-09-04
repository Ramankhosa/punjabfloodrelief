import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-middleware'
import { logAuthEvent } from '@/lib/auth'
import { AuthenticatedRequest } from '@/lib/auth-middleware'

// Validation schema
const updateStateSchema = z.object({
  state_name: z.string().min(1, 'State name is required').optional()
})

// Get a specific state
async function getState(request: NextRequest, { params }: { params: { stateCode: string } }) {
  try {
    const { stateCode } = params

    const state = await prisma.state.findUnique({
      where: { state_code: stateCode },
      include: {
        districts: {
          include: {
            tehsils: {
              include: {
                villages: true
              }
            }
          }
        }
      }
    })

    if (!state) {
      return NextResponse.json(
        { error: 'State not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ state })
  } catch (error) {
    console.error('Error fetching state:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update a state
async function updateState(request: AuthenticatedRequest, { params }: { params: { stateCode: string } }) {
  try {
    const { stateCode } = params
    const body = await request.json()
    const validatedData = updateStateSchema.parse(body)

    const existingState = await prisma.state.findUnique({
      where: { state_code: stateCode }
    })

    if (!existingState) {
      return NextResponse.json(
        { error: 'State not found' },
        { status: 404 }
      )
    }

    const updatedState = await prisma.state.update({
      where: { state_code: stateCode },
      data: validatedData
    })

    await logAuthEvent(request.user.user_id, 'update_state', {
      state_code: updatedState.state_code,
      old_name: existingState.state_name,
      new_name: updatedState.state_name
    })

    return NextResponse.json({ state: updatedState })
  } catch (error) {
    console.error('Error updating state:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid state data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete a state (only if no districts exist)
async function deleteState(request: AuthenticatedRequest, { params }: { params: { stateCode: string } }) {
  try {
    const { stateCode } = params

    const state = await prisma.state.findUnique({
      where: { state_code: stateCode },
      include: { districts: true }
    })

    if (!state) {
      return NextResponse.json(
        { error: 'State not found' },
        { status: 404 }
      )
    }

    if (state.districts.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete state with existing districts' },
        { status: 409 }
      )
    }

    await prisma.state.delete({
      where: { state_code: stateCode }
    })

    await logAuthEvent(request.user.user_id, 'delete_state', {
      state_code: stateCode,
      state_name: state.state_name
    })

    return NextResponse.json({ message: 'State deleted successfully' })
  } catch (error) {
    console.error('Error deleting state:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export handlers with role requirements
export const GET = requireRole(['admin'], getState)
export const PUT = requireRole(['admin'], updateState)
export const DELETE = requireRole(['admin'], deleteState)
