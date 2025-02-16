import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { SystemError } from '../errors/lightControlErrors';

export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private venvPath: string;
  private pythonPath: string;
  private initialized: boolean = false;

  private constructor() {
    console.log('Creating new instance of EnvironmentManager');
    const isWindows = process.platform === 'win32';
    this.venvPath = join('python_scripts', '.venv');
    this.pythonPath = isWindows
      ? join(this.venvPath, 'Scripts', 'python.exe')
      : join(this.venvPath, 'bin', 'python');
  }

  static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  private async executeCommand(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args);
      let output = '';
      let error = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        error += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          reject(new Error(`Command failed with code ${code}: ${error}`));
        }
      });

      process.on('error', reject);
    });
  }

  async validatePythonVersion(): Promise<boolean> {
    try {
      const output = await this.executeCommand(this.pythonPath, ['--version']);
      const version = output.split(' ')[1];
      const [major, minor] = version.split('.').map(Number);
      
      // Require Python 3.7 or higher
      return major === 3 && minor >= 7;
    } catch (error) {
      console.error('Failed to validate Python version:', error);
      return false;
    }
  }

  async validateDependencies(): Promise<boolean> {
    try {
      const requirementsPath = join('python_scripts', 'requirements.txt');
      if (!existsSync(requirementsPath)) {
        throw new Error('requirements.txt not found');
      }

      const output = await this.executeCommand(
        this.pythonPath,
        ['-m', 'pip', 'freeze']
      );
      
      const installedPackages = new Set(
        output.split('\n').map(line => line.split('==')[0].toLowerCase())
      );

      const requiredPackages = new Set(
        readFileSync(requirementsPath, 'utf-8')
          .split('\n')
          .filter(line => line.trim())
          .map(line => line.split('==')[0].toLowerCase())
      );

      for (const pkg of requiredPackages) {
        if (!installedPackages.has(pkg)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to validate dependencies:', error);
      return false;
    }
  }

  async validateScripts(): Promise<boolean> {
    const requiredScripts = [
      'get_lights.py',
      'set_lights_cold_white.py',
      'set_lights_color.py',
      'set_lights_warm_white.py',
      'turn_off_lights.py',
      'turn_on_lights.py'
    ];

    for (const script of requiredScripts) {
      const scriptPath = join('python_scripts', script);
      if (!existsSync(scriptPath)) {
        console.error(`Required script not found: ${script}`);
        return false;
      }
    }

    return true;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const [pythonValid, depsValid, scriptsValid] = await Promise.all([
        this.validatePythonVersion(),
        this.validateDependencies(),
        this.validateScripts()
      ]);

      if (!pythonValid) {
        throw new SystemError('Python 3.7 or higher is required');
      }

      if (!depsValid) {
        throw new SystemError('Missing required Python dependencies');
      }

      if (!scriptsValid) {
        throw new SystemError('Missing required Python scripts');
      }

      this.initialized = true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new SystemError(
        `Failed to initialize Python environment: ${errorMessage}`
      );
    }
  }

  getPythonPath(): string {
    if (!this.initialized) {
      throw new SystemError('Environment not initialized');
    }
    return this.pythonPath;
  }
}
