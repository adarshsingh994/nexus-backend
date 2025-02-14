import { ChildProcess, spawn } from 'child_process'

let bulbs: string[] = []
let pythonProcesses: ChildProcess[] = []

interface LightResponse {
  message: string
  overall_success?: boolean
  success?: boolean
  results?: Record<string, { success: boolean; message: string }>
  count?: number
  bulbs?: string[]
}

export class LightsService {
  private static instance: LightsService
  
  private constructor() {}

  static getInstance(): LightsService {
    if (!LightsService.instance) {
      LightsService.instance = new LightsService()
    }
    return LightsService.instance
  }

  getBulbs(): string[] {
    return bulbs
  }

  setBulbs(newBulbs: string[]): void {
    bulbs = newBulbs
  }

  async turnOnLights(): Promise<LightResponse> {
    const response = await this.callPythonFile('turn_on_lights', bulbs)
    return JSON.parse(response)
  }

  async turnOffLights(): Promise<LightResponse> {
    const response = await this.callPythonFile('turn_off_lights', bulbs)
    return JSON.parse(response)
  }

  async setWarmWhite(intensity: number): Promise<LightResponse> {
    const request = {
      ips: bulbs,
      intensity
    }
    const response = await this.callPythonFile('set_lights_warm_white', [JSON.stringify(request)])
    return JSON.parse(response)
  }

  async setColdWhite(intensity: number): Promise<LightResponse> {
    const request = {
      ips: bulbs,
      intensity
    }
    const response = await this.callPythonFile('set_lights_cold_white', [JSON.stringify(request)])
    return JSON.parse(response)
  }

  async setColor(color: number[]): Promise<LightResponse> {
    const request = {
      ips: bulbs,
      color
    }
    const response = await this.callPythonFile('set_lights_color', [JSON.stringify(request)])
    return JSON.parse(response)
  }

  async discoverLights(): Promise<LightResponse> {
    const response = await this.callPythonFile('get_lights')
    const data = JSON.parse(response)
    if (data.success) {
      this.setBulbs(data.bulbs)
    }
    return data
  }

  private callPythonFile(name: string, args: string[] = []): Promise<string> {
    return new Promise((resolve, reject) => {
      const venvPythonPath = 'python_scripts/.venv/Scripts/python.exe'; // Windows
      // const venvPythonPath = 'python_scripts/.venv/bin/python'; // macOS/Linux
  
      const scriptPath = `python_scripts/${name}.py`;
      const scriptArgs = [scriptPath, ...args.map(arg => String(arg))];
  
      console.log(`Executing: ${venvPythonPath} ${scriptArgs.join(' ')}`);
  
      const pythonProcess = spawn(venvPythonPath, scriptArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
      
      pythonProcesses.push(pythonProcess);
  
      let output = "";
      let error = "";
  
      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
      });
  
      pythonProcess.stderr.on("data", (data) => {
        error += data.toString();
      });
  
      pythonProcess.on("close", (code) => {
        pythonProcesses = pythonProcesses.filter(p => p !== pythonProcess);
        if (code === 0) {
          resolve(output.trim());
        } else {
          reject(new Error(`Python script exited with code ${code}: ${error.trim()}`));
        }
      });
    });
  }

  cleanup(): void {
    pythonProcesses.forEach(p => p.kill())
  }
}

// Handle cleanup on process termination
process.on("SIGINT", () => {
  console.log("Server shutting down, terminating Python processes...");
  LightsService.getInstance().cleanup();
  process.exit();
});

process.on("SIGTERM", () => {
  console.log("Server shutting down, terminating Python processes...");
  LightsService.getInstance().cleanup();
  process.exit();
});
