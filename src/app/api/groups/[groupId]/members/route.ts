import { NextRequest, NextResponse } from 'next/server';
import { lightsService } from '../../../lights/services/globalInstances';
import { corsHeaders } from '../../../shared/config';
import {
  LightControlError,
  InvalidInputError,
  SystemError
} from '../../../lights/errors/lightControlErrors';
import { BulbInfo } from '../../../lights/types/bulb';

interface AddMemberRequest {
  type: 'bulb' | 'group';
  id: string; // bulb IP or group ID
}

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;

    const group = lightsService.getGroup(groupId);
    const bulbs = lightsService.getAllGroupBulbs(groupId);
    const childGroups = Array.from(group.childGroups).map(id => lightsService.getGroup(id));

    return NextResponse.json(
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
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error('Error getting group members:', error);

    if (error instanceof InvalidInputError) {
      return NextResponse.json(
        {
          message: error.message,
          success: false
        },
        {
          status: 404,
          headers: corsHeaders
        }
      );
    }

    return NextResponse.json(
      {
        message: 'Failed to get group members',
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

export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
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

    return NextResponse.json(
      {
        message: `${data.type} added to group successfully`,
        success: true
      },
      {
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error('Error adding group member:', error);

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
        message: 'Failed to add member to group',
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
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

    return NextResponse.json(
      {
        message: `${data.type} removed from group successfully`,
        success: true
      },
      {
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error('Error removing group member:', error);

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
        message: 'Failed to remove member from group',
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
      'Allow': 'GET, POST, DELETE, OPTIONS'
    }
  });
}