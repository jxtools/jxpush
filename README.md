# jxpush

**Production-grade unified push notification library for Node.js.**
Seamlessly support **FCM (Firebase Cloud Messaging)** and **Expo** with a single, type-safe API. Built for scale with automatic chunking, rate limiting, and smart retries.

<div align="center">

[![npm version](https://img.shields.io/npm/v/jxpush.svg?style=flat-square)](https://www.npmjs.com/package/jxpush)
[![npm downloads](https://img.shields.io/npm/dm/jxpush.svg?style=flat-square)](https://www.npmjs.com/package/jxpush)
[![TypeScript](https://img.shields.io/badge/types-included-blue.svg?style=flat-square)](https://www.npmjs.com/package/jxpush)
[![License](https://img.shields.io/npm/l/jxpush.svg?style=flat-square)](https://github.com/jxngrx/jxpush/blob/master/LICENSE)

</div>

---

## 🚀 30-Second Quick Start

### 1. Install
```bash
npm install jxpush
# or
yarn add jxpush
```

### 2. Send Your First Notification (5 Lines)
```typescript
import { PushClient, ProviderType } from 'jxpush';

const client = new PushClient({ provider: ProviderType.EXPO });
await client.initialize();

await client.send({
  token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  notification: { title: 'Hello', body: 'World' }
});
```

---

## 📦 Why jxpush?

Most push libraries are simple wrappers. **jxpush is infrastructure-in-a-box.**

| Feature | Generic Wrappers | ⚡ jxpush |
|---------|-----------------|-----------|
| **Multi-Provider** | ❌ (Single only) | ✅ **FCM + Expo** |
| **Bulk Sending** | ❌ Manual loops | ✅ **Auto-chunking** (500/batch) |
| **Rate Limiting** | ❌ You get banned | ✅ **Token Bucket** (Auto-throttles) |
| **Reliability** | ❌ Fails silently | ✅ **Smart Retries** (Exp. Backoff) |
| **Type Safety** | ⚠️ Partial | ✅ **100% Written in TypeScript** |
| **Throughput** | 🐢 Serial | 🚀 **Concurrent Queue System** |

---

## ✨ Features

- **Unified API**: Switch between FCM and Expo without changing your business logic.
- **Queue System**: built-in in-memory queue with concurrency control.
- **Smart Retry**: Automatic exponential backoff with jitter for network glitches.
- **Fluent Message Builder**: Type-safe chainable API for constructing complex messages.
- **Analytics Hooks**: Tap into lifecycle events (`onSend`, `onFailure`, `onRetry`).
- **Production Ready**: Graceful shutdowns, detailed error codes, and validation.

---

## ⚙️ Configuration Patterns

### 1. The "Serverless" Pattern (Minimal)
Perfect for Next.js API routes or AWS Lambda.

```typescript
const client = new PushClient({
  provider: ProviderType.EXPO,
  // No persistent connections to manage
});
```

### 2. The "Heavy Lifter" Pattern (Worker)
Best for background workers processing thousands of notifications.

```typescript
const client = new PushClient({
  provider: ProviderType.FCM,
  fcm: { serviceAccountPath: './service-account.json' },
  // High concurrency for throughput
  queue: { concurrency: 20, maxSize: 5000 },
  // Aggressive rate limiting protection
  rateLimit: { maxPerSecond: 100 },
  // Robust retry policy
  retry: { maxAttempts: 5, backoffMultiplier: 2 }
});
```

---

## 🔥 Advanced Examples

### Bulk Sending (Auto-Chunking)
Don't worry about provider limits. We handle the math.

```typescript
const tokens = ['token1', 'token2', /* ... 10,000 more */];

// jxpush automatically splits this into batches of 500 (FCM) or 100 (Expo)
await client.sendBulk(
  tokens.map(token => ({
    token,
    notification: { title: 'Flash Sale!', body: '50% off everything' }
  }))
);
```

### Using the Fluent Builder
Construct complex messages with confidence.

```typescript
const message = client.message()
  .token('device-token')
  .title('New Order')
  .body('Order #1234 has shipped')
  .data({ orderId: '1234', tracking: 'X999' })
  .priority('high')
  .sound('chime.aiff')
  .badge(1)
  .build();

await client.send(message);
```

### Lifecycle Hooks (Logging & Analytics)
Track every heartbeat of your notification system.

```typescript
new PushClient({
  provider: ProviderType.FCM,
  hooks: {
    onSendSuccess: (metrics) => {
      console.log(`🚀 Sent in ${metrics.durationMs}ms`);
      StatsD.increment('push.sent');
    },
    onSendFailure: (error) => {
      console.error('🔥 Failed:', error.message);
      Sentry.captureException(error);
    },
    onRateLimit: (waitMs) => {
        console.warn(`⏳ Throttled for ${waitMs}ms`);
    }
  }
});
```

---

## 🧠 Provider Setup Guides

- **[Expo Setup Guide](./EXPO_SETUP.md)** (Get tokens, access tokens)
- **[Firebase (FCM) Setup Guide](./FIREBASE_SETUP.md)** (Service account setup)

---

## License

MIT © [jxngrx](https://github.com/jxngrx)
