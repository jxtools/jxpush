/**
 * Queue manager with concurrency control and batch processing
 */

import { InMemoryQueue, QueueItem } from './InMemoryQueue.js';
import { QueueConfig } from '../types/config.types.js';
import { Logger } from '../utils/logger.js';
import { RateLimiter } from '../rateLimit/RateLimiter.js';
import { RetryEngine } from '../retry/RetryEngine.js';
import { IProvider } from '../types/provider.types.js';
import { HookManager } from '../analytics/hooks.js';

/**
 * Queue manager for orchestrating queue processing
 */
export class QueueManager {
  private queue: InMemoryQueue;
  private config: Required<QueueConfig>;
  private logger: Logger;
  private rateLimiter?: RateLimiter;
  private retryEngine?: RetryEngine;
  private hookManager?: HookManager;
  private provider?: IProvider;
  private processing = false;
  private workers: Set<Promise<void>> = new Set();

  constructor(
    config: QueueConfig,
    logger: Logger,
    rateLimiter?: RateLimiter,
    retryEngine?: RetryEngine,
    hookManager?: HookManager
  ) {
    this.config = {
      concurrency: config.concurrency ?? 5,
      enabled: config.enabled ?? true,
      maxSize: config.maxSize ?? 0,
      autoStart: config.autoStart ?? true,
    };

    this.logger = logger;
    this.queue = new InMemoryQueue(this.config.maxSize, logger);
    this.rateLimiter = rateLimiter;
    this.retryEngine = retryEngine;
    this.hookManager = hookManager;

    this.logger.debug('Queue manager initialized', {
      concurrency: this.config.concurrency,
      maxSize: this.config.maxSize,
    });
  }

  /**
   * Set provider for sending messages
   */
  setProvider(provider: IProvider): void {
    this.provider = provider;
  }

  /**
   * Add message to queue
   */
  enqueue(message: Parameters<InMemoryQueue['enqueue']>[0], priority?: number): string {
    if (!this.config.enabled) {
      throw new Error('Queue is disabled');
    }

    try {
      const id = this.queue.enqueue(message, priority);

      // Auto-start processing if configured
      if (this.config.autoStart && !this.processing) {
        this.start();
      }

      return id;
    } catch (error) {
      // Queue is full
      const err = error instanceof Error ? error : new Error(String(error));
      this.hookManager?.triggerDrop({
        reason: 'Queue full',
        messageCount: 1,
      });
      throw err;
    }
  }

  /**
   * Start queue processing
   */
  start(): void {
    if (this.processing) {
      this.logger.warn('Queue processing already started');
      return;
    }

    if (!this.provider) {
      throw new Error('Provider not set. Call setProvider() first.');
    }

    this.processing = true;
    this.logger.info('Starting queue processing', { concurrency: this.config.concurrency });

    // Start worker pool
    for (let i = 0; i < this.config.concurrency; i++) {
      const worker = this.processWorker();
      this.workers.add(worker);
      worker.finally(() => this.workers.delete(worker));
    }
  }

  /**
   * Stop queue processing
   */
  async stop(): Promise<void> {
    if (!this.processing) {
      return;
    }

    this.processing = false;
    this.logger.info('Stopping queue processing...');

    // Wait for all workers to finish
    await Promise.all(Array.from(this.workers));

    this.logger.info('Queue processing stopped');
  }

  /**
   * Worker process for handling queue items
   */
  private async processWorker(): Promise<void> {
    while (this.processing) {
      // Check if queue has items
      if (this.queue.isEmpty()) {
        // Wait a bit before checking again
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      // Dequeue item
      const item = this.queue.dequeue();
      if (!item) {
        continue;
      }

      // Process item
      await this.processItem(item);
    }
  }

  /**
   * Process a single queue item
   */
  private async processItem(item: QueueItem): Promise<void> {
    try {
      // Wait for rate limit
      if (this.rateLimiter) {
        const result = await this.rateLimiter.acquire(1);
        if (!result.success) {
          this.hookManager?.triggerRateLimit({
            waitMs: result.waitMs,
            queueSize: this.queue.size(),
          });
          await this.rateLimiter.waitAndAcquire(1);
        }
      }

      // Send message with retry
      const sendFn = async (): Promise<void> => {
        if (!this.provider) {
          throw new Error('Provider not set');
        }

        const result = await this.provider.send(item.message);

        if (!result.success) {
          throw result.error || new Error('Send failed');
        }
      };

      if (this.retryEngine) {
        await this.retryEngine.execute(sendFn);
      } else {
        await sendFn();
      }

      this.logger.debug('Queue item processed successfully', { id: item.id });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Failed to process queue item', err, { id: item.id });

      // Could implement dead letter queue here
      this.hookManager?.triggerDrop({
        reason: `Processing failed: ${err.message}`,
        messageCount: 1,
      });
    }
  }

  /**
   * Get queue status
   */
  getStatus(): {
    size: number;
    processing: boolean;
    workers: number;
    enabled: boolean;
  } {
    return {
      size: this.queue.size(),
      processing: this.processing,
      workers: this.workers.size,
      enabled: this.config.enabled,
    };
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue.clear();
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.size();
  }
}
