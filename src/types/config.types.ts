/**
 * Configuration types for jxpush
 */

/**
 * Provider types supported by jxpush
 */
export enum ProviderType {
  FCM = 'fcm',
  EXPO = 'expo',
}

/**
 * Log levels for internal logging
 */
export enum LogLevel {
  NONE = 'none',
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

/**
 * Firebase Cloud Messaging configuration
 */
export interface FCMConfig {
  /**
   * Path to Firebase service account JSON file
   */
  serviceAccountPath?: string;

  /**
   * Firebase service account JSON object
   */
  serviceAccount?: object;

  /**
   * Firebase project ID (optional, extracted from service account)
   */
  projectId?: string;
}

/**
 * Expo Push Notification configuration (Phase 2)
 */
export interface ExpoConfig {
  /**
   * Expo access token
   */
  accessToken?: string;

  /**
   * Use Expo's development mode
   */
  useDevelopmentMode?: boolean;
}

/**
 * Queue configuration
 */
export interface QueueConfig {
  /**
   * Maximum number of concurrent workers processing the queue
   * @default 5
   */
  concurrency?: number;

  /**
   * Enable queue processing
   * @default true
   */
  enabled?: boolean;

  /**
   * Maximum queue size (0 = unlimited)
   * @default 0
   */
  maxSize?: number;

  /**
   * Auto-start queue processing on initialization
   * @default true
   */
  autoStart?: boolean;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  /**
   * Maximum requests per second
   * @default 100
   */
  maxPerSecond?: number;

  /**
   * Maximum requests per minute
   * @default 3000
   */
  maxPerMinute?: number;

  /**
   * Enable rate limiting
   * @default true
   */
  enabled?: boolean;

  /**
   * Allow burst requests (temporary exceeding of limits)
   * @default true
   */
  allowBurst?: boolean;

  /**
   * Burst capacity multiplier
   * @default 1.5
   */
  burstMultiplier?: number;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxAttempts?: number;

  /**
   * Initial delay in milliseconds before first retry
   * @default 1000
   */
  initialDelayMs?: number;

  /**
   * Maximum delay in milliseconds between retries
   * @default 30000
   */
  maxDelayMs?: number;

  /**
   * Exponential backoff multiplier
   * @default 2
   */
  backoffMultiplier?: number;

  /**
   * Enable retry logic
   * @default true
   */
  enabled?: boolean;

  /**
   * Add random jitter to retry delays
   * @default true
   */
  useJitter?: boolean;
}

/**
 * Analytics hook functions
 */
export interface AnalyticsHooks {
  /**
   * Called when a send operation starts
   */
  onSendStart?: (data: { messageCount: number; provider: ProviderType }) => void;

  /**
   * Called when a send operation succeeds
   */
  onSendSuccess?: (data: {
    messageCount: number;
    provider: ProviderType;
    durationMs: number;
  }) => void;

  /**
   * Called when a send operation fails
   */
  onSendFailure?: (data: {
    messageCount: number;
    provider: ProviderType;
    error: Error;
    durationMs: number;
  }) => void;

  /**
   * Called when a retry is attempted
   */
  onRetry?: (data: {
    attempt: number;
    maxAttempts: number;
    error: Error;
    delayMs: number;
  }) => void;

  /**
   * Called when rate limit is hit
   */
  onRateLimit?: (data: { waitMs: number; queueSize: number }) => void;

  /**
   * Called when a message is dropped (e.g., queue full, validation failed)
   */
  onDrop?: (data: { reason: string; messageCount: number }) => void;
}

/**
 * Main configuration for PushClient
 */
export interface PushClientConfig {
  /**
   * Provider type to use
   */
  provider: ProviderType;

  /**
   * FCM-specific configuration
   */
  fcm?: FCMConfig;

  /**
   * Expo-specific configuration
   */
  expo?: ExpoConfig;

  /**
   * Queue configuration
   */
  queue?: QueueConfig;

  /**
   * Rate limiting configuration
   */
  rateLimit?: RateLimitConfig;

  /**
   * Retry configuration
   */
  retry?: RetryConfig;

  /**
   * Analytics hooks
   */
  hooks?: AnalyticsHooks;

  /**
   * Log level for internal logging
   * @default LogLevel.WARN
   */
  logLevel?: LogLevel;

  /**
   * Default batch size for bulk operations
   * @default 500
   */
  defaultBatchSize?: number;
}
