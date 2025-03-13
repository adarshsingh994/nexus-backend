# Scheduling System for Light Control API - Implementation Plan

## Overview

This document outlines the implementation plan for adding scheduling capabilities to the light control API. The scheduling system will allow users to set up recurring actions for lights, such as turning them on at specific times each day.

## Current System Architecture

The existing system consists of:

1. **Next.js API Routes** - Handling HTTP requests for light control
2. **LightsService** - Core service managing light operations
3. **ProcessManager/ProcessPool** - Executing Python scripts to control physical lights
4. **Group Management** - Organizing lights into logical groups

## Scheduling System Components

### 1. Data Model

```typescript
interface Schedule {
  id: string;               // Unique identifier
  name: string;             // User-friendly name
  action: {
    type: string;           // "on", "off", "warm_white", "cold_white", "color"
    parameters?: {          // Optional parameters based on action type
      intensity?: number;   // For warm_white/cold_white
      color?: number[];     // For color
    }
  };
  target: {
    type: "all" | "group";  // Target all lights or a specific group
    groupId?: string;       // Group ID if type is "group"
  };
  timing: {
    type: "daily" | "weekly" | "once"; // Schedule frequency
    time: string;           // Time in HH:MM format (24-hour)
    days?: number[];        // Array of days (0-6, Sunday-Saturday) for weekly schedules
    date?: string;          // ISO date string for one-time schedules
  };
  enabled: boolean;         // Whether the schedule is active
  createdAt: string;        // Creation timestamp
  updatedAt: string;        // Last update timestamp
}
```

### 2. Storage Solution

We'll implement a file-based storage solution initially:

- Store schedules in a JSON file at `data/schedules.json`
- Implement read/write operations with proper error handling and file locking
- Structure the file for easy migration to a database later

### 3. Scheduler Service

The `SchedulerService` will:

- Load schedules from storage on startup
- Calculate and set up timers for each schedule
- Execute light control actions when schedules are triggered
- Provide CRUD operations for managing schedules

### 4. API Endpoints

New API endpoints:

1. `GET /api/schedules` - List all schedules
2. `POST /api/schedules` - Create a new schedule
3. `GET /api/schedules/:id` - Get a specific schedule
4. `PUT /api/schedules/:id` - Update a schedule
5. `DELETE /api/schedules/:id` - Delete a schedule
6. `PATCH /api/schedules/:id/toggle` - Enable/disable a schedule

## Implementation Steps

### Phase 1: Core Scheduler Implementation

1. **Create Schedule Storage**
   - Implement file-based storage for schedules
   - Add methods for CRUD operations on schedules

2. **Implement Scheduler Service**
   - Create a singleton service to manage schedules
   - Implement schedule loading and timer setup
   - Add methods to execute scheduled actions

3. **Connect to Light Control**
   - Integrate with LightsService for executing light actions
   - Ensure proper error handling for failed actions

### Phase 2: API Implementation

1. **Create API Routes**
   - Implement Next.js API routes for schedule management
   - Add validation for schedule creation/updates

2. **Implement API Handlers**
   - Create handlers for each endpoint
   - Connect handlers to the scheduler service

### Phase 3: Testing and Refinement

1. **Unit Testing**
   - Test scheduler logic
   - Test API endpoints

2. **Integration Testing**
   - Test end-to-end scheduling functionality
   - Verify scheduled actions execute correctly

3. **Refinements**
   - Add logging for scheduler events
   - Implement error recovery mechanisms

## Technical Implementation Details

### Scheduler Implementation

```typescript
// src/app/api/schedules/services/schedulerService.ts

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { lightsService } from '../../lights/services/globalInstances';
import { Schedule } from '../types/schedule';

export class SchedulerService {
  private static instance: SchedulerService;
  private schedules: Schedule[] = [];
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private storagePath: string;
  
  private constructor() {
    this.storagePath = join(process.cwd(), 'data', 'schedules.json');
    this.ensureStorageExists();
    this.loadSchedules();
    this.setupSchedules();
  }
  
  static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }
  
  // Load schedules from storage
  private loadSchedules(): void {
    try {
      const data = readFileSync(this.storagePath, 'utf-8');
      this.schedules = JSON.parse(data);
    } catch (error) {
      console.error('Failed to load schedules:', error);
      this.schedules = [];
    }
  }
  
  // Save schedules to storage
  private saveSchedules(): void {
    try {
      writeFileSync(this.storagePath, JSON.stringify(this.schedules, null, 2));
    } catch (error) {
      console.error('Failed to save schedules:', error);
    }
  }
  
  // Ensure storage directory and file exist
  private ensureStorageExists(): void {
    const dir = join(process.cwd(), 'data');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    if (!existsSync(this.storagePath)) {
      writeFileSync(this.storagePath, JSON.stringify([], null, 2));
    }
  }
  
  // Set up timers for all enabled schedules
  private setupSchedules(): void {
    // Clear existing timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    
    // Set up new timers for enabled schedules
    for (const schedule of this.schedules) {
      if (schedule.enabled) {
        this.scheduleNext(schedule);
      }
    }
  }
  
  // Schedule the next occurrence of a schedule
  private scheduleNext(schedule: Schedule): void {
    const nextTime = this.calculateNextOccurrence(schedule);
    if (!nextTime) return;
    
    const now = new Date();
    const delay = nextTime.getTime() - now.getTime();
    
    if (delay <= 0) return;
    
    const timer = setTimeout(() => {
      this.executeSchedule(schedule);
      this.scheduleNext(schedule);
    }, delay);
    
    this.timers.set(schedule.id, timer);
  }
  
  // Calculate the next occurrence of a schedule
  private calculateNextOccurrence(schedule: Schedule): Date | null {
    const now = new Date();
    const [hours, minutes] = schedule.timing.time.split(':').map(Number);
    
    switch (schedule.timing.type) {
      case 'once': {
        if (!schedule.timing.date) return null;
        
        const date = new Date(schedule.timing.date);
        date.setHours(hours, minutes, 0, 0);
        
        return date > now ? date : null;
      }
      
      case 'daily': {
        const next = new Date(now);
        next.setHours(hours, minutes, 0, 0);
        
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
        
        return next;
      }
      
      case 'weekly': {
        if (!schedule.timing.days || schedule.timing.days.length === 0) {
          return null;
        }
        
        const currentDay = now.getDay();
        const targetDays = [...schedule.timing.days].sort((a, b) => {
          const diffA = (a - currentDay + 7) % 7;
          const diffB = (b - currentDay + 7) % 7;
          return diffA - diffB;
        });
        
        const next = new Date(now);
        next.setHours(hours, minutes, 0, 0);
        
        // Find the next day that matches
        let daysToAdd = 0;
        for (const day of targetDays) {
          const diff = (day - currentDay + 7) % 7;
          if (diff === 0 && next > now) {
            daysToAdd = 0;
            break;
          } else if (diff > 0) {
            daysToAdd = diff;
            break;
          }
        }
        
        if (daysToAdd === 0 && next <= now) {
          daysToAdd = 7;
        }
        
        next.setDate(next.getDate() + daysToAdd);
        return next;
      }
      
      default:
        return null;
    }
  }
  
  // Execute a scheduled action
  private async executeSchedule(schedule: Schedule): Promise<void> {
    try {
      console.log(`Executing schedule: ${schedule.name} (${schedule.id})`);
      
      switch (schedule.action.type) {
        case 'on':
          if (schedule.target.type === 'group' && schedule.target.groupId) {
            await lightsService.turnOnGroup(schedule.target.groupId);
          } else {
            await lightsService.turnOnLights();
          }
          break;
          
        case 'off':
          if (schedule.target.type === 'group' && schedule.target.groupId) {
            await lightsService.turnOffGroup(schedule.target.groupId);
          } else {
            await lightsService.turnOffLights();
          }
          break;
          
        case 'warm_white':
          const warmIntensity = schedule.action.parameters?.intensity ?? 255;
          if (schedule.target.type === 'group' && schedule.target.groupId) {
            await lightsService.setGroupWarmWhite(schedule.target.groupId, warmIntensity);
          } else {
            await lightsService.setWarmWhite(warmIntensity);
          }
          break;
          
        case 'cold_white':
          const coldIntensity = schedule.action.parameters?.intensity ?? 255;
          if (schedule.target.type === 'group' && schedule.target.groupId) {
            await lightsService.setGroupColdWhite(schedule.target.groupId, coldIntensity);
          } else {
            await lightsService.setColdWhite(coldIntensity);
          }
          break;
          
        case 'color':
          const color = schedule.action.parameters?.color ?? [255, 255, 255];
          if (schedule.target.type === 'group' && schedule.target.groupId) {
            await lightsService.setGroupColor(schedule.target.groupId, color);
          } else {
            await lightsService.setColor(color);
          }
          break;
      }
      
      console.log(`Schedule executed successfully: ${schedule.name}`);
    } catch (error) {
      console.error(`Failed to execute schedule ${schedule.id}:`, error);
    }
  }
  
  // Public methods for schedule management
  
  getAllSchedules(): Schedule[] {
    return [...this.schedules];
  }
  
  getScheduleById(id: string): Schedule | undefined {
    return this.schedules.find(s => s.id === id);
  }
  
  createSchedule(schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Schedule {
    const now = new Date().toISOString();
    const newSchedule: Schedule = {
      ...schedule,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    };
    
    this.schedules.push(newSchedule);
    this.saveSchedules();
    
    if (newSchedule.enabled) {
      this.scheduleNext(newSchedule);
    }
    
    return newSchedule;
  }
  
  updateSchedule(id: string, updates: Partial<Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>>): Schedule | null {
    const index = this.schedules.findIndex(s => s.id === id);
    if (index === -1) return null;
    
    const oldSchedule = this.schedules[index];
    const updatedSchedule: Schedule = {
      ...oldSchedule,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.schedules[index] = updatedSchedule;
    this.saveSchedules();
    
    // Clear existing timer
    const existingTimer = this.timers.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.timers.delete(id);
    }
    
    // Set up new timer if enabled
    if (updatedSchedule.enabled) {
      this.scheduleNext(updatedSchedule);
    }
    
    return updatedSchedule;
  }
  
  deleteSchedule(id: string): boolean {
    const index = this.schedules.findIndex(s => s.id === id);
    if (index === -1) return false;
    
    this.schedules.splice(index, 1);
    this.saveSchedules();
    
    // Clear timer if exists
    const existingTimer = this.timers.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.timers.delete(id);
    }
    
    return true;
  }
  
  toggleSchedule(id: string): Schedule | null {
    const schedule = this.schedules.find(s => s.id === id);
    if (!schedule) return null;
    
    return this.updateSchedule(id, { enabled: !schedule.enabled });
  }
}
```

### API Implementation

```typescript
// src/app/api/schedules/route.ts

import { NextRequest } from 'next/server';
import { corsResponse } from '../shared/cors';
import { SchedulerService } from './services/schedulerService';

const schedulerService = SchedulerService.getInstance();

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    
    if (id) {
      const schedule = schedulerService.getScheduleById(id);
      if (!schedule) {
        return corsResponse(
          { message: `Schedule with ID ${id} not found` },
          { status: 404 }
        );
      }
      
      return corsResponse(
        { 
          message: 'Schedule retrieved successfully',
          schedule 
        },
        { status: 200 }
      );
    }
    
    const schedules = schedulerService.getAllSchedules();
    return corsResponse(
      { 
        message: `Retrieved ${schedules.length} schedules`,
        schedules 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in schedules GET:', error);
    return corsResponse(
      { message: 'Failed to retrieve schedules' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.name || !body.action || !body.target || !body.timing) {
      return corsResponse(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const newSchedule = schedulerService.createSchedule(body);
    
    return corsResponse(
      { 
        message: 'Schedule created successfully',
        schedule: newSchedule 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in schedules POST:', error);
    return corsResponse(
      { message: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}

// src/app/api/schedules/[id]/route.ts

import { NextRequest } from 'next/server';
import { corsResponse } from '../../shared/cors';
import { SchedulerService } from '../services/schedulerService';

const schedulerService = SchedulerService.getInstance();

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json();
    
    const updatedSchedule = schedulerService.updateSchedule(id, body);
    if (!updatedSchedule) {
      return corsResponse(
        { message: `Schedule with ID ${id} not found` },
        { status: 404 }
      );
    }
    
    return corsResponse(
      { 
        message: 'Schedule updated successfully',
        schedule: updatedSchedule 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in schedules PUT:', error);
    return corsResponse(
      { message: 'Failed to update schedule' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    const success = schedulerService.deleteSchedule(id);
    if (!success) {
      return corsResponse(
        { message: `Schedule with ID ${id} not found` },
        { status: 404 }
      );
    }
    
    return corsResponse(
      { message: 'Schedule deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in schedules DELETE:', error);
    return corsResponse(
      { message: 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}

// src/app/api/schedules/[id]/toggle/route.ts

import { NextRequest } from 'next/server';
import { corsResponse } from '../../../shared/cors';
import { SchedulerService } from '../../services/schedulerService';

const schedulerService = SchedulerService.getInstance();

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    const updatedSchedule = schedulerService.toggleSchedule(id);
    if (!updatedSchedule) {
      return corsResponse(
        { message: `Schedule with ID ${id} not found` },
        { status: 404 }
      );
    }
    
    return corsResponse(
      { 
        message: `Schedule ${updatedSchedule.enabled ? 'enabled' : 'disabled'} successfully`,
        schedule: updatedSchedule 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in schedules toggle PATCH:', error);
    return corsResponse(
      { message: 'Failed to toggle schedule' },
      { status: 500 }
    );
  }
}
```

## Handling Edge Cases

### Time Zone Considerations

The scheduling system will use the server's local time zone by default. For a more robust solution, we should:

1. Store time zone information with each schedule
2. Convert between time zones when calculating next occurrences
3. Provide API endpoints to get available time zones

### Daylight Saving Time

The JavaScript Date object automatically handles DST changes. However, we should be aware that:

1. Some schedules might be skipped or run twice during DST transitions
2. We may need special handling for schedules that fall in the "missing" or "duplicate" hour

### Server Restarts

Since Next.js API routes run in a serverless environment, we need to handle server restarts:

1. On startup, the scheduler service will reload all schedules from storage
2. It will recalculate the next occurrence for each schedule
3. For missed schedules, we can either:
   - Skip them entirely
   - Execute them immediately (if within a configurable threshold)
   - Log them for manual review

## Future Enhancements

1. **Web Interface**: Create a user-friendly interface for managing schedules
2. **Database Storage**: Migrate from file-based storage to a database
3. **Notification System**: Send notifications when schedules execute or fail
4. **Conditional Scheduling**: Add support for conditions (e.g., only run if another condition is met)
5. **Schedule Templates**: Allow users to create and reuse schedule templates

## Conclusion

This implementation plan provides a comprehensive approach to adding scheduling capabilities to your light control API. The solution is designed to be:

- **Robust**: Handles edge cases and server restarts
- **Flexible**: Supports various schedule types and targets
- **Extensible**: Can be easily enhanced with additional features
- **Maintainable**: Uses a clean architecture with separation of concerns

By following this plan, you'll be able to implement a scheduling system that allows users to automate their light control operations effectively.