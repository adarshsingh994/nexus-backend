import { LightsService } from './lightsService';

declare global {
  var lightsService: LightsService | undefined;
}

const lightsService = global.lightsService || LightsService.getInstance();
if (process.env.NODE_ENV !== 'production') global.lightsService = lightsService;

export default lightsService;