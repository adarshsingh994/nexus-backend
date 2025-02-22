import { NextRequest } from 'next/server';
import {
  LightControlError,
  InvalidInputError,
  ProcessTimeoutError,
  SystemError
} from './errors/lightControlErrors';
import { lightsService, environmentManager } from './services/globalInstances';
import { corsResponse, handleCorsPreflightRequest } from '../shared/cors';

export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get('action');
    const color = req.nextUrl.searchParams.get('color')?.split(',').map(Number);
    const intensity = Number(req.nextUrl.searchParams.get('intensity'));

    console.log('Initializing environment...');
    await environmentManager.initialize();

    let response;

    console.log('Action received:', action);
    console.log('Current bulbs:', lightsService.getBulbs());

    switch (action) {
      case 'on':
        console.log('Turning on lights');
        response = await lightsService.turnOnLights();
        return corsResponse(
          {
            message: response.overall_success
              ? 'All lights turned on successfully'
              : 'Some lights failed to turn on',
            overall_success: response.overall_success,
            results: response.results
          },
          {
            status: response.overall_success ? 200 : 207
          }
        );

      case 'off':
        console.log('Turning off lights');
        response = await lightsService.turnOffLights();
        return corsResponse(
          {
            message: response.overall_success
              ? 'All lights turned off successfully'
              : 'Some lights failed to turn off',
            overall_success: response.overall_success,
            results: response.results
          },
          {
            status: response.overall_success ? 200 : 207
          }
        );

      case 'warm_white':
        console.log('Setting light warm white:', intensity);
        response = await lightsService.setWarmWhite(intensity);
        return corsResponse(
          {
            message: response.overall_success
              ? `All lights set to warm white with intensity ${intensity} successfully`
              : 'Some lights failed to set warm white',
            overall_success: response.overall_success,
            results: response.results
          },
          {
            status: response.overall_success ? 200 : 207
          }
        );

      case 'cold_white':
        console.log('Setting light cold white:', intensity);
        response = await lightsService.setColdWhite(intensity);
        return corsResponse(
          {
            message: response.overall_success
              ? `All lights set to cold white with intensity ${intensity} successfully`
              : 'Some lights failed to set cold white',
            overall_success: response.overall_success,
            results: response.results
          },
          {
            status: response.overall_success ? 200 : 207
          }
        );

      case 'color':
        console.log('Changing light color:', color);
        response = await lightsService.setColor(color!);
        return corsResponse(
          {
            message: response.overall_success
              ? `All lights set to RGB color (${color?.join(', ')}) successfully`
              : 'Some lights failed to set color',
            overall_success: response.overall_success,
            results: response.results
          },
          {
            status: response.overall_success ? 200 : 207
          }
        );

      default:
        const bulbs = lightsService.getBulbs().map(bulb => ({
          ...bulb,
          state: {
            ...bulb.state,
            rgb: bulb.state.rgb ? Array.from(bulb.state.rgb) : undefined
          }
        }));

        return corsResponse(
          {
            message: `Found ${bulbs.length} light(s) on the network`,
            success: true,
            data: {
              count: bulbs.length,
              bulbs: bulbs
            }
          },
          {
            status: 200
          }
        );
    }
  } catch (error) {
    console.error('Error in lights API:', error);

    if (error instanceof InvalidInputError) {
      return corsResponse(
        { message: error.message, code: error.code },
        { status: 400 }
      );
    }

    if (error instanceof ProcessTimeoutError) {
      return corsResponse(
        {
          message: 'Operation timed out',
          code: error.code,
          retriable: true
        },
        { status: 504 }
      );
    }

    if (error instanceof LightControlError) {
      return corsResponse(
        {
          message: error.message,
          code: error.code,
          retriable: error.retriable
        },
        { status: 502 }
      );
    }

    if (error instanceof SystemError) {
      return corsResponse(
        {
          message: 'Internal system error',
          code: error.code
        },
        { status: 500 }
      );
    }

    return corsResponse(
      {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}

export { POST } from './handlers/post'

export async function OPTIONS() {
  return handleCorsPreflightRequest();
}
