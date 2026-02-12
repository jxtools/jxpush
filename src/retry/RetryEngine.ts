/**
 * Retry engine with exponential backoff
 */

import { RetryConfig, AnalyticsHooks } from '../types/config.types.js';
import { Logger } from '../utils/logger.js';
import { PushError } from '../errors/PushError.js';
import { calculateBackoff, sleep } from '../utils/backoff.js';

/**
 * Retry context for tracking retry state
 */
export interface RetryContext {
  attempt: number;
  maxAttempts: number;
  lastError?: Error;
  totalDelayMs: number;
}

/**
 * Retry engine with exponential backoff and hooks
 */
export class RetryEngine {
  private config: Required<RetryConfig>;
  private logger: Logger;
  private hooks?: AnalyticsHooks;

  constructor(config: RetryConfig, logger: Logger, hooks?: AnalyticsHooks) {
    // Set defaults
    this.config = {
      maxAttempts: config.maxAttempts ?? 3,
      initialDelayMs: config.initialDelayMs ?? 1000,
      maxDelayMs: config.maxDelayMs ?? 30000,
      backoffMultiplier: config.backoffMultiplier ?? 2,
      enabled: config.enabled ?? true,
      useJitter: config.useJitter ?? true,
    };

    this.logger = logger;
    this.hooks = hooks;

    this.logger.debug('Retry engine initialized', {
      maxAttempts: this.config.maxAttempts,
      initialDelayMs: this.config.initialDelayMs,
    });
  }

  /**
   * Execute a function with retry logic
   * @param fn - Function to execute
   * @param context - Optional retry context for tracking
   * @returns Result of the function
   */
  async execute<T>(fn: () => Promise<T>, context?: RetryContext): Promise<T> {
    if (!this.config.enabled) {
      return fn();
    }

    const ctx: RetryContext = context || {
      attempt: 0,
      maxAttempts: this.config.maxAttempts,
      totalDelayMs: 0,
    };

    let lastError: Error;

    for (let attempt = 0; attempt < this.config.maxAttempts; attempt++) {
      ctx.attempt = attempt;

      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        ctx.lastError = lastError;

        // Check if error is retryable
        const isRetryable = PushError.isRetryable(lastError);

        // Don't retry if this is the last attempt or error is not retryable
        if (attempt === this.config.maxAttempts - 1 || !isRetryable) {
          this.logger.debug('Not retrying', {
            attempt,
            isLastAttempt: attempt === this.config.maxAttempts - 1,
            isRetryable,
          });
          throw lastError;
        }

        // Calculate backoff delay
        const delayMs = calculateBackoff(
          attempt,
          this.config.initialDelayMs,
          this.config.maxDelayMs,
          this.config.backoffMultiplier,
          this.config.useJitter
        );

        ctx.totalDelayMs += delayMs;

        this.logger.debug('Retrying after error', {
          attempt: attempt + 1,
          maxAttempts: this.config.maxAttempts,
          delayMs,
          error: lastError.message,
        });

        // Call retry hook
        if (this.hooks?.onRetry) {
          try {
            this.hooks.onRetry({
              attempt: attempt + 1,
              maxAttempts: this.config.maxAttempts,
              error: lastError,
              delayMs,
            });
          } catch (hookError) {
            this.logger.error('Error in onRetry hook', hookError as Error);
          }
        }

        // Wait before retrying
        await sleep(delayMs);
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError!;
  }

  /**
   * Execute with custom retry configuration
   */
  async executeWithConfig<T>(fn: () => Promise<T>, customConfig: Partial<RetryConfig>): Promise<T> {
    const originalConfig = { ...this.config };

    // Temporarily override config
    this.config = {
      ...this.config,
      ...customConfig,
    };

    try {
      return await this.execute(fn);
    } finally {
      // Restore original config
      this.config = originalConfig;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<RetryConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RetryConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
    this.logger.debug('Retry config updated', config);
  }
}
