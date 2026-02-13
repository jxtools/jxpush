/**
 * Redis Queue Adapter
 * Queue implementation using Redis lists and sorted sets
 */

import Redis from 'ioredis';
import { BaseQueueAdapter } from './BaseQueueAdapter.js';
import type { QueueJob, QueueAdapterConfig } from './IQueueAdapter.js';

export interface RedisQueueAdapterConfig extends QueueAdapterConfig {
  redis?: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
  };
  redisClient?: Redis;
}

export class RedisQueueAdapter extends BaseQueueAdapter {
  private redis: Redis;
  private ownRedis: boolean;
  private keyPrefix: string;
  private processingSet: Set<string> = new Set();

  constructor(config: RedisQueueAdapterConfig = {}) {
    super(config);

    this.keyPrefix = config.redis?.keyPrefix || 'jxpush:queue:';

    if (config.redisClient) {
      this.redis = config.redisClient;
      this.ownRedis = false;
    } else {
      this.redis = new Redis({
        host: config.redis?.host || 'localhost',
        port: config.redis?.port || 6379,
        password: config.redis?.password,
        db: config.redis?.db || 0,
      });
      this.ownRedis = true;
    }
  }

  async enqueue<T>(
    data: T,
    options?: {
      priority?: number;
      delay?: number;
      maxAttempts?: number;
    }
  ): Promise<string> {
    const jobId = this.generateJobId();
    const job: QueueJob<T> = {
      id: jobId,
      data,
      priority: options?.priority || 0,
      delay: options?.delay,
      attempts: 0,
      maxAttempts: options?.maxAttempts || this.config.maxRetries || 3,
      timestamp: Date.now(),
    };

    if (options?.delay && options.delay > 0) {
      // Use sorted set for delayed jobs
      const executeAt = Date.now() + options.delay;
      await this.redis.zadd(`${this.keyPrefix}delayed`, executeAt, JSON.stringify(job));
    } else {
      // Use list for immediate jobs (right push for FIFO)
      await this.redis.rpush(`${this.keyPrefix}pending`, JSON.stringify(job));
    }

    this.updateMetrics({ pending: await this.size() });
    return jobId;
  }

  async dequeue<T>(): Promise<QueueJob<T> | null> {
    if (this.paused) {
      return null;
    }

    // First, move any delayed jobs that are ready
    await this.moveDelayedJobs();

    // Pop from pending queue (left pop for FIFO)
    const jobData = await this.redis.lpop(`${this.keyPrefix}pending`);

    if (!jobData) {
      return null;
    }

    const job = JSON.parse(jobData) as QueueJob<T>;

    // Add to processing set
    this.processingSet.add(job.id);
    await this.redis.hset(`${this.keyPrefix}processing`, job.id, JSON.stringify(job));

    this.updateMetrics({
      pending: await this.size(),
      processing: this.processingSet.size,
    });

    return job;
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

  async complete(jobId: string): Promise<void> {
    // Remove from processing
    await this.redis.hdel(`${this.keyPrefix}processing`, jobId);
    this.processingSet.delete(jobId);

    // Add to completed
    await this.redis.sadd(`${this.keyPrefix}completed`, jobId);

    this.updateMetrics({
      processing: this.processingSet.size,
      completed: this.metrics.completed + 1,
      totalProcessed: this.metrics.totalProcessed + 1,
    });
  }

  async fail(jobId: string, error: Error): Promise<void> {
    // Get job from processing
    const jobData = await this.redis.hget(`${this.keyPrefix}processing`, jobId);

    if (!jobData) {
      return;
    }

    const job = JSON.parse(jobData) as QueueJob;
    job.attempts = (job.attempts || 0) + 1;

    // Remove from processing
    await this.redis.hdel(`${this.keyPrefix}processing`, jobId);
    this.processingSet.delete(jobId);

    if (job.attempts < (job.maxAttempts || this.config.maxRetries || 3)) {
      // Retry with exponential backoff
      const delay = this.config.retryDelay! * Math.pow(2, job.attempts - 1);
      const executeAt = Date.now() + delay;

      await this.redis.zadd(`${this.keyPrefix}delayed`, executeAt, JSON.stringify(job));
    } else {
      // Max retries reached, move to failed
      await this.redis.hset(
        `${this.keyPrefix}failed`,
        jobId,
        JSON.stringify({ job, error: error.message })
      );

      this.updateMetrics({
        failed: this.metrics.failed + 1,
        totalFailed: this.metrics.totalFailed + 1,
      });
    }

    this.updateMetrics({
      processing: this.processingSet.size,
    });
  }

  async retry(jobId: string): Promise<void> {
    // Get job from failed
    const failedData = await this.redis.hget(`${this.keyPrefix}failed`, jobId);

    if (!failedData) {
      return;
    }

    const { job } = JSON.parse(failedData);
    job.attempts = 0;

    // Remove from failed
    await this.redis.hdel(`${this.keyPrefix}failed`, jobId);

    // Add back to pending
    await this.redis.rpush(`${this.keyPrefix}pending`, JSON.stringify(job));

    this.updateMetrics({
      failed: this.metrics.failed - 1,
      pending: await this.size(),
    });
  }

  async size(): Promise<number> {
    return await this.redis.llen(`${this.keyPrefix}pending`);
  }

  async clear(): Promise<void> {
    const keys = await this.redis.keys(`${this.keyPrefix}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }

    this.processingSet.clear();
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

  async close(): Promise<void> {
    if (this.ownRedis) {
      await this.redis.quit();
    }
  }

  /**
   * Move delayed jobs that are ready to pending queue
   */
  private async moveDelayedJobs(): Promise<void> {
    const now = Date.now();

    // Get all jobs with score <= now
    const jobs = await this.redis.zrangebyscore(`${this.keyPrefix}delayed`, 0, now);

    if (jobs.length === 0) {
      return;
    }

    // Move to pending queue
    const pipeline = this.redis.pipeline();

    for (const jobData of jobs) {
      pipeline.rpush(`${this.keyPrefix}pending`, jobData);
      pipeline.zrem(`${this.keyPrefix}delayed`, jobData);
    }

    await pipeline.exec();
  }

  /**
   * Get detailed metrics
   */
  async getMetrics() {
    const pending = await this.redis.llen(`${this.keyPrefix}pending`);
    const processing = await this.redis.hlen(`${this.keyPrefix}processing`);
    const completed = await this.redis.scard(`${this.keyPrefix}completed`);
    const failed = await this.redis.hlen(`${this.keyPrefix}failed`);

    return {
      pending,
      processing,
      completed,
      failed,
      totalProcessed: this.metrics.totalProcessed,
      totalFailed: this.metrics.totalFailed,
      avgProcessingTime: this.metrics.avgProcessingTime,
    };
  }
}
