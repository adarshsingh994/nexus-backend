import { NextRequest, NextResponse } from 'next/server';
import { lightsService } from '../lights/services/globalInstances';
import { corsHeaders } from '../shared/config';
import {
  LightControlError,
  InvalidInputError,
  SystemError
} from '../lights/errors/lightControlErrors';

export async function GET() {
  try {
    const groups = Array.from(lightsService.getAllGroups());

    return NextResponse.json(
      {
        message: `Found ${groups.length} group(s)`,
        success: true,
        data: {
          count: groups.length,
          groups: groups
        }
      },
      {
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error('Error getting groups:', error);
    return NextResponse.json(
      {
        message: 'Failed to get groups',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.id || !data.name) {
      throw new InvalidInputError('Group ID and name are required');
    }

    const group = lightsService.createGroup(data.id, data.name, data.description);

    return NextResponse.json(
      {
        message: 'Group created successfully',
        success: true,
        data: group
      },
      {
        status: 201,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error('Error creating group:', error);

    if (error instanceof InvalidInputError) {
      return NextResponse.json(
        {
          message: error.message,
          success: false
        },
        {
          status: 400,
          headers: corsHeaders
        }
      );
    }

    return NextResponse.json(
      {
        message: 'Failed to create group',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      'Allow': 'GET, POST, OPTIONS'
    }
  });
}