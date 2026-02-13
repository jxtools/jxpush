/**
 * Dynamic Adapter Registry
 * Lazy-loads queue adapters only when needed
 */

import type { QueueAdapter } from '../queue/adapters/IQueueAdapter.js';
import { PushError } from '../errors/PushError.js';

type AdapterType = 'redis' | 'bullmq';

export class AdapterRegistry {
  private static adapters = new Map<AdapterType, QueueAdapter>();
  private static loaders = new Map<AdapterType, (config: any) => Promise<QueueAdapter>>();

  /**
   * Register an adapter loader (lazy)
   */
  static registerLoader(
    type: AdapterType,
    loader: (config: any) => Promise<QueueAdapter>
  ): void {
    this.loaders.set(type, loader);
  }

  /**
   * Get adapter instance (loads if not cached)
   */
  static async getAdapter(type: AdapterType, config: any): Promise<QueueAdapter> {
    // Return cached instance
    if (this.adapters.has(type)) {
      return this.adapters.get(type)!;
    }

    // Load adapter dynamically
    const loader = this.loaders.get(type);
    if (!loader) {
      throw new PushError(
        `Adapter "${type}" not registered. Did you install the required peer dependency?`
      );
    }

    try {
      const adapter = await loader(config);
      this.adapters.set(type, adapter);
      return adapter;
    } catch (error) {
      throw new PushError(
        `Failed to load adapter "${type}". Make sure the peer dependency is installed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if adapter is available (dependency installed)
   */
  static async isAvailable(type: AdapterType): Promise<boolean> {
    try {
      await this.getAdapter(type, {});
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List all registered adapters
   */
  static listRegistered(): AdapterType[] {
    return Array.from(this.loaders.keys());
  }

  /**
   * Clear cache (for testing)
   */
  static clearCache(): void {
    this.adapters.clear();
  }
}

// Register default loaders
AdapterRegistry.registerLoader('redis', async (config) => {
  try {
    const { RedisQueueAdapter } = await import('../queue/adapters/RedisQueueAdapter.js');
    return new RedisQueueAdapter(config);
  } catch (error) {
    throw new Error(
      'Redis adapter requires "ioredis" peer dependency. Install with: npm install ioredis'
    );
  }
});

AdapterRegistry.registerLoader('bullmq', async (config) => {
  try {
    const { BullMQAdapter } = await import('../queue/adapters/BullMQAdapter.js');
    return new BullMQAdapter(config);
  } catch (error) {
    throw new Error(
      'BullMQ adapter requires "bullmq" peer dependency. Install with: npm install bullmq'
    );
  }
});
