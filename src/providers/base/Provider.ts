/**
 * Base provider abstract class
 */

import { IProvider, ProviderCapabilities } from '../../types/provider.types.js';
import { PushMessage, SendResult, BulkSendResult } from '../../types/message.types.js';
import { Logger } from '../../utils/logger.js';
import { ProviderType } from '../../types/config.types.js';

/**
 * Abstract base class for all providers
 */
export abstract class Provider implements IProvider {
  protected logger: Logger;
  protected initialized = false;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Get provider type
   */
  abstract getProviderType(): ProviderType;

  /**
   * Get provider capabilities
   */
  abstract getCapabilities(): ProviderCapabilities;

  /**
   * Send a single push notification
   */
  abstract send(message: PushMessage): Promise<SendResult>;

  /**
   * Send multiple push notifications in bulk
   */
  abstract sendBulk(messages: PushMessage[]): Promise<BulkSendResult>;

  /**
   * Send to a topic
   */
  abstract sendToTopic(topic: string, message: PushMessage): Promise<SendResult>;

  /**
   * Validate a device token
   */
  abstract validateToken(token: string): boolean;

  /**
   * Validate a message payload
   */
  abstract validateMessage(message: PushMessage): { valid: boolean; errors: string[] };

  /**
   * Initialize the provider
   */
  abstract initialize(): Promise<void>;

  /**
   * Cleanup resources
   */
  abstract shutdown(): Promise<void>;

  /**
   * Check if provider is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Ensure provider is initialized
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Provider not initialized. Call initialize() first.');
    }
  }
}
