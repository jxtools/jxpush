/**
 * Messaging Adapter Interface
 * For infrastructure messaging systems
 */

import type { MessagingMessage, MessagingResult } from '../../types/messaging.types.js';

export interface IMessagingAdapter {
  /**
   * Publish a message to a topic
   */
  publish(
    topic: string,
    message: unknown,
    options?: {
      key?: string;
      headers?: Record<string, string>;
      partition?: number;
    }
  ): Promise<MessagingResult>;

  /**
   * Publish multiple messages in batch
   */
  publishBatch(messages: MessagingMessage[]): Promise<MessagingResult[]>;

  /**
   * Close adapter and cleanup resources
   */
  close(): Promise<void>;
}
