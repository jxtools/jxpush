/**
 * Kafka Messaging Adapter
 * Publish messages to Kafka topics
 */

import { Kafka, Producer, CompressionTypes } from 'kafkajs';
import type { IMessagingAdapter } from './IMessagingAdapter.js';
import type {
  MessagingMessage,
  MessagingResult,
  KafkaConfig,
} from '../../types/messaging.types.js';

export class KafkaAdapter implements IMessagingAdapter {
  private kafka: Kafka;
  private producer: Producer;
  private connected: boolean = false;

  constructor(config: KafkaConfig) {
    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
      ssl: config.ssl,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sasl: config.sasl as any,
      connectionTimeout: config.connectionTimeout || 10000,
      requestTimeout: config.requestTimeout || 30000,
    });

    this.producer = this.kafka.producer({
      idempotent: true, // Ensure exactly-once semantics
      maxInFlightRequests: 5,
      transactionalId: `${config.clientId}-txn`,
    });
  }

  async connect(): Promise<void> {
    if (!this.connected) {
      await this.producer.connect();
      this.connected = true;
    }
  }

  async publish(
    topic: string,
    message: unknown,
    options?: {
      key?: string;
      headers?: Record<string, string>;
      partition?: number;
    }
  ): Promise<MessagingResult> {
    try {
      await this.connect();

      const result = await this.producer.send({
        topic,
        messages: [
          {
            key: options?.key,
            value: JSON.stringify(message),
            headers: options?.headers,
            partition: options?.partition,
            timestamp: Date.now().toString(),
          },
        ],
        compression: CompressionTypes.GZIP,
      });

      return {
        success: true,
        messageId: `${result[0].topicName}-${result[0].partition}-${result[0].baseOffset}`,
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

      // Group messages by topic
      const messagesByTopic = messages.reduce(
        (acc, msg) => {
          if (!acc[msg.topic]) {
            acc[msg.topic] = [];
          }
          acc[msg.topic].push({
            key: msg.key,
            value: JSON.stringify(msg.value),
            headers: msg.headers,
            partition: msg.partition,
            timestamp: (msg.timestamp || Date.now()).toString(),
          });
          return acc;
        },
        {} as Record<
          string,
          Array<{
            key?: string;
            value: string;
            headers?: Record<string, string>;
            partition?: number;
            timestamp: string;
          }>
        >
      );

      // Send to each topic
      const results: MessagingResult[] = [];

      for (const [topic, topicMessages] of Object.entries(messagesByTopic)) {
        try {
          const result = await this.producer.send({
            topic,
            messages: topicMessages,
            compression: CompressionTypes.GZIP,
          });

          // Create result for each message
          result.forEach((r) => {
            results.push({
              success: true,
              messageId: `${r.topicName}-${r.partition}-${r.baseOffset}`,
            });
          });
        } catch (error) {
          // Add failed results for this topic's messages
          topicMessages.forEach(() => {
            results.push({
              success: false,
              error: error instanceof Error ? error : new Error('Unknown error'),
            });
          });
        }
      }

      return results;
    } catch (error) {
      // Return failed result for all messages
      return messages.map(() => ({
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }));
    }
  }

  async close(): Promise<void> {
    if (this.connected) {
      await this.producer.disconnect();
      this.connected = false;
    }
  }
}
