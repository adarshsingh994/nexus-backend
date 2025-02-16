interface ProcessConfig {
  maxConcurrent: number;
  timeout: number;
  maxRetries: number;
  backoffFactor: number;
}

interface LightDiscoveryConfig {
  interval: number;
  timeout: number;
}

interface LightControlConfig {
  retries: number;
  timeout: number;
}

interface ServerConfig {
  port: number;
  host: string;
}

interface LogConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
}

export interface SystemConfig {
  process: ProcessConfig;
  lights: {
    discovery: LightDiscoveryConfig;
    control: LightControlConfig;
  };
  server: ServerConfig;
  logging: LogConfig;
}

class ConfigService {
  private static instance: ConfigService;
  private config: SystemConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  getConfig(): SystemConfig {
    return this.config;
  }

  private loadConfig(): SystemConfig {
    // Default configuration
    const defaultConfig: SystemConfig = {
      process: {
        maxConcurrent: 5,
        timeout: 30000,
        maxRetries: 3,
        backoffFactor: 1.5
      },
      lights: {
        discovery: {
          interval: 1800000, // 30 minutes
          timeout: 60000 // 1 minute
        },
        control: {
          retries: 3,
          timeout: 30000
        }
      },
      server: {
        port: 3000,
        host: 'localhost'
      },
      logging: {
        level: 'info',
        format: 'json'
      }
    };

    // Load environment-specific overrides
    const env = process.env.NODE_ENV || 'development';
    let envConfig: Partial<SystemConfig> = {};

    try {
      switch (env) {
        case 'production':
          envConfig = {
            logging: {
              level: 'warn',
              format: 'json'
            },
            server: {
              host: process.env.SERVER_HOST || defaultConfig.server.host,
              port: parseInt(process.env.SERVER_PORT || String(defaultConfig.server.port))
            }
          };
          break;

        case 'development':
          envConfig = {
            logging: {
              level: 'debug',
              format: 'text'
            }
          };
          break;

        case 'test':
          envConfig = {
            process: {
              ...defaultConfig.process,
              timeout: 5000,
              maxRetries: 1
            },
            lights: {
              discovery: {
                interval: 60000,
                timeout: 5000
              },
              control: {
                retries: 1,
                timeout: 5000
              }
            }
          };
          break;
      }
    } catch (error) {
      console.warn(`Error loading environment config: ${error}`);
    }

    // Deep merge default config with environment overrides
    return this.mergeConfigs(defaultConfig, envConfig);
  }

  private mergeConfigs(
    target: SystemConfig,
    source: Partial<SystemConfig>
  ): SystemConfig {
    return {
      process: source.process
        ? { ...target.process, ...source.process }
        : target.process,
      lights: {
        discovery: source.lights?.discovery
          ? { ...target.lights.discovery, ...source.lights.discovery }
          : target.lights.discovery,
        control: source.lights?.control
          ? { ...target.lights.control, ...source.lights.control }
          : target.lights.control,
      },
      server: source.server
        ? { ...target.server, ...source.server }
        : target.server,
      logging: source.logging
        ? { ...target.logging, ...source.logging }
        : target.logging,
    };
  }
}

// Export a singleton instance
export const config = ConfigService.getInstance().getConfig();