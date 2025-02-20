import { NextRequest, NextResponse } from 'next/server';
import { lightsService } from '../../../lights/services/globalInstances';
import { corsHeaders } from '../../../shared/config';
import {
  LightControlError,
  InvalidInputError,
  ProcessTimeoutError,
  SystemError
} from '../../../lights/errors/lightControlErrors';

interface GroupActionRequest {
  action: 'turnOn' | 'turnOff' | 'setWarmWhite' | 'setColdWhite' | 'setColor';
  params?: {
    intensity?: number;
    color?: [number, number, number];
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    const data = await request.json() as GroupActionRequest;

    if (!data.action) {
      throw new InvalidInputError('Action is required');
    }

    let response;
    switch (data.action) {
      case 'turnOn':
        response = await lightsService.turnOnGroup(groupId);
        break;
      case 'turnOff':
        response = await lightsService.turnOffGroup(groupId);
        break;
      case 'setWarmWhite':
        if (typeof data.params?.intensity !== 'number') {
          throw new InvalidInputError('Intensity is required for setWarmWhite action');
        }
        response = await lightsService.setGroupWarmWhite(groupId, data.params.intensity);
        break;
      case 'setColdWhite':
        if (typeof data.params?.intensity !== 'number') {
          throw new InvalidInputError('Intensity is required for setColdWhite action');
        }
        response = await lightsService.setGroupColdWhite(groupId, data.params.intensity);
        break;
      case 'setColor':
        if (!Array.isArray(data.params?.color) || data.params.color.length !== 3) {
          throw new InvalidInputError('Valid RGB color array is required for setColor action');
        }
        response = await lightsService.setGroupColor(groupId, data.params.color);
        break;
      default:
        throw new InvalidInputError(`Unsupported action: ${data.action}`);
    }

    return NextResponse.json(
      {
        message: response.message,
        overall_success: response.overall_success,
        results: response.results
      },
      {
        status: response.overall_success ? 200 : 207,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error('Error in group action:', error);

    if (error instanceof InvalidInputError) {
      return NextResponse.json(
        { message: error.message, code: error.code },
        { status: 400, headers: corsHeaders }
      );
    }

    if (error instanceof ProcessTimeoutError) {
      return NextResponse.json(
        {
          message: 'Operation timed out',
          code: error.code,
          retriable: true
        },
        { status: 504, headers: corsHeaders }
      );
    }

    if (error instanceof LightControlError) {
      return NextResponse.json(
        {
          message: error.message,
          code: error.code,
          retriable: error.retriable
        },
        { status: 502, headers: corsHeaders }
      );
    }

    if (error instanceof SystemError) {
      return NextResponse.json(
        {
          message: 'Internal system error',
          code: error.code
        },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      'Allow': 'POST, OPTIONS'
    }
  });
}