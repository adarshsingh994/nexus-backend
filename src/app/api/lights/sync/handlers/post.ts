import { NextResponse } from 'next/server'
import lightsService from '../../services/globalInstance'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function POST() {
  console.log('Sync Started')
  console.log('Getting all the lights in the network')
  console.log('Creating light service')
  let response

  console.log('Discovering lights')
  response = await lightsService.discoverLights()
  console.log('Light Discovery', response)

  return NextResponse.json(
    {
      message: response.message,
      success: response.success,
      data: {
        count: response.count,
        bulbs: response.bulbs
      }
    },
    {
      status: response.success ? 200 : 404,
      headers: corsHeaders
    }
  )
}
