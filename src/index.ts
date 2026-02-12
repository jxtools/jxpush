/**
 * jxpush - Production-grade unified push notification library
 * Main entry point
 */

// Main client
export { PushClient } from './client/PushClient';

// Message builder
export { MessageBuilder } from './builder/MessageBuilder';

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
} from './types/config.types';

export {
  MessagePriority,
  NotificationPayload,
  PushMessage,
  FCMMessage,
  ExpoMessage,
  SendResult,
  BulkSendResult,
  ScheduledMessage,
} from './types/message.types';

export {
  ProviderCapabilities,
  IProvider,
} from './types/provider.types';

// Errors
export { PushError, ErrorCode } from './errors/PushError';
export { ValidationError } from './errors/ValidationError';
export { ProviderError } from './errors/ProviderError';

// Metrics
export { Metrics, ProviderMetrics } from './analytics/metrics';
