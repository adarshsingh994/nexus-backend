import { ProcessManager } from './processManager';
import { config } from '../config/systemConfig';
import {
  LightControlError,
  InvalidInputError,
  InvalidResponseError,
  SystemError,
  ErrorCode
} from '../errors/lightControlErrors';
import { BulbInfo, BulbState, LightGroup, LightResponse } from '../types/bulb';

export class LightsService {
  private static instance: LightsService;
  private bulbs: BulbInfo[] = [];
  private groups: Map<string, LightGroup> = new Map();
  private processManager: ProcessManager;
  
  private constructor() {
    this.processManager = ProcessManager.getInstance();
  }

  // Group Management Methods
  createGroup(id: string, name: string, description?: string): LightGroup {
    if (this.groups.has(id)) {
      throw new InvalidInputError(`Group with ID ${id} already exists`);
    }

    const group: LightGroup = {
      id,
      name,
      description,
      parentGroups: new Set(),
      childGroups: new Set(),
      bulbs: new Set()
    };

    this.groups.set(id, group);
    return group;
  }

  getGroup(groupId: string): LightGroup {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new InvalidInputError(`Group ${groupId} not found`);
    }
    return group;
  }

  getAllGroups(): LightGroup[] {
    return Array.from(this.groups.values());
  }

  addBulbToGroup(groupId: string, bulbIp: string): void {
    const group = this.getGroup(groupId);
    const bulb = this.bulbs.find(b => b.ip === bulbIp);
    if (!bulb) {
      throw new InvalidInputError(`Bulb with IP ${bulbIp} not found`);
    }
    group.bulbs.add(bulbIp);
  }

  removeBulbFromGroup(groupId: string, bulbIp: string): void {
    const group = this.getGroup(groupId);
    group.bulbs.delete(bulbIp);
  }

  addChildGroup(parentId: string, childId: string): void {
    const parent = this.getGroup(parentId);
    const child = this.getGroup(childId);

    // Check for circular dependency
    if (this.isGroupInHierarchy(childId, parentId)) {
      throw new InvalidInputError('Circular group dependency detected');
    }

    parent.childGroups.add(childId);
    child.parentGroups.add(parentId);
  }

  removeChildGroup(parentId: string, childId: string): void {
    const parent = this.getGroup(parentId);
    const child = this.getGroup(childId);

    parent.childGroups.delete(childId);
    child.parentGroups.delete(parentId);
  }

  removeAllRelationships(groupId: string): void {
    const group = this.getGroup(groupId);
    
    // Remove all parent relationships
    for (const parentId of group.parentGroups) {
      const parent = this.groups.get(parentId);
      if (parent) {
        parent.childGroups.delete(groupId);
      }
    }

    // Remove all child relationships
    for (const childId of group.childGroups) {
      const child = this.groups.get(childId);
      if (child) {
        child.parentGroups.delete(groupId);
      }
    }

    // Remove the group itself
    this.groups.delete(groupId);
  }

  private isGroupInHierarchy(groupId: string, targetId: string): boolean {
    const group = this.groups.get(groupId);
    if (!group) return false;
    if (group.childGroups.has(targetId)) return true;

    for (const childId of group.childGroups) {
      if (this.isGroupInHierarchy(childId, targetId)) return true;
    }
    return false;
  }

  getAllGroupBulbs(groupId: string): BulbInfo[] {
    // Verify the group exists (will throw if not found)
    this.getGroup(groupId);
    const bulbIps = new Set<string>();
    
    const processGroup = (gId: string): void => {
      const g = this.groups.get(gId);
      if (!g) return;
      
      g.bulbs.forEach((ip: string) => bulbIps.add(ip));
      g.childGroups.forEach((childId: string) => processGroup(childId));
    };
    
    // Process the initial group
    processGroup(groupId);
    
    // Return BulbInfo objects for all collected IPs
    return this.bulbs.filter(bulb => bulbIps.has(bulb.ip));
  }

  getParentGroups(groupId: string): LightGroup[] {
    const group = this.getGroup(groupId);
    const parentGroups: LightGroup[] = [];
    
    const processParents = (g: LightGroup): void => {
      g.parentGroups.forEach((parentId: string) => {
        const parent = this.groups.get(parentId);
        if (parent) {
          parentGroups.push(parent);
          processParents(parent);
        }
      });
    };
    
    processParents(group);
    return parentGroups;
  }

  // Group-based Light Control Methods
  async turnOnGroup(groupId: string): Promise<LightResponse> {
    const bulbs = this.getAllGroupBulbs(groupId);
    return this.executeWithTimeout(async () => {
      try {
        const request = {
          ips: bulbs.map(bulb => bulb.ip)
        };
        const response = await this.processManager.executeScript('turn_on_lights', [JSON.stringify(request)]);
        const parsedResponse = this.parseResponse(response);
        
        // If overall success or partial success, update the states of successful bulbs
        if (parsedResponse.success || parsedResponse.overall_success) {
          this.updateBulbStates(
            request.ips,
            { isOn: true },
            parsedResponse.results
          );
        }
        
        return parsedResponse;
      } catch (error) {
        if (error instanceof LightControlError) {
          throw error;
        }
        throw new SystemError('Failed to turn on group lights');
      }
    });
  }

  async turnOffGroup(groupId: string): Promise<LightResponse> {
    const bulbs = this.getAllGroupBulbs(groupId);
    return this.executeWithTimeout(async () => {
      try {
        const request = {
          ips: bulbs.map(bulb => bulb.ip)
        };
        const response = await this.processManager.executeScript('turn_off_lights', [JSON.stringify(request)]);
        const parsedResponse = this.parseResponse(response);
        
        // If overall success or partial success, update the states of successful bulbs
        if (parsedResponse.success || parsedResponse.overall_success) {
          this.updateBulbStates(
            request.ips,
            { isOn: false },
            parsedResponse.results
          );
        }
        
        return parsedResponse;
      } catch (error) {
        if (error instanceof LightControlError) {
          throw error;
        }
        throw new SystemError('Failed to turn off group lights');
      }
    });
  }

  async setGroupWarmWhite(groupId: string, intensity: number): Promise<LightResponse> {
    this.validateIntensity(intensity);
    const bulbs = this.getAllGroupBulbs(groupId);
    
    return this.executeWithTimeout(async () => {
      try {
        const request = {
          ips: bulbs.map(bulb => bulb.ip),
          intensity
        };
        const response = await this.processManager.executeScript(
          'set_lights_warm_white',
          [JSON.stringify(request)]
        );
        const parsedResponse = this.parseResponse(response);
        
        // If overall success or partial success, update the states of successful bulbs
        if (parsedResponse.success || parsedResponse.overall_success) {
          this.updateBulbStates(
            request.ips,
            { isOn: true, warmWhite: intensity, coldWhite: 0, rgb: undefined },
            parsedResponse.results
          );
        }
        
        return parsedResponse;
      } catch (error) {
        if (error instanceof LightControlError) {
          throw error;
        }
        throw new SystemError('Failed to set group warm white');
      }
    });
  }

  async setGroupColdWhite(groupId: string, intensity: number): Promise<LightResponse> {
    this.validateIntensity(intensity);
    const bulbs = this.getAllGroupBulbs(groupId);
    
    return this.executeWithTimeout(async () => {
      try {
        const request = {
          ips: bulbs.map(bulb => bulb.ip),
          intensity
        };
        const response = await this.processManager.executeScript(
          'set_lights_cold_white',
          [JSON.stringify(request)]
        );
        const parsedResponse = this.parseResponse(response);
        
        // If overall success or partial success, update the states of successful bulbs
        if (parsedResponse.success || parsedResponse.overall_success) {
          this.updateBulbStates(
            request.ips,
            { isOn: true, coldWhite: intensity, warmWhite: 0, rgb: undefined },
            parsedResponse.results
          );
        }
        
        return parsedResponse;
      } catch (error) {
        if (error instanceof LightControlError) {
          throw error;
        }
        throw new SystemError('Failed to set group cold white');
      }
    });
  }

  async setGroupColor(groupId: string, color: number[]): Promise<LightResponse> {
    this.validateColor(color);
    const bulbs = this.getAllGroupBulbs(groupId);
    
    return this.executeWithTimeout(async () => {
      try {
        const request = {
          ips: bulbs.map(bulb => bulb.ip),
          color
        };
        const response = await this.processManager.executeScript(
          'set_lights_color',
          [JSON.stringify(request)]
        );
        const parsedResponse = this.parseResponse(response);
        
        // If overall success or partial success, update the states of successful bulbs
        if (parsedResponse.success || parsedResponse.overall_success) {
          this.updateBulbStates(
            request.ips,
            { isOn: true, rgb: color as [number, number, number], warmWhite: 0, coldWhite: 0 },
            parsedResponse.results
          );
        }
        
        return parsedResponse;
      } catch (error) {
        if (error instanceof LightControlError) {
          throw error;
        }
        throw new SystemError('Failed to set group color');
      }
    });
  }

  static getInstance(): LightsService {
    if (!LightsService.instance) {
      console.log('Creating new instance of light service')
      LightsService.instance = new LightsService();
    }
    return LightsService.instance;
  }

  getBulbs(): BulbInfo[] {
    return this.bulbs;
  }

  private setBulbs(newBulbs: BulbInfo[]): void {
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

  private updateBulbStates(
    ips: string[],
    stateUpdates: Partial<BulbState>,
    results?: Record<string, { success: boolean; message: string }>
  ): void {
    // For each IP in the list
    ips.forEach(ip => {
      // If we have results and this specific bulb action failed, skip it
      if (results && results[ip] && !results[ip].success) {
        return;
      }
      
      // Find the bulb in our list
      const bulbIndex = this.bulbs.findIndex(bulb => bulb.ip === ip);
      if (bulbIndex !== -1) {
        // Update the bulb state with the new values
        this.bulbs[bulbIndex].state = {
          ...this.bulbs[bulbIndex].state,
          ...stateUpdates
        };
      }
    });
  }

  async turnOnLights(): Promise<LightResponse> {
    return this.executeWithTimeout(async () => {
      try {
        const request = {
          ips: this.bulbs.map(bulb => bulb.ip)
        };
        const response = await this.processManager.executeScript('turn_on_lights', [JSON.stringify(request)]);
        const parsedResponse = this.parseResponse(response);
        
        // If overall success or partial success, update the states of successful bulbs
        if (parsedResponse.success || parsedResponse.overall_success) {
          this.updateBulbStates(
            request.ips,
            { isOn: true },
            parsedResponse.results
          );
        }
        
        return parsedResponse;
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
        const request = {
          ips: this.bulbs.map(bulb => bulb.ip)
        };
        const response = await this.processManager.executeScript('turn_off_lights', [JSON.stringify(request)]);
        const parsedResponse = this.parseResponse(response);
        
        // If overall success or partial success, update the states of successful bulbs
        if (parsedResponse.success || parsedResponse.overall_success) {
          this.updateBulbStates(
            request.ips,
            { isOn: false },
            parsedResponse.results
          );
        }
        
        return parsedResponse;
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
          ips: this.bulbs.map(bulb => bulb.ip),
          intensity
        };
        const response = await this.processManager.executeScript(
          'set_lights_warm_white',
          [JSON.stringify(request)]
        );
        const parsedResponse = this.parseResponse(response);
        
        // If overall success or partial success, update the states of successful bulbs
        if (parsedResponse.success || parsedResponse.overall_success) {
          this.updateBulbStates(
            request.ips,
            { isOn: true, warmWhite: intensity, coldWhite: 0, rgb: undefined },
            parsedResponse.results
          );
        }
        
        return parsedResponse;
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
          ips: this.bulbs.map(bulb => bulb.ip),
          intensity
        };
        const response = await this.processManager.executeScript(
          'set_lights_cold_white',
          [JSON.stringify(request)]
        );
        const parsedResponse = this.parseResponse(response);
        
        // If overall success or partial success, update the states of successful bulbs
        if (parsedResponse.success || parsedResponse.overall_success) {
          this.updateBulbStates(
            request.ips,
            { isOn: true, coldWhite: intensity, warmWhite: 0, rgb: undefined },
            parsedResponse.results
          );
        }
        
        return parsedResponse;
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
          ips: this.bulbs.map(bulb => bulb.ip),
          color
        };
        const response = await this.processManager.executeScript(
          'set_lights_color',
          [JSON.stringify(request)]
        );
        const parsedResponse = this.parseResponse(response);
        
        // If overall success or partial success, update the states of successful bulbs
        if (parsedResponse.success || parsedResponse.overall_success) {
          this.updateBulbStates(
            request.ips,
            { isOn: true, rgb: color as [number, number, number], warmWhite: 0, coldWhite: 0 },
            parsedResponse.results
          );
        }
        
        return parsedResponse;
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
            console.log(`Discovered ${this.bulbs.length} bulbs with details`)
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
    console.log(`Stored bulbs: ${JSON.stringify(this.bulbs, null, 2)}`)
  }
}

