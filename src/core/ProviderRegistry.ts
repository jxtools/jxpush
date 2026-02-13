/**
 * Dynamic Provider Registry
 * Lazy-loads providers only when needed
 */

import type { Provider } from '../providers/base/Provider.js';
import { ProviderType } from '../types/config.types.js';
import { PushError } from '../errors/PushError.js';
import { createLogger } from '../utils/logger.js';
import { LogLevel } from '../types/config.types.js';

export class ProviderRegistry {
  private static providers = new Map<ProviderType, Provider>();
  private static loaders = new Map<ProviderType, (config: any) => Promise<Provider>>();
  private static defaultLogger = createLogger(LogLevel.WARN);

  /**
   * Register a provider loader (lazy)
   */
  static registerLoader(type: ProviderType, loader: (config: any) => Promise<Provider>): void {
    this.loaders.set(type, loader);
  }

  /**
   * Get provider instance (loads if not cached)
   */
  static async getProvider(type: ProviderType, config: any): Promise<Provider> {
    // Return cached instance
    if (this.providers.has(type)) {
      return this.providers.get(type)!;
    }

    // Load provider dynamically
    const loader = this.loaders.get(type);
    if (!loader) {
      throw new PushError(
        `Provider "${type}" not registered. Did you install the required peer dependency?`
      );
    }

    try {
      const provider = await loader(config);
      this.providers.set(type, provider);
      return provider;
    } catch (error) {
      throw new PushError(
        `Failed to load provider "${type}". Make sure the peer dependency is installed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if provider is available (dependency installed)
   */
  static async isAvailable(type: ProviderType): Promise<boolean> {
    try {
      await this.getProvider(type, {});
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List all registered providers
   */
  static listRegistered(): ProviderType[] {
    return Array.from(this.loaders.keys());
  }

  /**
   * Clear cache (for testing)
   */
  static clearCache(): void {
    this.providers.clear();
  }
}

// Register default loaders
ProviderRegistry.registerLoader(ProviderType.FCM, async (config) => {
  try {
    const { FCMProvider } = await import('../providers/fcm/FCMProvider.js');
    return new FCMProvider(config, ProviderRegistry['defaultLogger']);
  } catch (error) {
    throw new Error(
      'FCM provider requires "firebase-admin" peer dependency. Install with: npm install firebase-admin'
    );
  }
});

ProviderRegistry.registerLoader(ProviderType.EXPO, async (config) => {
  try {
    const { ExpoProvider } = await import('../providers/expo/ExpoProvider.js');
    return new ExpoProvider(config, ProviderRegistry['defaultLogger']);
  } catch (error) {
    throw new Error(
      'Expo provider requires "expo-server-sdk" peer dependency. Install with: npm install expo-server-sdk'
    );
  }
});

ProviderRegistry.registerLoader(ProviderType.WEBPUSH, async (config) => {
  try {
    const { WebPushProvider } = await import('../providers/webpush/WebPushProvider.js');
    return new WebPushProvider(config, ProviderRegistry['defaultLogger']);
  } catch (error) {
    throw new Error(
      'Web Push provider requires "web-push" peer dependency. Install with: npm install web-push'
    );
  }
});
