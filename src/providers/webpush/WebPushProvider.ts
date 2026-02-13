/**
 * Web Push Provider
 * Browser push notifications using VAPID
 */

import webpush from 'web-push';
import { Provider } from '../base/Provider.js';
import type { PushMessage, SendResult, BulkSendResult } from '../../types/message.types.js';
import type { ProviderCapabilities } from '../../types/provider.types.js';
import { ProviderType, LogLevel } from '../../types/config.types.js';
import type { WebPushConfig, WebPushMessage, WebPushOptions } from '../../types/webpush.types.js';
import { ProviderError } from '../../errors/ProviderError.js';
import { Logger } from '../../utils/logger.js';

export class WebPushProvider extends Provider {
  private config: WebPushConfig;

  constructor(config: WebPushConfig, logger?: Logger) {
    super(logger || new Logger(LogLevel.INFO));
    this.config = config;
  }

  getProviderType(): ProviderType {
    return ProviderType.WEBPUSH;
  }

  getCapabilities(): ProviderCapabilities {
    return {
      supportsSingleSend: true,
      supportsBulkSend: true,
      supportsTopicMessaging: false,
      supportsScheduling: false,
      maxBatchSize: 1000,
      recommendedRateLimit: 100,
    };
  }

  async initialize(): Promise<void> {
    // Set VAPID details
    webpush.setVapidDetails(
      this.config.vapidKeys.subject,
      this.config.vapidKeys.publicKey,
      this.config.vapidKeys.privateKey
    );

    if (this.config.gcmApiKey) {
      webpush.setGCMAPIKey(this.config.gcmApiKey);
    }

    this.initialized = true;
  }

  async shutdown(): Promise<void> {
    // No cleanup needed for web-push
    this.initialized = false;
  }

  async send(message: PushMessage): Promise<SendResult> {
    this.ensureInitialized();

    try {
      // Extract subscription from token (token should be JSON stringified subscription)
      const subscription =
        typeof message.token === 'string' ? JSON.parse(message.token) : message.token;

      // Build notification payload
      const payload = this.buildPayload(message);

      // Build options
      const options: WebPushOptions = {
        ttl: 86400, // 24 hours default
        urgency: this.mapPriority(message.priority),
      };

      // Send notification
      await webpush.sendNotification(subscription, JSON.stringify(payload), options);

      return {
        success: true,
        messageId: `webpush_${Date.now()}`,
        provider: ProviderType.WEBPUSH,
      };
    } catch (error) {
      const providerError = new ProviderError(
        `Web Push send failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ProviderType.WEBPUSH,
        undefined,
        false,
        undefined,
        error instanceof Error ? error : undefined
      );

      return {
        success: false,
        provider: ProviderType.WEBPUSH,
        error: providerError,
      };
    }
  }

  async sendBulk(messages: PushMessage[]): Promise<BulkSendResult> {
    this.ensureInitialized();

    const startTime = Date.now();
    const results = await Promise.all(messages.map((msg) => this.send(msg)));

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      total: messages.length,
      successCount: successful,
      failureCount: failed,
      results,
      provider: ProviderType.WEBPUSH,
      durationMs: Date.now() - startTime,
    };
  }

  async sendToTopic(_topic: string, _message: PushMessage): Promise<SendResult> {
    throw new Error('Topic messaging not supported for Web Push');
  }

  validateToken(token: string | string[]): boolean {
    if (Array.isArray(token)) return false;
    try {
      const subscription = JSON.parse(token);
      return !!(subscription.endpoint && subscription.keys?.p256dh && subscription.keys?.auth);
    } catch {
      return false;
    }
  }

  validateMessage(message: PushMessage): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!message.token) {
      errors.push('Token is required');
    } else if (!this.validateToken(message.token)) {
      errors.push('Invalid Web Push subscription format');
    }

    if (!message.notification?.title && !message.notification?.body) {
      errors.push('Either title or body is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Build notification payload
   */
  private buildPayload(message: PushMessage): WebPushMessage {
    const tokenStr = Array.isArray(message.token) ? message.token[0] : message.token || '';
    const payload: WebPushMessage = {
      subscription: JSON.parse(tokenStr),
      title: message.notification?.title || '',
      body: message.notification?.body || '',
      icon: message.notification?.imageUrl,
      data: message.data,
    };

    // Add badge if present
    if (message.notification?.badge) {
      payload.badge = message.notification.badge.toString();
    }

    // Add sound (not directly supported, but can be in data)
    if (message.notification?.sound) {
      payload.data = {
        ...payload.data,
        sound: message.notification.sound,
      };
    }

    return payload;
  }

  /**
   * Map message priority to web push urgency
   */
  private mapPriority(
    priority?: 'high' | 'normal' | 'low'
  ): 'very-low' | 'low' | 'normal' | 'high' {
    switch (priority) {
      case 'high':
        return 'high';
      case 'low':
        return 'low';
      default:
        return 'normal';
    }
  }

  /**
   * Generate VAPID keys (static utility method)
   */
  static generateVAPIDKeys(): { publicKey: string; privateKey: string } {
    return webpush.generateVAPIDKeys();
  }
}
