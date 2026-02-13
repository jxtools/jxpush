/**
 * RabbitMQ Messaging Adapter
 * Publish messages to RabbitMQ exchanges
 */

import amqp from 'amqplib';
import type { IMessagingAdapter } from './IMessagingAdapter.js';
import type {
  MessagingMessage,
  MessagingResult,
  RabbitMQConfig,
} from '../../types/messaging.types.js';

export class RabbitMQAdapter implements IMessagingAdapter {
  private config: RabbitMQConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private connection: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private channel: any = null;
  private connected: boolean = false;

  constructor(config: RabbitMQConfig) {
    this.config = {
      exchange: 'jxpush',
      exchangeType: 'topic',
      durable: true,
      prefetch: 10,
      ...config,
    };
  }

  async connect(): Promise<void> {
    if (!this.connected) {
      this.connection = await amqp.connect(this.config.url);
      this.channel = await this.connection.createChannel();

      // Set prefetch
      await this.channel.prefetch(this.config.prefetch!);

      // Assert exchange
      await this.channel.assertExchange(this.config.exchange!, this.config.exchangeType!, {
        durable: this.config.durable,
      });

      this.connected = true;
    }
  }

  async publish(
    topic: string,
    message: unknown,
    options?: {
      key?: string;
      headers?: Record<string, string>;
    }
  ): Promise<MessagingResult> {
    try {
      await this.connect();

      const routingKey = options?.key || topic;
      const messageBuffer = Buffer.from(JSON.stringify(message));

      const published = this.channel!.publish(this.config.exchange!, routingKey, messageBuffer, {
        persistent: this.config.durable,
        headers: options?.headers,
        timestamp: Date.now(),
        contentType: 'application/json',
      });

      if (!published) {
        return {
          success: false,
          error: new Error('Message buffer full, could not publish'),
        };
      }

      return {
        success: true,
        messageId: `rabbitmq_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  async publishBatch(messages: MessagingMessage[]): Promise<MessagingResult[]> {
    try {
      await this.connect();

      const results: MessagingResult[] = [];

      for (const msg of messages) {
        const result = await this.publish(msg.topic, msg.value, {
          key: msg.key,
          headers: msg.headers,
        });
        results.push(result);
      }

      // Wait for confirms if channel is in confirm mode
      if (this.channel) {
        await this.channel.waitForConfirms();
      }

      return results;
    } catch (error) {
      return messages.map(() => ({
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }));
    }
  }

  async close(): Promise<void> {
    if (this.connected) {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      this.connected = false;
    }
  }

  /**
   * Enable publisher confirms for reliable delivery
   */
  async enableConfirms(): Promise<void> {
    await this.connect();
    if (this.channel) {
      await this.channel.confirmSelect();
    }
  }
}
