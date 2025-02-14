import { NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function POST() {
  return NextResponse.json(
    { message: 'This is a post request' },
    { 
      status: 200,
      headers: corsHeaders
    }
  )
}
