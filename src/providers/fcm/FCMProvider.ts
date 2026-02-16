/**
 * Firebase Cloud Messaging (FCM) Provider
 */

import type * as admin from 'firebase-admin';
import { Provider } from '../base/Provider.js';
import { ProviderCapabilities } from '../../types/provider.types.js';
import { PushMessage, SendResult, BulkSendResult, FCMMessage } from '../../types/message.types.js';
import { ProviderType, FCMConfig } from '../../types/config.types.js';
import { Logger } from '../../utils/logger.js';
import { ProviderError } from '../../errors/ProviderError.js';
import { ErrorCode } from '../../errors/PushError.js';
import { validateFCMToken } from '../../validation/tokenValidator.js';
import { validateMessage } from '../../validation/messageValidator.js';
import { chunk } from '../../utils/chunk.js';

/**
 * FCM Provider implementation
 */
export class FCMProvider extends Provider {
  private config: FCMConfig;
  private app?: admin.app.App;
  private admin!: typeof admin; // Keep a reference to the dynamically imported module

  constructor(config: FCMConfig, logger: Logger) {
    super(logger);
    this.config = config;
  }

  /**
   * Get provider type
   */
  getProviderType(): ProviderType {
    return ProviderType.FCM;
  }

  /**
   * Get provider capabilities
   */
  getCapabilities(): ProviderCapabilities {
    return {
      supportsSingleSend: true,
      supportsBulkSend: true,
      supportsTopicMessaging: true,
      supportsScheduling: false, // FCM doesn't support native scheduling
      maxBatchSize: 500, // FCM allows up to 500 tokens per batch
      recommendedRateLimit: 100, // Conservative rate limit
    };
  }

  /**
   * Initialize FCM
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing FCM provider...');

      // Lazy load firebase-admin
      try {
        // @ts-expect-error - Dynamic import of optional peer dependency
        const adminModule = await import('firebase-admin');
        this.admin = adminModule.default || adminModule;
      } catch (error) {
        throw new ProviderError(
          'Failed to load firebase-admin module. Please install it: npm install firebase-admin',
          ProviderType.FCM,
          ErrorCode.PROVIDER_INIT_FAILED
        );
      }

      // Load service account
      let credential: admin.credential.Credential;

      if (this.config.serviceAccountPath) {
        credential = this.admin.credential.cert(this.config.serviceAccountPath);
        this.logger.debug('Loaded FCM credentials from file');
      } else if (this.config.serviceAccount) {
        credential = this.admin.credential.cert(this.config.serviceAccount as admin.ServiceAccount);
        this.logger.debug('Loaded FCM credentials from object');
      } else {
        throw new ProviderError(
          'FCM configuration must include either serviceAccountPath or serviceAccount',
          ProviderType.FCM,
          ErrorCode.INVALID_CONFIG
        );
      }

      // Initialize Firebase Admin
      this.app = this.admin.initializeApp({
        credential,
        projectId: this.config.projectId,
      });

      this.initialized = true;
      this.logger.info('FCM provider initialized successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Failed to initialize FCM provider', err);
      throw new ProviderError(
        `FCM initialization failed: ${err.message}`,
        ProviderType.FCM,
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
          ProviderType.FCM,
          ErrorCode.INVALID_MESSAGE
        );
      }

      // Convert to FCM format
      const fcmMessage = this.convertToFCMMessage(message);

      // Send via FCM - cast to admin.messaging.Message
      const messageId = await this.admin.messaging().send(fcmMessage as admin.messaging.Message);

      this.logger.debug('FCM message sent successfully', { messageId });

      return {
        success: true,
        messageId,
        provider: ProviderType.FCM,
        token: typeof message.token === 'string' ? message.token : undefined,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('FCM send failed', err);

      return {
        success: false,
        error: ProviderError.fromProviderError(err, ProviderType.FCM),
        provider: ProviderType.FCM,
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
      // Group messages by type (single token vs topic)
      const tokenMessages = messages.filter((m) => m.token);
      const topicMessages = messages.filter((m) => m.topic);

      // Process token messages in batches
      if (tokenMessages.length > 0) {
        const tokenResults = await this.sendBulkTokens(tokenMessages);
        results.push(...tokenResults);
      }

      // Process topic messages individually (FCM doesn't support bulk topic sends)
      if (topicMessages.length > 0) {
        const topicResults = await Promise.all(topicMessages.map((m) => this.send(m)));
        results.push(...topicResults);
      }

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      return {
        total: results.length,
        successCount,
        failureCount,
        results,
        provider: ProviderType.FCM,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('FCM bulk send failed', err);

      throw ProviderError.fromProviderError(err, ProviderType.FCM);
    }
  }

  /**
   * Send bulk messages with tokens
   */
  private async sendBulkTokens(messages: PushMessage[]): Promise<SendResult[]> {
    const results: SendResult[] = [];

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

    // Chunk into batches of 500 (FCM limit)
    const batches = chunk(tokenMessagePairs, 500);

    for (const batch of batches) {
      try {
        // Create multicast message
        const tokens = batch.map((b) => b.token);
        const sampleMessage = batch[0].message;
        const fcmMessage = this.convertToFCMMessage(sampleMessage);

        // Build multicast message compatible with FCM SDK
        const multicastMessage: admin.messaging.MulticastMessage = {
          tokens,
          notification: fcmMessage.notification,
          data: fcmMessage.data,
          android: fcmMessage.android,
          apns: fcmMessage.apns
            ? {
                payload: {
                  aps: {
                    badge: fcmMessage.apns.payload?.aps?.badge,
                    sound: fcmMessage.apns.payload?.aps?.sound,
                    contentAvailable: fcmMessage.apns.payload?.aps?.contentAvailable,
                    mutableContent: fcmMessage.apns.payload?.aps?.mutableContent,
                  },
                },
              }
            : undefined,
          webpush: fcmMessage.webpush,
        };

        // Send multicast
        const response = await this.admin.messaging().sendEachForMulticast(multicastMessage);

        // Process responses
        response.responses.forEach((resp, index) => {
          const token = tokens[index];
          if (resp.success) {
            results.push({
              success: true,
              messageId: resp.messageId,
              provider: ProviderType.FCM,
              token,
            });
          } else {
            const error = resp.error ? new Error(resp.error.message) : new Error('Unknown error');
            results.push({
              success: false,
              error: ProviderError.fromProviderError(error, ProviderType.FCM),
              provider: ProviderType.FCM,
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
            error: ProviderError.fromProviderError(err, ProviderType.FCM),
            provider: ProviderType.FCM,
            token,
          });
        }
      }
    }

    return results;
  }

  /**
   * Send to a topic
   */
  async sendToTopic(topic: string, message: PushMessage): Promise<SendResult> {
    this.ensureInitialized();

    const topicMessage: PushMessage = {
      ...message,
      topic,
      token: undefined,
    };

    return this.send(topicMessage);
  }

  /**
   * Validate FCM token
   */
  validateToken(token: string): boolean {
    return validateFCMToken(token);
  }

  /**
   * Validate message
   */
  validateMessage(message: PushMessage): { valid: boolean; errors: string[] } {
    return validateMessage(message);
  }

  /**
   * Convert universal message to FCM format
   */
  private convertToFCMMessage(message: PushMessage): FCMMessage {
    const fcmMessage: FCMMessage = {};

    // Set token or topic
    if (message.token && typeof message.token === 'string') {
      fcmMessage.token = message.token;
    } else if (message.topic) {
      fcmMessage.topic = message.topic;
    }

    // Set notification
    if (message.notification) {
      fcmMessage.notification = {
        title: message.notification.title,
        body: message.notification.body,
        imageUrl: message.notification.imageUrl,
      };
    }

    // Set data
    if (message.data) {
      fcmMessage.data = message.data;
    }

    // Set Android-specific options
    fcmMessage.android = {
      priority: message.priority === 'high' ? 'high' : 'normal',
      ttl: message.ttl,
      collapseKey: message.collapseKey,
      notification: {
        channelId: message.notification?.channelId,
        icon: message.notification?.icon,
        sound: message.notification?.sound,
      },
    };

    // Set iOS-specific options
    fcmMessage.apns = {
      payload: {
        aps: {
          badge: message.notification?.badge,
          sound: message.notification?.sound,
          contentAvailable: message.contentAvailable,
          mutableContent: message.mutableContent,
        },
      },
    };

    // Set web push options
    if (message.notification?.icon) {
      fcmMessage.webpush = {
        notification: {
          icon: message.notification.icon,
        },
      };
    }

    return fcmMessage;
  }

  /**
   * Cleanup resources
   */
  async shutdown(): Promise<void> {
    if (this.app) {
      await this.app.delete();
      this.initialized = false;
      this.logger.info('FCM provider shut down');
    }
  }
}
