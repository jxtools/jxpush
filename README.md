# jxpush

Production-grade unified push notification library for Node.js with FCM and Expo support.

[![npm version](https://img.shields.io/npm/v/jxpush.svg)](https://www.npmjs.com/package/jxpush)

## Features

✨ **Multi-Provider Support** - FCM and Expo fully supported
🚀 **Bulk Sending** - Auto-chunking and batch processing
🔄 **Smart Retry** - Exponential backoff with jitter
⚡ **Rate Limiting** - Token bucket algorithm with burst support
📊 **Queue System** - In-memory queue with concurrency control
🎯 **Type-Safe** - Full TypeScript support
📈 **Analytics Hooks** - Lifecycle event tracking
🛡️ **Production-Ready** - Comprehensive error handling
🎨 **Developer-Friendly** - Fluent API and message builder

## Installation

```bash
npm install jxpush
# or
yarn add jxpush
```

## Quick Start

### FCM Setup

1. Get your Firebase service account key from [Firebase Console](https://console.firebase.google.com/)
2. Download the JSON file or use the object directly

### Expo Setup

1. Get Expo push tokens from your Expo app (see [EXPO_SETUP.md](./EXPO_SETUP.md))
2. Optionally get an access token from [expo.dev](https://expo.dev) for higher rate limits

### Basic Usage (FCM)

```typescript
import { PushClient, ProviderType } from 'jxpush';

// Initialize client
const client = new PushClient({
  provider: ProviderType.FCM,
  fcm: {
    serviceAccountPath: './serviceAccountKey.json',
    // OR use the object directly:
    // serviceAccount: require('./serviceAccountKey.json'),
  },
});

await client.initialize();

// Send a notification
const result = await client.send({
  token: 'device-token-here',
  notification: {
    title: 'Hello!',
    body: 'Your first push notification',
  },
});

console.log(result);
```

### Basic Usage (Expo)

```typescript
import { PushClient, ProviderType } from 'jxpush';

// Initialize client
const client = new PushClient({
  provider: ProviderType.EXPO,
  expo: {
    accessToken: process.env.EXPO_ACCESS_TOKEN, // Optional
  },
});

await client.initialize();

// Send a notification
const result = await client.send({
  token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  notification: {
    title: 'Hello!',
    body: 'Your first Expo push notification',
  },
});

console.log(result);
```

## API Reference

### PushClient

#### Constructor Options

```typescript
interface PushClientConfig {
  provider: ProviderType;           // 'fcm' | 'expo'
  fcm?: FCMConfig;                  // FCM configuration
  expo?: ExpoConfig;                // Expo configuration
  queue?: QueueConfig;              // Queue settings
  rateLimit?: RateLimitConfig;      // Rate limiting settings
  retry?: RetryConfig;              // Retry settings
  hooks?: AnalyticsHooks;           // Analytics hooks
  logLevel?: LogLevel;              // 'none' | 'error' | 'warn' | 'info' | 'debug'
  defaultBatchSize?: number;        // Default: 500
}
```

#### Methods

**`initialize(): Promise<void>`**
Initialize the client. Must be called before sending messages.

**`send(message: PushMessage): Promise<SendResult>`**
Send a single push notification.

**`sendBulk(messages: PushMessage[]): Promise<BulkSendResult>`**
Send multiple notifications with auto-chunking.

**`sendToTopic(topic: string, message: PushMessage): Promise<SendResult>`**
Send to a topic (FCM only).

**`queue(message: PushMessage, priority?: number): string`**
Add message to queue for background processing.

**`message(): MessageBuilder`**
Create a new message builder.

**`getMetrics(): Metrics`**
Get current metrics.

**`getQueueStatus(): QueueStatus | null`**
Get queue status.

**`shutdown(): Promise<void>`**
Cleanup and shutdown.

### Message Builder

Fluent API for building messages:

```typescript
const message = client.message()
  .token('device-token')
  .title('Hello')
  .body('World')
  .data({ key: 'value' })
  .priority(MessagePriority.HIGH)
  .badge(5)
  .sound('default')
  .build();

await client.send(message);
```

## Advanced Usage

### Bulk Sending

```typescript
const tokens = ['token1', 'token2', 'token3', /* ... thousands more */];

const messages = tokens.map(token => ({
  token,
  notification: {
    title: 'Bulk Notification',
    body: 'Sent to multiple devices',
  },
}));

const result = await client.sendBulk(messages);
console.log(`Success: ${result.successCount}, Failed: ${result.failureCount}`);
```

### Queue with Rate Limiting

```typescript
const client = new PushClient({
  provider: ProviderType.FCM,
  fcm: { serviceAccountPath: './key.json' },
  queue: {
    enabled: true,
    concurrency: 10,        // 10 concurrent workers
    maxSize: 1000,          // Max 1000 messages in queue
  },
  rateLimit: {
    enabled: true,
    maxPerSecond: 50,       // 50 requests/second
    maxPerMinute: 2000,     // 2000 requests/minute
    allowBurst: true,
  },
});

await client.initialize();

// Queue messages (processed in background)
for (let i = 0; i < 1000; i++) {
  client.queue({
    token: `token-${i}`,
    notification: { title: 'Queued', body: 'Message' },
  });
}
```

### Analytics Hooks

```typescript
const client = new PushClient({
  provider: ProviderType.FCM,
  fcm: { serviceAccountPath: './key.json' },
  hooks: {
    onSendStart: (data) => {
      console.log(`Sending ${data.messageCount} messages`);
    },
    onSendSuccess: (data) => {
      console.log(`Success! Duration: ${data.durationMs}ms`);
    },
    onSendFailure: (data) => {
      console.error(`Failed: ${data.error.message}`);
    },
    onRetry: (data) => {
      console.log(`Retry ${data.attempt}/${data.maxAttempts}`);
    },
    onRateLimit: (data) => {
      console.log(`Rate limited, waiting ${data.waitMs}ms`);
    },
    onDrop: (data) => {
      console.error(`Dropped ${data.messageCount}: ${data.reason}`);
    },
  },
});
```

### Retry Configuration

```typescript
const client = new PushClient({
  provider: ProviderType.FCM,
  fcm: { serviceAccountPath: './key.json' },
  retry: {
    enabled: true,
    maxAttempts: 3,           // Max 3 retry attempts
    initialDelayMs: 1000,     // Start with 1s delay
    maxDelayMs: 30000,        // Max 30s delay
    backoffMultiplier: 2,     // Exponential backoff
    useJitter: true,          // Add random jitter
  },
});
```

## Configuration Reference

### FCM Config

```typescript
interface FCMConfig {
  serviceAccountPath?: string;    // Path to service account JSON
  serviceAccount?: object;        // Service account object
  projectId?: string;             // Firebase project ID (optional)
}
```

### Queue Config

```typescript
interface QueueConfig {
  concurrency?: number;     // Default: 5
  enabled?: boolean;        // Default: true
  maxSize?: number;         // Default: 0 (unlimited)
  autoStart?: boolean;      // Default: true
}
```

### Rate Limit Config

```typescript
interface RateLimitConfig {
  maxPerSecond?: number;      // Default: 100
  maxPerMinute?: number;      // Default: 3000
  enabled?: boolean;          // Default: true
  allowBurst?: boolean;       // Default: true
  burstMultiplier?: number;   // Default: 1.5
}
```

### Retry Config

```typescript
interface RetryConfig {
  maxAttempts?: number;         // Default: 3
  initialDelayMs?: number;      // Default: 1000
  maxDelayMs?: number;          // Default: 30000
  backoffMultiplier?: number;   // Default: 2
  enabled?: boolean;            // Default: true
  useJitter?: boolean;          // Default: true
}
```

## Message Types

### PushMessage

```typescript
interface PushMessage {
  token?: string | string[];        // Device token(s)
  topic?: string;                   // Topic name
  notification?: NotificationPayload;
  data?: Record<string, string>;    // Custom data
  priority?: MessagePriority;       // 'high' | 'normal' | 'low'
  ttl?: number;                     // Time to live (seconds)
  collapseKey?: string;             // Message grouping
  contentAvailable?: boolean;       // iOS silent notification
  mutableContent?: boolean;         // iOS notification extension
}
```

### NotificationPayload

```typescript
interface NotificationPayload {
  title: string;
  body: string;
  imageUrl?: string;
  icon?: string;
  sound?: string;
  badge?: number;
  clickAction?: string;
  channelId?: string;    // Android
}
```

## Error Handling

```typescript
import { PushError, ErrorCode } from 'jxpush';

try {
  await client.send(message);
} catch (error) {
  if (error instanceof PushError) {
    console.error('Error code:', error.code);
    console.error('Retryable:', error.retryable);
    console.error('Original error:', error.originalError);
  }
}
```

## Metrics

```typescript
const metrics = client.getMetrics();

console.log('Total sent:', metrics.totalSent);
console.log('Success:', metrics.totalSuccess);
console.log('Failure:', metrics.totalFailure);
console.log('Retries:', metrics.totalRetries);
console.log('Avg latency:', metrics.averageLatencyMs);
console.log('By provider:', metrics.byProvider);
```

## Examples

See the [examples](./examples) directory for complete working examples:

- [basic-fcm.ts](./examples/basic-fcm.ts) - Basic FCM usage
- [basic-expo.ts](./examples/basic-expo.ts) - Basic Expo usage
- [with-queue.ts](./examples/with-queue.ts) - Queue and rate limiting
- [with-hooks.ts](./examples/with-hooks.ts) - Analytics hooks

## Roadmap

### Phase 1 ✅
- [x] FCM provider
- [x] Expo provider
- [x] Single & bulk send
- [x] Queue system
- [x] Rate limiting
- [x] Retry with backoff
- [x] Analytics hooks
- [x] Message builder

### Phase 2 (Planned)
- [ ] Topic messaging (full support)
- [ ] Message scheduling
- [ ] Persistent queue (Redis/DB)
- [ ] Advanced metrics
- [ ] WebPush support

## License

MIT License

Copyright (c) 2026 jxngrx

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Contributing

Contributions welcome! Please open an issue or PR.

## Support

For issues and questions, please use [GitHub Issues](https://github.com/jxngrx/jxpush/issues).
