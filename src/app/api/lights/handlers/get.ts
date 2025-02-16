import { NextRequest, NextResponse } from 'next/server';
import {
  LightControlError,
  InvalidInputError,
  ProcessTimeoutError,
  SystemError
} from '../errors/lightControlErrors';
import lightsService from '../services/globalInstance';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get('action');
    const color = req.nextUrl.searchParams.get('color')?.split(',').map(Number);
    const intensity = Number(req.nextUrl.searchParams.get('intensity'));

    let response;

    console.log('Action received:', action);
    console.log('Current bulbs:', lightsService.getBulbs());

    switch (action) {
      case 'on':
        console.log('Turning on lights');
        response = await lightsService.turnOnLights();
        return NextResponse.json(
          {
            message: response.overall_success
              ? 'All lights turned on successfully'
              : 'Some lights failed to turn on',
            overall_success: response.overall_success,
            results: response.results
          },
          {
            status: response.overall_success ? 200 : 207,
            headers: corsHeaders
          }
        );

      case 'off':
        console.log('Turning off lights');
        response = await lightsService.turnOffLights();
        return NextResponse.json(
          {
            message: response.overall_success
              ? 'All lights turned off successfully'
              : 'Some lights failed to turn off',
            overall_success: response.overall_success,
            results: response.results
          },
          {
            status: response.overall_success ? 200 : 207,
            headers: corsHeaders
          }
        );

      case 'warm_white':
        console.log('Setting light warm white:', intensity);
        response = await lightsService.setWarmWhite(intensity);
        return NextResponse.json(
          {
            message: response.overall_success
              ? `All lights set to warm white with intensity ${intensity} successfully`
              : 'Some lights failed to set warm white',
            overall_success: response.overall_success,
            results: response.results
          },
          {
            status: response.overall_success ? 200 : 207,
            headers: corsHeaders
          }
        );

      case 'cold_white':
        console.log('Setting light cold white:', intensity);
        response = await lightsService.setColdWhite(intensity);
        return NextResponse.json(
          {
            message: response.overall_success
              ? `All lights set to cold white with intensity ${intensity} successfully`
              : 'Some lights failed to set cold white',
            overall_success: response.overall_success,
            results: response.results
          },
          {
            status: response.overall_success ? 200 : 207,
            headers: corsHeaders
          }
        );

      case 'color':
        console.log('Changing light color:', color);
        response = await lightsService.setColor(color!);
        return NextResponse.json(
          {
            message: response.overall_success
              ? `All lights set to RGB color (${color?.join(', ')}) successfully`
              : 'Some lights failed to set color',
            overall_success: response.overall_success,
            results: response.results
          },
          {
            status: response.overall_success ? 200 : 207,
            headers: corsHeaders
          }
        );

      default:
        const bulbs = lightsService.getBulbs()

        return NextResponse.json(
          {
            message: `Found ${bulbs.length} light(s) on the network`,
            success: true,
            data: {
              count: bulbs.length,
              bulbs: bulbs
            }
          },
          {
            status: 200,
            headers: corsHeaders
          }
        )
    }
  } catch (error) {
    console.error('Error in lights API:', error);

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
