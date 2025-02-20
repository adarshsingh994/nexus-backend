import { ProcessManager } from './processManager';
import { LightsService } from './lightsService';

import { EnvironmentManager } from './environmentManager';

declare global {
  var __processManager: ProcessManager | undefined;
  var __lightsService: LightsService | undefined;
  var __environmentManager: EnvironmentManager | undefined;
}

// Initialize singletons using global to persist across hot reloads
const processManager = global.__processManager || ProcessManager.getInstance();
const lightsService = global.__lightsService || LightsService.getInstance();
const environmentManager = global.__environmentManager || EnvironmentManager.getInstance();

// Store instances in global
if (process.env.NODE_ENV !== 'production') {
  global.__processManager = processManager;
  global.__lightsService = lightsService;
  global.__environmentManager = environmentManager;
}

// Export instances
export { processManager, lightsService, environmentManager };

// Handle cleanup on process termination
const cleanup = () => {
  console.log('Cleaning up services...');
  processManager.cleanup();
  lightsService.cleanup();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);