/**
 * Base Queue Adapter
 * Abstract base class with common functionality
 */

import type { QueueAdapter, QueueJob, QueueMetrics, QueueAdapterConfig } from './IQueueAdapter.js';

export abstract class BaseQueueAdapter implements QueueAdapter {
  protected config: QueueAdapterConfig;
  protected paused: boolean = false;
  protected metrics: QueueMetrics = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    totalProcessed: 0,
    totalFailed: 0,
    avgProcessingTime: 0,
  };

  constructor(config: QueueAdapterConfig = {}) {
    this.config = {
      concurrency: 10,
      maxRetries: 3,
      retryDelay: 1000,
      processInterval: 100,
      ...config,
    };
  }

  abstract enqueue<T>(
    data: T,
    options?: {
      priority?: number;
      delay?: number;
      maxAttempts?: number;
    }
  ): Promise<string>;

  abstract dequeue<T>(): Promise<QueueJob<T> | null>;

  abstract scheduleDelayed<T>(
    data: T,
    delayMs: number,
    options?: {
      priority?: number;
      maxAttempts?: number;
    }
  ): Promise<string>;

  abstract complete(jobId: string): Promise<void>;

  abstract fail(jobId: string, error: Error): Promise<void>;

  abstract retry(jobId: string): Promise<void>;

  abstract size(): Promise<number>;

  abstract clear(): Promise<void>;

  async getMetrics(): Promise<QueueMetrics> {
    return { ...this.metrics };
  }

  async pause(): Promise<void> {
    this.paused = true;
  }

  async resume(): Promise<void> {
    this.paused = false;
  }

  async isPaused(): Promise<boolean> {
    return this.paused;
  }

  abstract close(): Promise<void>;

  /**
   * Generate unique job ID
   */
  protected generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Update metrics
   */
  protected updateMetrics(update: Partial<QueueMetrics>): void {
    this.metrics = {
      ...this.metrics,
      ...update,
    };
  }
}
