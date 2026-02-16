/**
 * Messaging Types
 * For infrastructure messaging systems (Kafka, RabbitMQ)
 */

export interface MessagingMessage {
  topic: string;
  key?: string;
  value: unknown;
  headers?: Record<string, string>;
  partition?: number;
  timestamp?: number;
}

export interface MessagingResult {
  success: boolean;
  messageId?: string;
  error?: Error;
}

export interface RabbitMQConfig {
  url: string; // amqp://user:pass@host:port/vhost
  exchange?: string;
  exchangeType?: 'direct' | 'topic' | 'fanout' | 'headers';
  durable?: boolean;
  prefetch?: number;
}
