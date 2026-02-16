/**
 * Expo Push Notification Provider
 */

import type { Expo, ExpoPushMessage, ExpoPushSuccessTicket } from 'expo-server-sdk';
import { Provider } from '../base/Provider.js';
import { ProviderCapabilities } from '../../types/provider.types.js';
import { PushMessage, SendResult, BulkSendResult } from '../../types/message.types.js';
import { ProviderType, ExpoConfig } from '../../types/config.types.js';
import { Logger, createLogger } from '../../utils/logger.js';
import { LogLevel } from '../../types/config.types.js';
import { validateExpoToken } from '../../validation/tokenValidator.js';
import { validateMessage } from '../../validation/messageValidator.js';
import { ProviderError } from '../../errors/ProviderError.js';
import { ErrorCode } from '../../errors/PushError.js';
import { chunk } from '../../utils/chunk.js';

/**
 * Expo Provider implementation
 */
export class ExpoProvider extends Provider {
  private config: ExpoConfig;
  private expo!: Expo;

  constructor(config: ExpoConfig, logger?: Logger) {
    super(logger || createLogger(LogLevel.WARN));
    this.config = config;
    // Expo initialization moved to initialize()
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
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Expo provider...');

      // Lazy load expo-server-sdk
      let ExpoClass: unknown;
      try {
        // @ts-expect-error - Dynamic import of optional peer dependency
        const expoModule = (await import('expo-server-sdk')) as unknown;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ExpoClass = (expoModule as any).Expo || (expoModule as any).default?.Expo;
      } catch (error) {
        throw new ProviderError(
          'Failed to load expo-server-sdk module. Please install it: npm install expo-server-sdk',
          ProviderType.EXPO,
          ErrorCode.PROVIDER_INIT_FAILED
        );
      }

      this.expo = new ExpoClass({
        accessToken: (this.config as ExpoConfig).accessToken,
      });
      this.initialized = true;
      this.logger.info('Expo provider initialized successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Failed to initialize Expo provider', err);
      throw new ProviderError(
        `Expo initialization failed: ${err.message}`,
        ProviderType.EXPO,
        ErrorCode.PROVIDER_INIT_FAILED,
        false,
        undefined,
        err
      );
    }
  }

  /**
   * Send a single push notification
   */
  async send(message: PushMessage): Promise<SendResult> {
    this.ensureInitialized();

    try {
      // Validate message
      const validation = this.validateMessage(message);
      if (!validation.valid) {
        throw new ProviderError(
          `Message validation failed: ${validation.errors.join(', ')}`,
          ProviderType.EXPO,
          ErrorCode.INVALID_MESSAGE
        );
      }

      // Convert to Expo format
      const expoMessage = this.convertToExpoMessage(message);

      // Send via Expo
      const tickets = await this.expo.sendPushNotificationsAsync([expoMessage]);
      const ticket = tickets[0];

      // Check ticket status
      if (ticket.status === 'ok') {
        const successTicket = ticket as ExpoPushSuccessTicket;
        this.logger.debug('Expo message sent successfully', { id: successTicket.id });

        return {
          success: true,
          messageId: successTicket.id,
          provider: ProviderType.EXPO,
          token: typeof message.token === 'string' ? message.token : undefined,
        };
      } else {
        // Error ticket
        const error = new Error(ticket.message || 'Unknown Expo error');
        this.logger.error('Expo send failed', error);

        return {
          success: false,
          error: ProviderError.fromProviderError(error, ProviderType.EXPO),
          provider: ProviderType.EXPO,
          token: typeof message.token === 'string' ? message.token : undefined,
        };
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Expo send failed', err);

      return {
        success: false,
        error: ProviderError.fromProviderError(err, ProviderType.EXPO),
        provider: ProviderType.EXPO,
        token: typeof message.token === 'string' ? message.token : undefined,
      };
    }
  }

  /**
   * Send multiple push notifications in bulk
   */
  async sendBulk(messages: PushMessage[]): Promise<BulkSendResult> {
    this.ensureInitialized();

    const startTime = Date.now();
    const results: SendResult[] = [];

    try {
      // Flatten all tokens from all messages
      const tokenMessagePairs: Array<{ token: string; message: PushMessage }> = [];

      for (const message of messages) {
        if (Array.isArray(message.token)) {
          for (const token of message.token) {
            tokenMessagePairs.push({ token, message });
          }
        } else if (message.token) {
          tokenMessagePairs.push({ token: message.token, message });
        }
      }

      // Chunk into batches of 100 (Expo limit)
      const batches = chunk(tokenMessagePairs, 100);

      for (const batch of batches) {
        try {
          // Convert all messages in batch to Expo format
          const expoMessages = batch.map(({ token, message }) => {
            const expoMsg = this.convertToExpoMessage(message);
            // Override token to ensure it's the specific one from the pair
            expoMsg.to = token;
            return expoMsg;
          });

          // Send batch
          const tickets = await this.expo.sendPushNotificationsAsync(expoMessages);

          // Process tickets
          tickets.forEach((ticket, index) => {
            const token = batch[index].token;

            if (ticket.status === 'ok') {
              const successTicket = ticket as ExpoPushSuccessTicket;
              results.push({
                success: true,
                messageId: successTicket.id,
                provider: ProviderType.EXPO,
                token,
              });
            } else {
              const error = new Error(ticket.message || 'Unknown Expo error');
              results.push({
                success: false,
                error: ProviderError.fromProviderError(error, ProviderType.EXPO),
                provider: ProviderType.EXPO,
                token,
              });
            }
          });
        } catch (error) {
          // If batch fails, mark all as failed
          const err = error instanceof Error ? error : new Error(String(error));
          for (const { token } of batch) {
            results.push({
              success: false,
              error: ProviderError.fromProviderError(err, ProviderType.EXPO),
              provider: ProviderType.EXPO,
              token,
            });
          }
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      return {
        total: results.length,
        successCount,
        failureCount,
        results,
        provider: ProviderType.EXPO,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Expo bulk send failed', err);

      throw ProviderError.fromProviderError(err, ProviderType.EXPO);
    }
  }

  /**
   * Send to a topic (not supported by Expo)
   */
  async sendToTopic(_topic: string, _message: PushMessage): Promise<SendResult> {
    throw new ProviderError(
      'Topic messaging not supported by Expo',
      ProviderType.EXPO,
      ErrorCode.PROVIDER_ERROR
    );
  }

  /**
   * Validate Expo token
   */
  validateToken(token: string): boolean {
    // We can't use Expo.isExpoPushToken static method easily without importing the class.
    // We can use the instance method if available or dynamic import.
    // For validation, we might want to avoid async.
    // However, validateToken is synchronous in IProvider.
    // We can check the pattern ourselves or just rely on validateExpoToken from our validator.
    return validateExpoToken(token);
  }

  /**
   * Validate message
   */
  validateMessage(message: PushMessage): { valid: boolean; errors: string[] } {
    return validateMessage(message);
  }

  /**
   * Convert universal message to Expo format
   */
  private convertToExpoMessage(message: PushMessage): ExpoPushMessage {
    const expoMessage: ExpoPushMessage = {
      to: typeof message.token === 'string' ? message.token : message.token?.[0] || '',
    };

    // Set notification
    if (message.notification) {
      expoMessage.title = message.notification.title;
      expoMessage.body = message.notification.body;

      if (message.notification.sound) {
        expoMessage.sound = message.notification.sound;
      }

      if (message.notification.badge !== undefined) {
        expoMessage.badge = message.notification.badge;
      }

      if (message.notification.channelId) {
        expoMessage.channelId = message.notification.channelId;
      }
    }

    // Set data
    if (message.data) {
      expoMessage.data = message.data;
    }

    // Set priority
    if (message.priority) {
      expoMessage.priority =
        message.priority === 'high' ? 'high' : message.priority === 'normal' ? 'normal' : 'default';
    }

    // Set TTL
    if (message.ttl) {
      expoMessage.expiration = Math.floor(Date.now() / 1000) + message.ttl;
    }

    return expoMessage;
  }

  /**
   * Cleanup resources
   */
  async shutdown(): Promise<void> {
    this.initialized = false;
    this.logger.info('Expo provider shut down');
  }
}
