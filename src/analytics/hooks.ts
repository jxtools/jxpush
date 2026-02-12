/**
 * Analytics hooks implementation
 */

import { AnalyticsHooks } from '../types/config.types.js';
import { Logger } from '../utils/logger.js';

/**
 * Hook manager for analytics events
 */
export class HookManager {
  private hooks: AnalyticsHooks;
  private logger: Logger;

  constructor(hooks: AnalyticsHooks = {}, logger: Logger) {
    this.hooks = hooks;
    this.logger = logger;
  }

  /**
   * Trigger onSendStart hook
   */
  triggerSendStart(data: Parameters<NonNullable<AnalyticsHooks['onSendStart']>>[0]): void {
    this.safeExecuteHook('onSendStart', () => this.hooks.onSendStart?.(data));
  }

  /**
   * Trigger onSendSuccess hook
   */
  triggerSendSuccess(data: Parameters<NonNullable<AnalyticsHooks['onSendSuccess']>>[0]): void {
    this.safeExecuteHook('onSendSuccess', () => this.hooks.onSendSuccess?.(data));
  }

  /**
   * Trigger onSendFailure hook
   */
  triggerSendFailure(data: Parameters<NonNullable<AnalyticsHooks['onSendFailure']>>[0]): void {
    this.safeExecuteHook('onSendFailure', () => this.hooks.onSendFailure?.(data));
  }

  /**
   * Trigger onRetry hook
   */
  triggerRetry(data: Parameters<NonNullable<AnalyticsHooks['onRetry']>>[0]): void {
    this.safeExecuteHook('onRetry', () => this.hooks.onRetry?.(data));
  }

  /**
   * Trigger onRateLimit hook
   */
  triggerRateLimit(data: Parameters<NonNullable<AnalyticsHooks['onRateLimit']>>[0]): void {
    this.safeExecuteHook('onRateLimit', () => this.hooks.onRateLimit?.(data));
  }

  /**
   * Trigger onDrop hook
   */
  triggerDrop(data: Parameters<NonNullable<AnalyticsHooks['onDrop']>>[0]): void {
    this.safeExecuteHook('onDrop', () => this.hooks.onDrop?.(data));
  }

  /**
   * Safely execute a hook, catching and logging any errors
   */
  private safeExecuteHook(hookName: string, fn: () => void): void {
    try {
      fn();
    } catch (error) {
      this.logger.error(`Error executing ${hookName} hook`, error as Error);
    }
  }

  /**
   * Update hooks
   */
  updateHooks(hooks: AnalyticsHooks): void {
    this.hooks = { ...this.hooks, ...hooks };
  }

  /**
   * Get current hooks
   */
  getHooks(): AnalyticsHooks {
    return { ...this.hooks };
  }
}
