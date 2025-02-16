import { ProcessPool } from './processPool';
import { ProcessManager } from './processManager';
import { EnvironmentManager } from './environmentManager';
import { LightsService } from './lightsService';

declare global {
  var processPool: ProcessPool | undefined;
  var processManager: ProcessManager | undefined;
  var environmentManager: EnvironmentManager | undefined;
  var lightsService: LightsService | undefined;
}

const processPool = global.processPool || ProcessPool.getInstance();
const processManager = global.processManager || ProcessManager.getInstance();
const environmentManager = global.environmentManager || EnvironmentManager.getInstance();
const lightsService = global.lightsService || LightsService.getInstance();

if (process.env.NODE_ENV !== 'production') {
  global.processPool = processPool;
  global.processManager = processManager;
  global.environmentManager = environmentManager;
  global.lightsService = lightsService;
}

export {
  processPool,
  processManager,
  environmentManager,
  lightsService
};