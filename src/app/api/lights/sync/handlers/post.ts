import { lightsService, environmentManager } from '../../services/globalInstances';
import { corsResponse } from '../../../shared/cors';

export async function POST() {
  try {
    console.log('Initializing environment...');
    await environmentManager.initialize();
    
    console.log('Sync Started');
    console.log('Getting all the lights in the network');
    console.log('Creating light service');

    console.log('Discovering lights');
    const response = await lightsService.discoverLights();
    console.log('Light Discovery', response);

    return corsResponse(
      {
        message: response.message,
        success: response.success,
      },
      {
        status: response.success ? 200 : 404
      }
    );
  } catch (error) {
    console.error('Error in sync POST handler:', error);
    return corsResponse(
      {
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        success: false,
      },
      {
        status: 500
      }
    );
  }
}
