/**
 * Queue Adapter Interface
 * Defines the contract for pluggable queue backends
 */

export interface QueueJob<T = unknown> {
  id: string;
  data: T;
  priority?: number;
  delay?: number;
  attempts?: number;
  maxAttempts?: number;
  timestamp: number;
}

export interface QueueMetrics {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalProcessed: number;
  totalFailed: number;
  avgProcessingTime: number;
}

export interface QueueAdapter {
  /**
   * Enqueue a job
   */
  enqueue<T>(
    data: T,
    options?: {
      priority?: number;
      delay?: number;
      maxAttempts?: number;
    }
  ): Promise<string>;

  /**
   * Dequeue next job
   */
  dequeue<T>(): Promise<QueueJob<T> | null>;

  /**
   * Schedule a delayed job
   */
  scheduleDelayed<T>(
    data: T,
    delayMs: number,
    options?: {
      priority?: number;
      maxAttempts?: number;
    }
  ): Promise<string>;

  /**
   * Mark job as completed
   */
  complete(jobId: string): Promise<void>;

  /**
   * Mark job as failed
   */
  fail(jobId: string, error: Error): Promise<void>;

  /**
   * Retry a failed job
   */
  retry(jobId: string): Promise<void>;

  /**
   * Get queue metrics
   */
  getMetrics(): Promise<QueueMetrics>;

  /**
   * Get queue size
   */
  size(): Promise<number>;

  /**
   * Clear all jobs
   */
  clear(): Promise<void>;

  /**
   * Pause queue processing
   */
  pause(): Promise<void>;

  /**
   * Resume queue processing
   */
  resume(): Promise<void>;

  /**
   * Check if queue is paused
   */
  isPaused(): Promise<boolean>;

  /**
   * Close adapter and cleanup resources
   */
  close(): Promise<void>;
}

export interface QueueAdapterConfig {
  concurrency?: number;
  maxRetries?: number;
  retryDelay?: number;
  processInterval?: number;
}
