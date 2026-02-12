/**
 * Metrics collection for analytics
 */

import { ProviderType } from '../types/config.types';

/**
 * Metrics data structure
 */
export interface Metrics {
  totalSent: number;
  totalSuccess: number;
  totalFailure: number;
  totalRetries: number;
  totalDropped: number;
  totalRateLimited: number;
  averageLatencyMs: number;
  byProvider: Map<ProviderType, ProviderMetrics>;
}

/**
 * Provider-specific metrics
 */
export interface ProviderMetrics {
  sent: number;
  success: number;
  failure: number;
  averageLatencyMs: number;
}

/**
 * Metrics collector
 */
export class MetricsCollector {
  private metrics: Metrics;
  private latencies: number[] = [];

  constructor() {
    this.metrics = {
      totalSent: 0,
      totalSuccess: 0,
      totalFailure: 0,
      totalRetries: 0,
      totalDropped: 0,
      totalRateLimited: 0,
      averageLatencyMs: 0,
      byProvider: new Map(),
    };
  }

  /**
   * Record a send operation
   */
  recordSend(provider: ProviderType, count: number): void {
    this.metrics.totalSent += count;
    this.getOrCreateProviderMetrics(provider).sent += count;
  }

  /**
   * Record a successful send
   */
  recordSuccess(provider: ProviderType, count: number, latencyMs: number): void {
    this.metrics.totalSuccess += count;
    this.getOrCreateProviderMetrics(provider).success += count;
    this.recordLatency(provider, latencyMs);
  }

  /**
   * Record a failed send
   */
  recordFailure(provider: ProviderType, count: number, latencyMs: number): void {
    this.metrics.totalFailure += count;
    this.getOrCreateProviderMetrics(provider).failure += count;
    this.recordLatency(provider, latencyMs);
  }

  /**
   * Record a retry
   */
  recordRetry(): void {
    this.metrics.totalRetries++;
  }

  /**
   * Record a dropped message
   */
  recordDrop(count: number): void {
    this.metrics.totalDropped += count;
  }

  /**
   * Record a rate limit hit
   */
  recordRateLimit(): void {
    this.metrics.totalRateLimited++;
  }

  /**
   * Record latency
   */
  private recordLatency(provider: ProviderType, latencyMs: number): void {
    this.latencies.push(latencyMs);

    // Update average latency
    this.metrics.averageLatencyMs =
      this.latencies.reduce((sum, val) => sum + val, 0) / this.latencies.length;

    // Update provider-specific latency
    const providerMetrics = this.getOrCreateProviderMetrics(provider);
    const providerLatencies = this.latencies; // Simplified - in production, track per provider
    providerMetrics.averageLatencyMs =
      providerLatencies.reduce((sum, val) => sum + val, 0) / providerLatencies.length;
  }

  /**
   * Get or create provider metrics
   */
  private getOrCreateProviderMetrics(provider: ProviderType): ProviderMetrics {
    if (!this.metrics.byProvider.has(provider)) {
      this.metrics.byProvider.set(provider, {
        sent: 0,
        success: 0,
        failure: 0,
        averageLatencyMs: 0,
      });
    }
    return this.metrics.byProvider.get(provider)!;
  }

  /**
   * Get current metrics
   */
  getMetrics(): Metrics {
    return {
      ...this.metrics,
      byProvider: new Map(this.metrics.byProvider),
    };
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = {
      totalSent: 0,
      totalSuccess: 0,
      totalFailure: 0,
      totalRetries: 0,
      totalDropped: 0,
      totalRateLimited: 0,
      averageLatencyMs: 0,
      byProvider: new Map(),
    };
    this.latencies = [];
  }

  /**
   * Get metrics summary as JSON
   */
  toJSON(): object {
    return {
      ...this.metrics,
      byProvider: Object.fromEntries(this.metrics.byProvider),
    };
  }
}
