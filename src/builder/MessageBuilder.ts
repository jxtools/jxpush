/**
 * Message builder with fluent API
 */

import { PushMessage, NotificationPayload, MessagePriority } from '../types/message.types.js';
import { validateMessageOrThrow } from '../validation/messageValidator.js';

/**
 * Fluent message builder
 */
export class MessageBuilder {
  private message: Partial<PushMessage> = {};

  /**
   * Set device token(s)
   */
  token(token: string | string[]): this {
    this.message.token = token;
    return this;
  }

  /**
   * Set topic
   */
  topic(topic: string): this {
    this.message.topic = topic;
    return this;
  }

  /**
   * Set notification title
   */
  title(title: string): this {
    if (!this.message.notification) {
      this.message.notification = {} as NotificationPayload;
    }
    this.message.notification.title = title;
    return this;
  }

  /**
   * Set notification body
   */
  body(body: string): this {
    if (!this.message.notification) {
      this.message.notification = {} as NotificationPayload;
    }
    this.message.notification.body = body;
    return this;
  }

  /**
   * Set notification image URL
   */
  image(imageUrl: string): this {
    if (!this.message.notification) {
      this.message.notification = {} as NotificationPayload;
    }
    this.message.notification.imageUrl = imageUrl;
    return this;
  }

  /**
   * Set notification icon
   */
  icon(icon: string): this {
    if (!this.message.notification) {
      this.message.notification = {} as NotificationPayload;
    }
    this.message.notification.icon = icon;
    return this;
  }

  /**
   * Set notification sound
   */
  sound(sound: string): this {
    if (!this.message.notification) {
      this.message.notification = {} as NotificationPayload;
    }
    this.message.notification.sound = sound;
    return this;
  }

  /**
   * Set badge count (iOS)
   */
  badge(badge: number): this {
    if (!this.message.notification) {
      this.message.notification = {} as NotificationPayload;
    }
    this.message.notification.badge = badge;
    return this;
  }

  /**
   * Set click action / deep link
   */
  clickAction(clickAction: string): this {
    if (!this.message.notification) {
      this.message.notification = {} as NotificationPayload;
    }
    this.message.notification.clickAction = clickAction;
    return this;
  }

  /**
   * Set notification channel ID (Android)
   */
  channelId(channelId: string): this {
    if (!this.message.notification) {
      this.message.notification = {} as NotificationPayload;
    }
    this.message.notification.channelId = channelId;
    return this;
  }

  /**
   * Set custom data payload
   */
  data(data: Record<string, string>): this {
    this.message.data = data;
    return this;
  }

  /**
   * Add a single data key-value pair
   */
  addData(key: string, value: string): this {
    if (!this.message.data) {
      this.message.data = {};
    }
    this.message.data[key] = value;
    return this;
  }

  /**
   * Set message priority
   */
  priority(priority: MessagePriority): this {
    this.message.priority = priority;
    return this;
  }

  /**
   * Set time to live in seconds
   */
  ttl(ttl: number): this {
    this.message.ttl = ttl;
    return this;
  }

  /**
   * Set collapse key
   */
  collapseKey(collapseKey: string): this {
    this.message.collapseKey = collapseKey;
    return this;
  }

  /**
   * Set content available flag (iOS silent notification)
   */
  contentAvailable(contentAvailable: boolean): this {
    this.message.contentAvailable = contentAvailable;
    return this;
  }

  /**
   * Set mutable content flag (iOS notification service extension)
   */
  mutableContent(mutableContent: boolean): this {
    this.message.mutableContent = mutableContent;
    return this;
  }

  /**
   * Build and validate the message
   */
  build(): PushMessage {
    const message = this.message as PushMessage;
    validateMessageOrThrow(message);
    return message;
  }

  /**
   * Build without validation (use with caution)
   */
  buildUnsafe(): PushMessage {
    return this.message as PushMessage;
  }

  /**
   * Reset builder to empty state
   */
  reset(): this {
    this.message = {};
    return this;
  }

  /**
   * Create a copy of this builder
   */
  clone(): MessageBuilder {
    const builder = new MessageBuilder();
    builder.message = { ...this.message };
    if (this.message.notification) {
      builder.message.notification = { ...this.message.notification };
    }
    if (this.message.data) {
      builder.message.data = { ...this.message.data };
    }
    return builder;
  }
}
