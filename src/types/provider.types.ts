/**
 * Provider types for jxpush
 */

import { PushMessage, SendResult, BulkSendResult } from './message.types';

/**
 * Provider capabilities
 */
export interface ProviderCapabilities {
  /**
   * Supports single message send
   */
  supportsSingleSend: boolean;

  /**
   * Supports bulk send
   */
  supportsBulkSend: boolean;

  /**
   * Supports topic messaging
   */
  supportsTopicMessaging: boolean;

  /**
   * Supports scheduled messages
   */
  supportsScheduling: boolean;

  /**
   * Maximum batch size for bulk operations
   */
  maxBatchSize: number;

  /**
   * Recommended rate limit (requests per second)
   */
  recommendedRateLimit?: number;
}

/**
 * Provider interface contract
 * All providers must implement this interface
 */
export interface IProvider {
  /**
   * Get provider capabilities
   */
  getCapabilities(): ProviderCapabilities;

  /**
   * Send a single push notification
   */
  send(message: PushMessage): Promise<SendResult>;

  /**
   * Send multiple push notifications in bulk
   */
  sendBulk(messages: PushMessage[]): Promise<BulkSendResult>;

  /**
   * Send to a topic
   */
  sendToTopic(topic: string, message: PushMessage): Promise<SendResult>;

  /**
   * Validate a device token
   */
  validateToken(token: string): boolean;

  /**
   * Validate a message payload
   */
  validateMessage(message: PushMessage): { valid: boolean; errors: string[] };

  /**
   * Initialize the provider
   */
  initialize(): Promise<void>;

  /**
   * Cleanup resources
   */
  shutdown(): Promise<void>;
}
