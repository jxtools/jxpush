/**
 * CLI Utilities - Config Loader
 * Load and validate jxpush.config.ts or jxpush.config.js
 */

import { existsSync } from 'fs';
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import type { PushClientConfig } from '../../types/config.types.js';
import { Formatter } from './formatter.js';

export interface JxPushConfig extends Partial<PushClientConfig> {
  templatesPath?: string;
  localesPath?: string;
  queueAdapter?: 'memory' | 'redis' | 'bullmq';
  queueConfig?: Record<string, unknown>;
}

export class ConfigLoader {
  private static configCache: JxPushConfig | null = null;

  /**
   * Load config from file
   */
  static async loadConfig(configPath?: string): Promise<JxPushConfig | null> {
    // Return cached config if available
    if (this.configCache) {
      return this.configCache;
    }

    const searchPaths = configPath
      ? [resolve(process.cwd(), configPath)]
      : [
          resolve(process.cwd(), 'jxpush.config.ts'),
          resolve(process.cwd(), 'jxpush.config.js'),
          resolve(process.cwd(), 'jxpush.config.mjs'),
        ];

    for (const path of searchPaths) {
      if (existsSync(path)) {
        try {
          const config = await this.importConfig(path);
          this.configCache = config;
          return config;
        } catch (error) {
          console.error(
            Formatter.error(
              `Failed to load config from ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          );
          process.exit(1);
        }
      }
    }

    return null;
  }

  /**
   * Import config file (supports both ESM and CommonJS)
   */
  private static async importConfig(path: string): Promise<JxPushConfig> {
    try {
      // Convert to file URL for ESM import
      const fileUrl = pathToFileURL(path).href;
      const module = await import(fileUrl);

      // Handle default export
      const config = module.default || module;

      if (typeof config === 'function') {
        return await config();
      }

      return config as JxPushConfig;
    } catch (error) {
      throw new Error(`Failed to import config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Merge config with CLI options
   */
  static mergeWithOptions(
    config: JxPushConfig | null,
    options: Record<string, unknown>
  ): Record<string, unknown> {
    if (!config) return options;

    return {
      ...config,
      ...options,
      // Merge nested objects
      fcm: {
        ...(config.fcm || {}),
        ...(options.fcm as Record<string, unknown> || {}),
      },
      expo: {
        ...(config.expo || {}),
        ...(options.expo as Record<string, unknown> || {}),
      },
      queue: {
        ...(config.queue || {}),
        ...(options.queue as Record<string, unknown> || {}),
      },
      rateLimit: {
        ...(config.rateLimit || {}),
        ...(options.rateLimit as Record<string, unknown> || {}),
      },
      retry: {
        ...(config.retry || {}),
        ...(options.retry as Record<string, unknown> || {}),
      },
    };
  }

  /**
   * Get provider config from merged config
   */
  static getProviderConfig(
    config: Record<string, unknown>,
    provider: string
  ): Record<string, unknown> | undefined {
    const providerKey = provider.toLowerCase();
    return config[providerKey] as Record<string, unknown> | undefined;
  }

  /**
   * Validate config
   */
  static validateConfig(config: JxPushConfig): void {
    // Basic validation
    if (config.fcm && !config.fcm.serviceAccountPath && !config.fcm.serviceAccount) {
      throw new Error('FCM config requires either serviceAccountPath or serviceAccount');
    }

    if (config.expo && !config.expo.accessToken) {
      throw new Error('Expo config requires accessToken');
    }
  }

  /**
   * Clear config cache
   */
  static clearCache(): void {
    this.configCache = null;
  }

  /**
   * Load environment variables
   */
  static loadEnvVars(): Partial<JxPushConfig> {
    const envConfig: Partial<JxPushConfig> = {};

    // FCM env vars
    if (process.env.FCM_SERVICE_ACCOUNT_PATH) {
      envConfig.fcm = {
        serviceAccountPath: process.env.FCM_SERVICE_ACCOUNT_PATH,
      };
    }

    // Expo env vars
    if (process.env.EXPO_ACCESS_TOKEN) {
      envConfig.expo = {
        accessToken: process.env.EXPO_ACCESS_TOKEN,
      };
    }

    // Queue env vars
    if (process.env.JXPUSH_QUEUE_ADAPTER) {
      envConfig.queueAdapter = process.env.JXPUSH_QUEUE_ADAPTER as 'memory' | 'redis' | 'bullmq';
    }

    return envConfig;
  }
}
