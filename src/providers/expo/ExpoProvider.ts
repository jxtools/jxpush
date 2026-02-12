/**
 * Expo Push Notification Provider (Phase 2 - Scaffold)
 */

import { Provider } from '../base/Provider';
import { ProviderCapabilities } from '../../types/provider.types';
import { PushMessage, SendResult, BulkSendResult } from '../../types/message.types';
import { ProviderType, ExpoConfig } from '../../types/config.types';
import { Logger } from '../../utils/logger';
import { validateExpoToken } from '../../validation/tokenValidator';
import { validateMessage } from '../../validation/messageValidator';

/**
 * Expo Provider implementation (Phase 2 - Scaffold)
 */
export class ExpoProvider extends Provider {
  // private _config: ExpoConfig; // TODO: Use in Phase 2

  constructor(config: ExpoConfig, logger: Logger) {
    super(logger);
    // Store config for Phase 2 implementation
    void config; // Suppress unused parameter warning
  }

  /**
   * Get provider type
   */
  getProviderType(): ProviderType {
    return ProviderType.EXPO;
  }

  /**
   * Get provider capabilities
   */
  getCapabilities(): ProviderCapabilities {
    return {
      supportsSingleSend: true,
      supportsBulkSend: true,
      supportsTopicMessaging: false,
      supportsScheduling: false,
      maxBatchSize: 100, // Expo recommends max 100 per request
      recommendedRateLimit: 50,
    };
  }

  /**
   * Initialize Expo provider
   * TODO: Implement in Phase 2
   */
  async initialize(): Promise<void> {
    this.logger.info('Expo provider initialization (Phase 2 - Not yet implemented)');
    // TODO: Initialize Expo SDK
    this.initialized = true;
  }

  /**
   * Send a single push notification
   * TODO: Implement in Phase 2
   */
  async send(_message: PushMessage): Promise<SendResult> {
    this.ensureInitialized();
    // TODO: Implement Expo send
    throw new Error('Expo provider not yet implemented (Phase 2)');
  }

  /**
   * Send multiple push notifications in bulk
   * TODO: Implement in Phase 2
   */
  async sendBulk(_messages: PushMessage[]): Promise<BulkSendResult> {
    this.ensureInitialized();
    // TODO: Implement Expo bulk send
    throw new Error('Expo provider not yet implemented (Phase 2)');
  }

  /**
   * Send to a topic (not supported by Expo)
   */
  async sendToTopic(_topic: string, _message: PushMessage): Promise<SendResult> {
    throw new Error('Topic messaging not supported by Expo');
  }

  /**
   * Validate Expo token
   */
  validateToken(token: string): boolean {
    return validateExpoToken(token);
  }

  /**
   * Validate message
   */
  validateMessage(message: PushMessage): { valid: boolean; errors: string[] } {
    return validateMessage(message);
  }

  /**
   * Cleanup resources
   */
  async shutdown(): Promise<void> {
    this.initialized = false;
    this.logger.info('Expo provider shut down');
  }
}
