import { ChildProcess, spawn } from 'child_process';
import { ProcessTimeoutError, ProcessFailedError, SystemError } from '../errors/lightControlErrors';

interface ProcessOptions {
  timeout?: number;
  maxRetries?: number;
  backoffFactor?: number;
}

interface QueuedProcess {
  scriptPath: string;
  args: string[];
  options: ProcessOptions;
  resolve: (value: string) => void;
  reject: (error: Error) => void;
}

export class ProcessPool {
  private static instance: ProcessPool;
  private activeProcesses: Set<ChildProcess> = new Set();
  private processQueue: QueuedProcess[] = [];
  private readonly maxConcurrent: number = 5;
  private readonly defaultTimeout: number = 30000; // 30 seconds
  private readonly defaultMaxRetries: number = 3;
  private readonly defaultBackoffFactor: number = 1.5;

  private constructor() {
    console.log('Creating new instance of ProcessPool');
  }

  static getInstance(): ProcessPool {
    if (!ProcessPool.instance) {
      ProcessPool.instance = new ProcessPool();
    }
    return ProcessPool.instance;
  }

  private getVenvPythonPath(): string {
    const isWindows = process.platform === 'win32';
    return isWindows
      ? 'python_scripts/.venv/Scripts/python.exe'
      : 'python_scripts/.venv/bin/python';
  }

  async executeScript(
    scriptName: string,
    args: string[] = [],
    options: ProcessOptions = {}
  ): Promise<string> {
    const scriptPath = `python_scripts/${scriptName}.py`;
    const retryCount = 0;
    
    return this.executeWithRetry(scriptPath, args, retryCount, options);
  }

  private async executeWithRetry(
    scriptPath: string,
    args: string[],
    retryCount: number,
    options: ProcessOptions
  ): Promise<string> {
    try {
      return await this.queueProcess(scriptPath, args, options);
    } catch (error) {
      if (
        error instanceof ProcessTimeoutError ||
        error instanceof ProcessFailedError
      ) {
        const maxRetries = options.maxRetries ?? this.defaultMaxRetries;
        if (retryCount < maxRetries) {
          const backoffFactor = options.backoffFactor ?? this.defaultBackoffFactor;
          const delay = Math.pow(backoffFactor, retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          console.log(`Retrying ${scriptPath} (attempt ${retryCount + 1}/${maxRetries})`);
          return this.executeWithRetry(scriptPath, args, retryCount + 1, options);
        }
      }
      throw error;
    }
  }

  private queueProcess(
    scriptPath: string,
    args: string[],
    options: ProcessOptions
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const queuedProcess: QueuedProcess = {
        scriptPath,
        args,
        options,
        resolve,
        reject
      };

      this.processQueue.push(queuedProcess);
      this.processNextInQueue();
    });
  }

  private processNextInQueue(): void {
    if (
      this.processQueue.length === 0 ||
      this.activeProcesses.size >= this.maxConcurrent
    ) {
      return;
    }

    const { scriptPath, args, options, resolve, reject } = this.processQueue.shift()!;
    
    try {
      this.spawnProcess(scriptPath, args, options)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.processNextInQueue();
        });
    } catch (error: unknown) {
      reject(error instanceof Error ? error : new SystemError('Unknown error occurred'));
      this.processNextInQueue();
    }
  }

  private async spawnProcess(
    scriptPath: string,
    args: string[],
    options: ProcessOptions
  ): Promise<string> {
    const timeout = options.timeout ?? this.defaultTimeout;
    const venvPythonPath = this.getVenvPythonPath();
    const scriptArgs = [scriptPath, ...args.map(String)];

    console.log(`Executing: ${venvPythonPath} ${scriptArgs.join(' ')}`);

    const process = spawn(venvPythonPath, scriptArgs, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    this.activeProcesses.add(process);

    return Promise.race([
      this.handleProcess(process),
      this.createTimeout(timeout, process)
    ]).finally(() => {
      this.activeProcesses.delete(process);
      if (!process.killed) {
        process.kill();
      }
    });
  }

  private handleProcess(process: ChildProcess): Promise<string> {
    return new Promise((resolve, reject) => {
      let output = '';
      let error = '';

      process.stdout?.on('data', (data) => {
        output += data.toString();
      });

      process.stderr?.on('data', (data) => {
        error += data.toString();
      });

      process.on('error', (err) => {
        reject(new SystemError(`Failed to start process: ${err.message}`));
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          reject(new ProcessFailedError(error.trim(), code ?? -1));
        }
      });
    });
  }

  private createTimeout(ms: number, process: ChildProcess): Promise<never> {
    return new Promise((_, reject) => {
      const timeout = setTimeout(() => {
        if (!process.killed) {
          process.kill();
        }
        reject(new ProcessTimeoutError());
      }, ms);

      process.on('close', () => clearTimeout(timeout));
    });
  }

  cleanup(): void {
    for (const process of this.activeProcesses) {
      if (!process.killed) {
        process.kill();
      }
    }
    this.activeProcesses.clear();
    this.processQueue = [];
  }
}
