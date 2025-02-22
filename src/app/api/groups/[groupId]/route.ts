import { NextRequest } from 'next/server';
import { lightsService } from '../../lights/services/globalInstances';
import { corsResponse, handleCorsPreflightRequest } from '../../shared/cors';
import { InvalidInputError } from '../../lights/errors/lightControlErrors';
import { BulbInfo } from '../../lights/types/bulb';

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;

    const group = lightsService.getGroup(groupId);
    const bulbs = lightsService.getAllGroupBulbs(groupId);

    return corsResponse(
      {
        message: 'Group details retrieved successfully',
        success: true,
        data: {
          group,
          bulbs: bulbs.map((bulb: BulbInfo) => ({
            ...bulb,
            state: {
              ...bulb.state,
              rgb: bulb.state.rgb ? Array.from(bulb.state.rgb) : undefined
            }
          }))
        }
      },
      {
        status: 200
      }
    );
  } catch (error) {
    console.error('Error getting group:', error);

    if (error instanceof InvalidInputError) {
      return corsResponse(
        {
          message: error.message,
          success: false
        },
        {
          status: 404
        }
      );
    }

    return corsResponse(
      {
        message: 'Failed to get group details',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      {
        status: 500
      }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    const data = await request.json();

    // Ensure group exists
    const group = lightsService.getGroup(groupId);

    // Update group properties
    if (data.name) {
      group.name = data.name;
    }
    if (data.description !== undefined) {
      group.description = data.description;
    }

    return corsResponse(
      {
        message: 'Group updated successfully',
        success: true,
        data: group
      },
      {
        status: 200
      }
    );
  } catch (error) {
    console.error('Error updating group:', error);

    if (error instanceof InvalidInputError) {
      return corsResponse(
        {
          message: error.message,
          success: false
        },
        {
          status: 404
        }
      );
    }

    return corsResponse(
      {
        message: 'Failed to update group',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      {
        status: 500
      }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;

    // This will throw if group doesn't exist
    lightsService.getGroup(groupId);
    
    // Remove all relationships
    lightsService.removeAllRelationships(groupId);

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
          status: 404
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