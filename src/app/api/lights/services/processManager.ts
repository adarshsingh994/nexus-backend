import { ChildProcess, spawn } from 'child_process';
import { join } from 'path';
import { SystemError } from '../errors/lightControlErrors';
import { processPool, environmentManager } from './globalInstances';

interface ProcessMetrics {
  pid: number;
  startTime: number;
  lastActive: number;
}

interface ProcessInfo {
  process: ChildProcess;
  metrics: ProcessMetrics;
  scriptPath: string;
}

export class ProcessManager {
  private static instance: ProcessManager;
  private processes: Map<string, ProcessInfo> = new Map();
  private metricsInterval: NodeJS.Timeout | null = null;
  
  private constructor() {
    throw new Error('Use ProcessManager.createInstance() instead');
  }

  private static async initializeInstance(): Promise<ProcessManager> {
    const instance = Object.create(ProcessManager.prototype);
    console.log('Creating new instance of ProcessManager');
    
    // Initialize environment first
    try {
      await environmentManager.initialize();
    } catch (error) {
      console.error('Failed to initialize environment:', error);
      throw error;
    }
    
    // Initialize other properties
    instance.processes = new Map();
    instance.metricsInterval = null;
    instance.startMetricsCollection();
    
    return instance;
  }

  static async getInstance(): Promise<ProcessManager> {
    if (!ProcessManager.instance) {
      ProcessManager.instance = await ProcessManager.initializeInstance();
    }
    return ProcessManager.instance;
  }

  private startMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 5000); // Collect metrics every 5 seconds
  }

  private async collectMetrics(): Promise<void> {
    const now = Date.now();
    for (const [id, info] of this.processes.entries()) {
      try {
        const process = info.process;
        if (!process.killed && process.pid) {
          info.metrics = {
            ...info.metrics,
            pid: process.pid,
            lastActive: now
          };

          // Check if process has been running too long
          const runningTime = now - info.metrics.startTime;
          if (runningTime > 5 * 60 * 1000) { // 5 minutes
            console.warn(`Process ${id} running too long, terminating...`);
            await this.terminateProcess(id);
          }
        }
      } catch (error) {
        console.error(`Error collecting metrics for process ${id}:`, error);
      }
    }
  }

  private async terminateProcess(id: string): Promise<void> {
    const info = this.processes.get(id);
    if (info && !info.process.killed) {
      try {
        info.process.kill('SIGTERM');
        // Give process time to cleanup
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (!info.process.killed) {
          info.process.kill('SIGKILL');
        }
      } catch (error) {
        console.error(`Error terminating process ${id}:`, error);
      }
    }
    this.processes.delete(id);
  }

  async executeScript(
    scriptName: string,
    args: string[] = []
  ): Promise<string> {
    try {
      // Get validated Python path from already initialized environment
      const pythonPath = environmentManager.getPythonPath();
      
      // Build script path
      const scriptPath = join('python_scripts', `${scriptName}.py`);
      
      // Use ProcessPool for execution
      const result = await processPool.executeScript(scriptName, args);
      return result;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error executing script ${scriptName}:`, error.message);
        throw new SystemError(`Failed to execute script: ${scriptName} - ${error.message}`);
      }
      throw new SystemError(`Failed to execute script: ${scriptName}`);
    }
  }

  cleanup(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    // Cleanup all managed processes
    for (const [id] of this.processes) {
      this.terminateProcess(id).catch(console.error);
    }
  }
}

// Import the global instance instead of creating cleanup handlers here
import { processManager } from './globalInstances';

// Handle cleanup on process termination
process.on('SIGINT', async () => {
  const manager = await processManager;
  manager.cleanup();
});

process.on('SIGTERM', async () => {
  const manager = await processManager;
  manager.cleanup();
});