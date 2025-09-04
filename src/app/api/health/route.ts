import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Punjab Flood Relief - Service Request Module',
    version: '1.0.0'
  })
}
