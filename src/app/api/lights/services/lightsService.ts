import { ProcessManager } from './processManager';
import { config } from '../config/systemConfig';
import {
  LightControlError,
  InvalidInputError,
  InvalidResponseError,
  SystemError,
  ErrorCode
} from '../errors/lightControlErrors';

interface LightResponse {
  message: string;
  overall_success?: boolean;
  success?: boolean;
  results?: Record<string, { success: boolean; message: string }>;
  count?: number;
  bulbs?: string[];
}

export class LightsService {
  private static instance: LightsService;
  private bulbs: string[] = [];
  private processManager: ProcessManager;
  
  private constructor() {
    this.processManager = ProcessManager.getInstance();
  }

  static getInstance(): LightsService {
    if (!LightsService.instance) {
      console.log('Creating new instance of light service')
      LightsService.instance = new LightsService();
    }
    return LightsService.instance;
  }

  getBulbs(): string[] {
    return this.bulbs;
  }

  private setBulbs(newBulbs: string[]): void {
    this.bulbs = newBulbs;
  }

  private validateIntensity(intensity: number): void {
    if (typeof intensity !== 'number' || intensity < 0 || intensity > 255) {
      throw new InvalidInputError('Intensity must be a number between 0 and 255');
    }
  }

  private validateColor(color: number[]): void {
    if (!Array.isArray(color) || color.length !== 3) {
      throw new InvalidInputError('Color must be an array of 3 RGB values');
    }
    
    for (const value of color) {
      if (typeof value !== 'number' || value < 0 || value > 255) {
        throw new InvalidInputError('RGB values must be numbers between 0 and 255');
      }
    }
  }

  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number = config.lights.control.timeout
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new LightControlError('Operation timed out', ErrorCode.PROCESS_TIMEOUT, true));
      }, timeout);
    });

    return Promise.race([operation(), timeoutPromise]);
  }

  private parseResponse(response: string): LightResponse {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse light control response:', error);
      throw new InvalidResponseError('Failed to parse response from light control script');
    }
  }

  async turnOnLights(): Promise<LightResponse> {
    return this.executeWithTimeout(async () => {
      try {
        const response = await this.processManager.executeScript('turn_on_lights', this.bulbs);
        return this.parseResponse(response);
      } catch (error) {
        if (error instanceof LightControlError) {
          throw error;
        }
        throw new SystemError('Failed to turn on lights');
      }
    });
  }

  async turnOffLights(): Promise<LightResponse> {
    return this.executeWithTimeout(async () => {
      try {
        const response = await this.processManager.executeScript('turn_off_lights', this.bulbs);
        return this.parseResponse(response);
      } catch (error) {
        if (error instanceof LightControlError) {
          throw error;
        }
        throw new SystemError('Failed to turn off lights');
      }
    });
  }

  async setWarmWhite(intensity: number): Promise<LightResponse> {
    this.validateIntensity(intensity);
    
    return this.executeWithTimeout(async () => {
      try {
        const request = {
          ips: this.bulbs,
          intensity
        };
        const response = await this.processManager.executeScript(
          'set_lights_warm_white',
          [JSON.stringify(request)]
        );
        return this.parseResponse(response);
      } catch (error) {
        if (error instanceof LightControlError) {
          throw error;
        }
        throw new SystemError('Failed to set warm white');
      }
    });
  }

  async setColdWhite(intensity: number): Promise<LightResponse> {
    this.validateIntensity(intensity);
    
    return this.executeWithTimeout(async () => {
      try {
        const request = {
          ips: this.bulbs,
          intensity
        };
        const response = await this.processManager.executeScript(
          'set_lights_cold_white',
          [JSON.stringify(request)]
        );
        return this.parseResponse(response);
      } catch (error) {
        if (error instanceof LightControlError) {
          throw error;
        }
        throw new SystemError('Failed to set cold white');
      }
    });
  }

  async setColor(color: number[]): Promise<LightResponse> {
    this.validateColor(color);
    
    return this.executeWithTimeout(async () => {
      try {
        const request = {
          ips: this.bulbs,
          color
        };
        const response = await this.processManager.executeScript(
          'set_lights_color',
          [JSON.stringify(request)]
        );
        return this.parseResponse(response);
      } catch (error) {
        if (error instanceof LightControlError) {
          throw error;
        }
        throw new SystemError('Failed to set color');
      }
    });
  }

  async discoverLights(): Promise<LightResponse> {
    return this.executeWithTimeout(
      async () => {
        try {
          const response = await this.processManager.executeScript('get_lights');
          const data = this.parseResponse(response);
          if (data.success && data.bulbs) {
            console.log('Saving bulbs')
            this.setBulbs(data.bulbs);
            console.log(`Bulbs 1 : ${this.bulbs}`)
          }
          return data
        } catch (error) {
          console.log('light service exception', error)
          if (error instanceof LightControlError) {
            throw error
          }
          throw new SystemError('Failed to discover lights')
        }
      },
      config.lights.discovery.timeout
    );
  }

  cleanup(): void {
    console.log('Cleaning up')
    this.processManager.cleanup()
    console.log(`Bulbs 2 : ${this.bulbs}`)
  }
}

// Handle cleanup on process termination
process.on('SIGINT', () => {
  console.log('Cleaning up LightsService...')
  LightsService.getInstance().cleanup()
});

process.on('SIGTERM', () => {
  console.log('Cleaning up LightsService...')
  LightsService.getInstance().cleanup()
});
