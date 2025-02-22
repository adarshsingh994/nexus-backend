import { NextRequest } from 'next/server';
import { lightsService } from '../lights/services/globalInstances';
import { corsResponse, handleCorsPreflightRequest } from '../shared/cors';
import { InvalidInputError } from '../lights/errors/lightControlErrors';

export async function GET() {
  try {
    const groups = Array.from(lightsService.getAllGroups());

    return corsResponse(
      {
        message: `Found ${groups.length} group(s)`,
        success: true,
        data: {
          count: groups.length,
          groups: groups
        }
      },
      {
        status: 200
      }
    );
  } catch (error) {
    console.error('Error getting groups:', error);
    return corsResponse(
      {
        message: 'Failed to get groups',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      {
        status: 500
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

    return corsResponse(
      {
        message: 'Group created successfully',
        success: true,
        data: group
      },
      {
        status: 201
      }
    );
  } catch (error) {
    console.error('Error creating group:', error);

    if (error instanceof InvalidInputError) {
      return corsResponse(
        {
          message: error.message,
          success: false
        },
        {
          status: 400
        }
      );
    }

    return corsResponse(
      {
        message: 'Failed to create group',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      {
        status: 500
      }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new InvalidInputError('Group ID is required');
    }

    lightsService.removeAllRelationships(id);

    return corsResponse(
      {
        message: 'Group deleted successfully',
        success: true
      },
      {
        status: 200
      }
    );
  } catch (error) {
    console.error('Error deleting group:', error);

    if (error instanceof InvalidInputError) {
      return corsResponse(
        {
          message: error.message,
          success: false
        },
        {
          status: 400
        }
      );
    }

    return corsResponse(
      {
        message: 'Failed to delete group',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      {
        status: 500
      }
    );
  }
}

export async function OPTIONS() {
  return handleCorsPreflightRequest();
}