/**
 * jxpush - Zero-bloat modular messaging engine
 * Main entry point
 */

// Config helper
export { defineConfig } from './config.js';

// Core registries
export { ProviderRegistry } from './core/ProviderRegistry.js';
export { AdapterRegistry } from './core/AdapterRegistry.js';

// Main client
export { PushClient } from './client/PushClient.js';

// Message builder
export { MessageBuilder } from './builder/MessageBuilder.js';

// Providers
export { FCMProvider } from './providers/fcm/FCMProvider.js';
export { ExpoProvider } from './providers/expo/ExpoProvider.js';
export { WebPushProvider } from './providers/webpush/WebPushProvider.js';

// Queue Adapters
export {
  QueueAdapter,
  QueueJob,
  QueueMetrics,
  QueueAdapterConfig,
} from './queue/adapters/IQueueAdapter.js';
export { BaseQueueAdapter } from './queue/adapters/BaseQueueAdapter.js';
export { RedisQueueAdapter, RedisQueueAdapterConfig } from './queue/adapters/RedisQueueAdapter.js';
export { BullMQAdapter, BullMQAdapterConfig } from './queue/adapters/BullMQAdapter.js';

// In-Memory Queue
export { InMemoryQueue } from './queue/InMemoryQueue.js';

// Email Adapters
export { IEmailAdapter } from './adapters/email/IEmailAdapter.js';
export { ResendAdapter } from './adapters/email/ResendAdapter.js';
export { SMTPAdapter } from './adapters/email/SMTPAdapter.js';

// Messaging Adapters
export { IMessagingAdapter } from './adapters/messaging/IMessagingAdapter.js';

export { RabbitMQAdapter } from './adapters/messaging/RabbitMQAdapter.js';

// Template Engine
export { TemplateEngine } from './templates/TemplateEngine.js';
export { TemplateLoader } from './templates/TemplateLoader.js';

// Localization
export { LocalizationEngine } from './localization/LocalizationEngine.js';
export { LocaleLoader } from './localization/LocaleLoader.js';

// Types - Config
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

// Types - Messages
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

// Types - Providers
export { ProviderCapabilities, IProvider } from './types/provider.types.js';

// Types - Web Push
export {
  WebPushConfig,
  WebPushSubscription,
  WebPushMessage,
  WebPushOptions,
  WebPushResult,
} from './types/webpush.types.js';

// Types - Email
export {
  EmailMessage,
  EmailAttachment,
  EmailSendResult,
  ResendConfig,
  SMTPConfig,
} from './types/email.types.js';

// Types - Messaging
export { MessagingMessage, MessagingResult, RabbitMQConfig } from './types/messaging.types.js';

// Types - Templates
export {
  Template,
  TemplateData,
  TemplateConfig,
  RenderedTemplate,
} from './types/template.types.js';

// Types - Localization
export { Locale, LocaleData, LocalizationConfig } from './types/localization.types.js';

// Errors
export { PushError, ErrorCode } from './errors/PushError.js';
export { ValidationError } from './errors/ValidationError.js';
export { ProviderError } from './errors/ProviderError.js';

// Metrics
export { Metrics, ProviderMetrics } from './analytics/metrics.js';
