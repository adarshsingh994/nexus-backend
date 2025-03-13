import { NextRequest } from 'next/server';
import { lightsService } from '../../../lights/services/globalInstances';
import { corsResponse, handleCorsPreflightRequest } from '../../../shared/cors';
import { InvalidInputError } from '../../../lights/errors/lightControlErrors';
import { BulbInfo } from '../../../lights/types/bulb';

interface AddMemberRequest {
  type: 'bulb' | 'group';
  id: string; // bulb IP or group ID
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;

    const group = lightsService.getGroup(groupId);
    const bulbs = lightsService.getAllGroupBulbs(groupId);
    const childGroups = Array.from(group.childGroups).map(id => lightsService.getGroup(id));

    return corsResponse(
      {
        message: 'Group members retrieved successfully',
        success: true,
        data: {
          bulbs: bulbs.map((bulb: BulbInfo) => ({
            ...bulb,
            state: {
              ...bulb.state,
              rgb: bulb.state.rgb ? Array.from(bulb.state.rgb) : undefined
            }
          })),
          childGroups
        }
      },
      {
        status: 200
      }
    );
  } catch (error) {
    console.error('Error getting group members:', error);

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
        message: 'Failed to get group members',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      {
        status: 500
      }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const data = await request.json() as AddMemberRequest;

    if (!data.type || !data.id) {
      throw new InvalidInputError('Member type and ID are required');
    }

    switch (data.type) {
      case 'bulb':
        lightsService.addBulbToGroup(groupId, data.id);
        break;
      case 'group':
        lightsService.addChildGroup(groupId, data.id);
        break;
      default:
        throw new InvalidInputError('Invalid member type');
    }

    return corsResponse(
      {
        message: `${data.type} added to group successfully`,
        success: true
      },
      {
        status: 200
      }
    );
  } catch (error) {
    console.error('Error adding group member:', error);

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
        message: 'Failed to add member to group',
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
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const data = await request.json() as AddMemberRequest;

    if (!data.type || !data.id) {
      throw new InvalidInputError('Member type and ID are required');
    }

    switch (data.type) {
      case 'bulb':
        lightsService.removeBulbFromGroup(groupId, data.id);
        break;
      case 'group':
        lightsService.removeChildGroup(groupId, data.id);
        break;
      default:
        throw new InvalidInputError('Invalid member type');
    }

    return corsResponse(
      {
        message: `${data.type} removed from group successfully`,
        success: true
      },
      {
        status: 200
      }
    );
  } catch (error) {
    console.error('Error removing group member:', error);

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
        message: 'Failed to remove member from group',
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