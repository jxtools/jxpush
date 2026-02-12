/**
 * Rate limiter implementation using token bucket algorithm
 */

import { RateLimitConfig } from '../types/config.types.js';
import { Logger } from '../utils/logger.js';

/**
 * Token bucket for rate limiting
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number; // tokens per millisecond

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Try to consume tokens
   * @returns true if tokens were consumed, false otherwise
   */
  tryConsume(count: number): boolean {
    this.refill();

    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }

    return false;
  }

  /**
   * Get time until tokens are available
   * @returns milliseconds until tokens are available
   */
  getWaitTime(count: number): number {
    this.refill();

    if (this.tokens >= count) {
      return 0;
    }

    const tokensNeeded = count - this.tokens;
    return Math.ceil(tokensNeeded / this.refillRate);
  }

  /**
   * Refill tokens based on time elapsed
   */
  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Get current token count
   */
  getTokenCount(): number {
    this.refill();
    return this.tokens;
  }
}

/**
 * Rate limiter with per-second and per-minute limits
 */
export class RateLimiter {
  private config: Required<RateLimitConfig>;
  private logger: Logger;
  private perSecondBucket: TokenBucket;
  private perMinuteBucket: TokenBucket;

  constructor(config: RateLimitConfig, logger: Logger) {
    // Set defaults
    this.config = {
      maxPerSecond: config.maxPerSecond ?? 100,
      maxPerMinute: config.maxPerMinute ?? 3000,
      enabled: config.enabled ?? true,
      allowBurst: config.allowBurst ?? true,
      burstMultiplier: config.burstMultiplier ?? 1.5,
    };

    this.logger = logger;

    // Calculate bucket capacities (with burst support)
    const perSecondCapacity = this.config.allowBurst
      ? Math.floor(this.config.maxPerSecond * this.config.burstMultiplier)
      : this.config.maxPerSecond;

    const perMinuteCapacity = this.config.allowBurst
      ? Math.floor(this.config.maxPerMinute * this.config.burstMultiplier)
      : this.config.maxPerMinute;

    // Create token buckets
    this.perSecondBucket = new TokenBucket(
      perSecondCapacity,
      this.config.maxPerSecond / 1000 // tokens per millisecond
    );

    this.perMinuteBucket = new TokenBucket(
      perMinuteCapacity,
      this.config.maxPerMinute / 60000 // tokens per millisecond
    );

    this.logger.debug('Rate limiter initialized', {
      maxPerSecond: this.config.maxPerSecond,
      maxPerMinute: this.config.maxPerMinute,
      allowBurst: this.config.allowBurst,
    });
  }

  /**
   * Try to acquire permits for rate limiting
   * @param count - Number of permits to acquire
   * @returns Object with success status and wait time if needed
   */
  async acquire(count = 1): Promise<{ success: boolean; waitMs: number }> {
    if (!this.config.enabled) {
      return { success: true, waitMs: 0 };
    }

    // Check both buckets
    const canConsumePerSecond = this.perSecondBucket.tryConsume(count);
    const canConsumePerMinute = this.perMinuteBucket.tryConsume(count);

    if (canConsumePerSecond && canConsumePerMinute) {
      return { success: true, waitMs: 0 };
    }

    // Calculate wait time
    const waitPerSecond = this.perSecondBucket.getWaitTime(count);
    const waitPerMinute = this.perMinuteBucket.getWaitTime(count);
    const waitMs = Math.max(waitPerSecond, waitPerMinute);

    this.logger.debug('Rate limit hit', { waitMs, count });

    return { success: false, waitMs };
  }

  /**
   * Wait until permits are available and acquire them
   * @param count - Number of permits to acquire
   */
  async waitAndAcquire(count = 1): Promise<void> {
    const result = await this.acquire(count);

    if (!result.success) {
      this.logger.debug('Waiting for rate limit', { waitMs: result.waitMs });
      await new Promise((resolve) => setTimeout(resolve, result.waitMs));
      // Try again after waiting
      await this.waitAndAcquire(count);
    }
  }

  /**
   * Get current status
   */
  getStatus(): {
    perSecondTokens: number;
    perMinuteTokens: number;
    enabled: boolean;
  } {
    return {
      perSecondTokens: this.perSecondBucket.getTokenCount(),
      perMinuteTokens: this.perMinuteBucket.getTokenCount(),
      enabled: this.config.enabled,
    };
  }

  /**
   * Reset rate limiter
   */
  reset(): void {
    this.perSecondBucket = new TokenBucket(
      this.config.maxPerSecond,
      this.config.maxPerSecond / 1000
    );
    this.perMinuteBucket = new TokenBucket(
      this.config.maxPerMinute,
      this.config.maxPerMinute / 60000
    );
    this.logger.debug('Rate limiter reset');
  }
}
