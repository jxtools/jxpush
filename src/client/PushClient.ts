/**
 * Main PushClient facade
 */

import { PushClientConfig, ProviderType, LogLevel } from '../types/config.types.js';
import { PushMessage, SendResult, BulkSendResult } from '../types/message.types.js';
import { IProvider } from '../types/provider.types.js';
import { FCMProvider } from '../providers/fcm/FCMProvider.js';
import { ExpoProvider } from '../providers/expo/ExpoProvider.js';
import { RateLimiter } from '../rateLimit/RateLimiter.js';
import { RetryEngine } from '../retry/RetryEngine.js';
import { QueueManager } from '../queue/QueueManager.js';
import { HookManager } from '../analytics/hooks.js';
import { MetricsCollector } from '../analytics/metrics.js';
import { MessageBuilder } from '../builder/MessageBuilder.js';
import { Logger, createLogger } from '../utils/logger.js';
import { PushError, ErrorCode } from '../errors/PushError.js';
import { chunk } from '../utils/chunk.js';

/**
 * Main PushClient class - entry point for the library
 */
export class PushClient {
  private config: PushClientConfig;
  private provider: IProvider;
  private logger: Logger;
  private rateLimiter?: RateLimiter;
  private retryEngine?: RetryEngine;
  private queueManager?: QueueManager;
  private hookManager: HookManager;
  private metricsCollector: MetricsCollector;
  private initialized = false;

  constructor(config: PushClientConfig) {
    this.config = config;

    // Initialize logger
    this.logger = createLogger(config.logLevel || LogLevel.WARN);

    // Initialize hook manager
    this.hookManager = new HookManager(config.hooks || {}, this.logger);

    // Initialize metrics collector
    this.metricsCollector = new MetricsCollector();

    // Initialize rate limiter if enabled
    if (config.rateLimit?.enabled !== false) {
      this.rateLimiter = new RateLimiter(config.rateLimit || {}, this.logger);
    }

    // Initialize retry engine if enabled
    if (config.retry?.enabled !== false) {
      this.retryEngine = new RetryEngine(config.retry || {}, this.logger, config.hooks);
    }

    // Initialize provider
    this.provider = this.createProvider(config.provider);

    // Initialize queue manager if enabled
    if (config.queue?.enabled !== false) {
      this.queueManager = new QueueManager(
        config.queue || {},
        this.logger,
        this.rateLimiter,
        this.retryEngine,
        this.hookManager
      );
      this.queueManager.setProvider(this.provider);
    }

    this.logger.info('PushClient created', { provider: config.provider });
  }

  /**
   * Create provider instance based on configuration
   */
  private createProvider(providerType: ProviderType): IProvider {
    switch (providerType) {
      case ProviderType.FCM:
        if (!this.config.fcm) {
          throw new PushError(
            'FCM configuration is required when using FCM provider',
            ErrorCode.INVALID_CONFIG
          );
        }
        return new FCMProvider(this.config.fcm, this.logger);

      case ProviderType.EXPO:
        // Expo config is optional - can be empty object or undefined
        return new ExpoProvider(this.config.expo || {}, this.logger);

      default:
        throw new PushError(`Unsupported provider: ${providerType}`, ErrorCode.INVALID_PROVIDER);
    }
  }

  /**
   * Initialize the client
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('Client already initialized');
      return;
    }

    try {
      this.logger.info('Initializing PushClient...');
      await this.provider.initialize();
      this.initialized = true;
      this.logger.info('PushClient initialized successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Failed to initialize PushClient', err);
      throw PushError.from(err, ErrorCode.PROVIDER_INIT_FAILED);
    }
  }

  /**
   * Send a single push notification
   */
  async send(message: PushMessage): Promise<SendResult> {
    this.ensureInitialized();

    const startTime = Date.now();

    try {
      // Trigger send start hook
      this.hookManager.triggerSendStart({
        messageCount: 1,
        provider: this.config.provider,
      });

      // Record metrics
      this.metricsCollector.recordSend(this.config.provider, 1);

      // Apply rate limiting
      if (this.rateLimiter) {
        await this.rateLimiter.waitAndAcquire(1);
      }

      // Send with retry
      let result: SendResult;
      if (this.retryEngine) {
        result = await this.retryEngine.execute(() => this.provider.send(message));
      } else {
        result = await this.provider.send(message);
      }

      const durationMs = Date.now() - startTime;

      // Record metrics and trigger hooks
      if (result.success) {
        this.metricsCollector.recordSuccess(this.config.provider, 1, durationMs);
        this.hookManager.triggerSendSuccess({
          messageCount: 1,
          provider: this.config.provider,
          durationMs,
        });
      } else {
        this.metricsCollector.recordFailure(this.config.provider, 1, durationMs);
        this.hookManager.triggerSendFailure({
          messageCount: 1,
          provider: this.config.provider,
          error: result.error || new Error('Unknown error'),
          durationMs,
        });
      }

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const durationMs = Date.now() - startTime;

      this.metricsCollector.recordFailure(this.config.provider, 1, durationMs);
      this.hookManager.triggerSendFailure({
        messageCount: 1,
        provider: this.config.provider,
        error: err,
        durationMs,
      });

      throw PushError.from(err);
    }
  }

  /**
   * Send multiple push notifications in bulk
   */
  async sendBulk(messages: PushMessage[]): Promise<BulkSendResult> {
    this.ensureInitialized();

    if (messages.length === 0) {
      return {
        total: 0,
        successCount: 0,
        failureCount: 0,
        results: [],
        provider: this.config.provider,
        durationMs: 0,
      };
    }

    const startTime = Date.now();

    try {
      // Trigger send start hook
      this.hookManager.triggerSendStart({
        messageCount: messages.length,
        provider: this.config.provider,
      });

      // Record metrics
      this.metricsCollector.recordSend(this.config.provider, messages.length);

      // Get provider capabilities
      const capabilities = this.provider.getCapabilities();
      const batchSize = this.config.defaultBatchSize || capabilities.maxBatchSize;

      // Chunk messages
      const batches = chunk(messages, batchSize);
      const allResults: SendResult[] = [];

      // Process batches
      for (const batch of batches) {
        // Apply rate limiting
        if (this.rateLimiter) {
          await this.rateLimiter.waitAndAcquire(batch.length);
        }

        // Send batch with retry
        let batchResult: BulkSendResult;
        if (this.retryEngine) {
          batchResult = await this.retryEngine.execute(() => this.provider.sendBulk(batch));
        } else {
          batchResult = await this.provider.sendBulk(batch);
        }

        allResults.push(...batchResult.results);
      }

      const durationMs = Date.now() - startTime;
      const successCount = allResults.filter((r) => r.success).length;
      const failureCount = allResults.filter((r) => !r.success).length;

      // Record metrics and trigger hooks
      this.metricsCollector.recordSuccess(this.config.provider, successCount, durationMs);
      this.metricsCollector.recordFailure(this.config.provider, failureCount, durationMs);

      this.hookManager.triggerSendSuccess({
        messageCount: successCount,
        provider: this.config.provider,
        durationMs,
      });

      if (failureCount > 0) {
        this.hookManager.triggerSendFailure({
          messageCount: failureCount,
          provider: this.config.provider,
          error: new Error(`${failureCount} messages failed`),
          durationMs,
        });
      }

      return {
        total: allResults.length,
        successCount,
        failureCount,
        results: allResults,
        provider: this.config.provider,
        durationMs,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const durationMs = Date.now() - startTime;

      this.metricsCollector.recordFailure(this.config.provider, messages.length, durationMs);
      this.hookManager.triggerSendFailure({
        messageCount: messages.length,
        provider: this.config.provider,
        error: err,
        durationMs,
      });

      throw PushError.from(err);
    }
  }

  /**
   * Send to a topic
   * Phase 2 - Partial implementation
   */
  async sendToTopic(topic: string, message: PushMessage): Promise<SendResult> {
    this.ensureInitialized();

    const capabilities = this.provider.getCapabilities();
    if (!capabilities.supportsTopicMessaging) {
      throw new PushError(
        `Provider ${this.config.provider} does not support topic messaging`,
        ErrorCode.PROVIDER_ERROR
      );
    }

    return this.provider.sendToTopic(topic, message);
  }

  /**
   * Queue a message for later processing
   */
  queue(message: PushMessage, priority = 0): string {
    this.ensureInitialized();

    if (!this.queueManager) {
      throw new PushError('Queue is not enabled', ErrorCode.QUEUE_ERROR);
    }

    return this.queueManager.enqueue(message, priority);
  }

  /**
   * Schedule a message for future delivery
   * Phase 2 - Scaffold only
   */
  schedule(_message: PushMessage, _scheduledAt: Date): string {
    this.ensureInitialized();
    // TODO: Implement in Phase 2
    throw new PushError('Scheduling not yet implemented (Phase 2)', ErrorCode.PROVIDER_ERROR);
  }

  /**
   * Create a new message builder
   */
  message(): MessageBuilder {
    return new MessageBuilder();
  }

  /**
   * Get current metrics
   */
  getMetrics(): ReturnType<MetricsCollector['getMetrics']> {
    return this.metricsCollector.getMetrics();
  }

  /**
   * Get queue status
   */
  getQueueStatus(): ReturnType<QueueManager['getStatus']> | null {
    return this.queueManager?.getStatus() || null;
  }

  /**
   * Get rate limiter status
   */
  getRateLimitStatus(): ReturnType<RateLimiter['getStatus']> | null {
    return this.rateLimiter?.getStatus() || null;
  }

  /**
   * Shutdown the client
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down PushClient...');

    // Stop queue processing
    if (this.queueManager) {
      await this.queueManager.stop();
    }

    // Shutdown provider
    await this.provider.shutdown();

    this.initialized = false;
    this.logger.info('PushClient shut down successfully');
  }

  /**
   * Ensure client is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new PushError(
        'Client not initialized. Call initialize() first.',
        ErrorCode.INVALID_CONFIG
      );
    }
  }
}
