/**
 * jxpush - Production-grade unified push notification library
 * Main entry point
 */

// Main client
export { PushClient } from './client/PushClient.js';

// Message builder
export { MessageBuilder } from './builder/MessageBuilder.js';

// Types
export {
  ProviderType,
  LogLevel,
  PushClientConfig,
  FCMConfig,
  ExpoConfig,
  QueueConfig,
  RateLimitConfig,
  RetryConfig,
  AnalyticsHooks,
} from './types/config.types.js';

export {
  MessagePriority,
  NotificationPayload,
  PushMessage,
  FCMMessage,
  ExpoMessage,
  SendResult,
  BulkSendResult,
  ScheduledMessage,
} from './types/message.types.js';

export { ProviderCapabilities, IProvider } from './types/provider.types.js';

// Errors
export { PushError, ErrorCode } from './errors/PushError.js';
export { ValidationError } from './errors/ValidationError.js';
export { ProviderError } from './errors/ProviderError.js';

// Metrics
export { Metrics, ProviderMetrics } from './analytics/metrics.js';
