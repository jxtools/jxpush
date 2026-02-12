/**
 * Message types for jxpush
 */

import { ProviderType } from './config.types';

/**
 * Message priority levels
 */
export enum MessagePriority {
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low',
}

/**
 * Notification payload structure
 */
export interface NotificationPayload {
  /**
   * Notification title
   */
  title: string;

  /**
   * Notification body text
   */
  body: string;

  /**
   * Image URL for rich notifications
   */
  imageUrl?: string;

  /**
   * Icon URL
   */
  icon?: string;

  /**
   * Sound to play (platform-specific)
   */
  sound?: string;

  /**
   * Badge count (iOS)
   */
  badge?: number;

  /**
   * Click action / deep link
   */
  clickAction?: string;

  /**
   * Notification channel ID (Android)
   */
  channelId?: string;
}

/**
 * Universal push message format
 */
export interface PushMessage {
  /**
   * Device token(s) to send to
   */
  token?: string | string[];

  /**
   * Topic to send to (alternative to token)
   */
  topic?: string;

  /**
   * Notification payload
   */
  notification?: NotificationPayload;

  /**
   * Custom data payload
   */
  data?: Record<string, string>;

  /**
   * Message priority
   */
  priority?: MessagePriority;

  /**
   * Time to live in seconds
   */
  ttl?: number;

  /**
   * Collapse key for message grouping
   */
  collapseKey?: string;

  /**
   * Content available flag (iOS silent notification)
   */
  contentAvailable?: boolean;

  /**
   * Mutable content flag (iOS notification service extension)
   */
  mutableContent?: boolean;
}

/**
 * FCM-specific message format
 */
export interface FCMMessage {
  token?: string;
  topic?: string;
  notification?: {
    title?: string;
    body?: string;
    imageUrl?: string;
  };
  data?: Record<string, string>;
  android?: {
    priority?: 'high' | 'normal';
    ttl?: number;
    collapseKey?: string;
    notification?: {
      channelId?: string;
      icon?: string;
      sound?: string;
    };
  };
  apns?: {
    payload?: {
      aps?: {
        badge?: number;
        sound?: string;
        contentAvailable?: boolean;
        mutableContent?: boolean;
      };
    };
  };
  webpush?: {
    notification?: {
      icon?: string;
    };
  };
}

/**
 * Expo-specific message format (Phase 2)
 */
export interface ExpoMessage {
  to: string | string[];
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: string;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
  ttl?: number;
}

/**
 * Result of a single send operation
 */
export interface SendResult {
  /**
   * Whether the send was successful
   */
  success: boolean;

  /**
   * Message ID from the provider (if successful)
   */
  messageId?: string;

  /**
   * Error if send failed
   */
  error?: Error;

  /**
   * Provider used
   */
  provider: ProviderType;

  /**
   * Original token
   */
  token?: string;
}

/**
 * Result of a bulk send operation
 */
export interface BulkSendResult {
  /**
   * Total messages sent
   */
  total: number;

  /**
   * Number of successful sends
   */
  successCount: number;

  /**
   * Number of failed sends
   */
  failureCount: number;

  /**
   * Individual results
   */
  results: SendResult[];

  /**
   * Provider used
   */
  provider: ProviderType;

  /**
   * Duration in milliseconds
   */
  durationMs: number;
}

/**
 * Scheduled message (Phase 2)
 */
export interface ScheduledMessage {
  /**
   * Unique ID for the scheduled message
   */
  id: string;

  /**
   * The message to send
   */
  message: PushMessage;

  /**
   * Scheduled send time
   */
  scheduledAt: Date;

  /**
   * Whether the message has been sent
   */
  sent: boolean;
}
