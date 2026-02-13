/**
 * BullMQ Queue Adapter
 * Queue implementation using BullMQ
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';
import { BaseQueueAdapter } from './BaseQueueAdapter.js';
import type { QueueJob, QueueAdapterConfig } from './IQueueAdapter.js';

export interface BullMQAdapterConfig extends QueueAdapterConfig {
  connection?: ConnectionOptions;
  queueName?: string;
}

export class BullMQAdapter extends BaseQueueAdapter {
  private queue: Queue;
  private queueEvents: QueueEvents;
  private queueName: string;

  constructor(config: BullMQAdapterConfig = {}) {
    super(config);

    this.queueName = config.queueName || 'jxpush';

    const connection: ConnectionOptions = config.connection || {
      host: 'localhost',
      port: 6379,
    };

    this.queue = new Queue(this.queueName, { connection });
    this.queueEvents = new QueueEvents(this.queueName, { connection });

    // Set up event listeners for metrics
    this.setupEventListeners();
  }

  async enqueue<T>(
    data: T,
    options?: {
      priority?: number;
      delay?: number;
      maxAttempts?: number;
    }
  ): Promise<string> {
    const job = await this.queue.add('push-notification', data, {
      priority: options?.priority,
      delay: options?.delay,
      attempts: options?.maxAttempts || this.config.maxRetries || 3,
      backoff: {
        type: 'exponential',
        delay: this.config.retryDelay || 1000,
      },
    });

    return job.id!;
  }

  async dequeue<T>(): Promise<QueueJob<T> | null> {
    // BullMQ handles dequeuing automatically via workers
    // This method is not typically used with BullMQ
    // Instead, you would use createWorker() to process jobs
    throw new Error('BullMQ uses workers for job processing. Use createWorker() instead.');
  }

  async scheduleDelayed<T>(
    data: T,
    delayMs: number,
    options?: {
      priority?: number;
      maxAttempts?: number;
    }
  ): Promise<string> {
    return this.enqueue(data, { ...options, delay: delayMs });
  }

  async complete(_jobId: string): Promise<void> {
    // BullMQ handles completion automatically
    // This is a no-op for BullMQ
    this.updateMetrics({
      completed: this.metrics.completed + 1,
      totalProcessed: this.metrics.totalProcessed + 1,
    });
  }

  async fail(jobId: string, error: Error): Promise<void> {
    const job = await this.queue.getJob(jobId);
    if (job) {
      await job.moveToFailed(error, '0', true);
    }

    this.updateMetrics({
      failed: this.metrics.failed + 1,
      totalFailed: this.metrics.totalFailed + 1,
    });
  }

  async retry(jobId: string): Promise<void> {
    const job = await this.queue.getJob(jobId);
    if (job) {
      await job.retry();
    }
  }

  async size(): Promise<number> {
    const counts = await this.queue.getJobCounts('waiting', 'delayed');
    return (counts.waiting || 0) + (counts.delayed || 0);
  }

  async clear(): Promise<void> {
    await this.queue.obliterate({ force: true });

    this.metrics = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      totalProcessed: 0,
      totalFailed: 0,
      avgProcessingTime: 0,
    };
  }

  async pause(): Promise<void> {
    await this.queue.pause();
    this.paused = true;
  }

  async resume(): Promise<void> {
    await this.queue.resume();
    this.paused = false;
  }

  async isPaused(): Promise<boolean> {
    return await this.queue.isPaused();
  }

  async close(): Promise<void> {
    await this.queueEvents.close();
    await this.queue.close();
  }

  async getMetrics() {
    const counts = await this.queue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed'
    );

    return {
      pending: (counts.waiting || 0) + (counts.delayed || 0),
      processing: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      totalProcessed: this.metrics.totalProcessed,
      totalFailed: this.metrics.totalFailed,
      avgProcessingTime: this.metrics.avgProcessingTime,
    };
  }

  /**
   * Create a worker to process jobs
   * This is the recommended way to process jobs with BullMQ
   */
  createWorker<T>(
    processor: (job: Job<T>) => Promise<void>,
    options?: {
      concurrency?: number;
    }
  ): Worker {
    const worker = new Worker<T>(
      this.queueName,
      async (job) => {
        const startTime = Date.now();

        await processor(job);

        const processingTime = Date.now() - startTime;
        this.updateAvgProcessingTime(processingTime);
      },
      {
        connection: this.queue.opts.connection,
        concurrency: options?.concurrency || this.config.concurrency || 10,
      }
    );

    return worker;
  }

  /**
   * Set up event listeners for metrics tracking
   */
  private setupEventListeners(): void {
    this.queueEvents.on('completed', () => {
      this.updateMetrics({
        completed: this.metrics.completed + 1,
        totalProcessed: this.metrics.totalProcessed + 1,
      });
    });

    this.queueEvents.on('failed', () => {
      this.updateMetrics({
        failed: this.metrics.failed + 1,
        totalFailed: this.metrics.totalFailed + 1,
      });
    });
  }

  /**
   * Update average processing time
   */
  private updateAvgProcessingTime(newTime: number): void {
    const total = this.metrics.totalProcessed;
    const currentAvg = this.metrics.avgProcessingTime;
    const newAvg = (currentAvg * total + newTime) / (total + 1);

    this.updateMetrics({ avgProcessingTime: newAvg });
  }
}
