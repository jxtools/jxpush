# jxpush

> **Zero-bloat modular messaging engine for Node.js**
> Install only what you need. Scale from serverless to millions of messages.

<div align="center">

[![npm version](https://img.shields.io/npm/v/jxpush.svg?style=flat-square)](https://www.npmjs.com/package/jxpush)
[![npm downloads](https://img.shields.io/npm/dm/jxpush.svg?style=flat-square)](https://www.npmjs.com/package/jxpush)
[![TypeScript](https://img.shields.io/badge/types-included-blue.svg?style=flat-square)](https://www.npmjs.com/package/jxpush)
[![License](https://img.shields.io/npm/l/jxpush.svg?style=flat-square)](https://github.com/jxtools/jxpush/blob/master/LICENSE)

[Quick Start](#-30-second-quick-start) • [Documentation](#-table-of-contents) • [Examples](#-real-world-examples) • [CLI](#-cli-setup-wizard)

</div>

---

## 🎯 What is jxpush?

**jxpush** is a production-grade messaging engine that unifies push notifications, email, and message queuing under a single, type-safe API. Unlike traditional libraries that bundle everything, jxpush uses **optional peer dependencies** and **dynamic loading** to keep your `node_modules` lean.

### The Problem

```bash
# Traditional approach
npm install some-push-library
# ⏳ Installing 100MB of dependencies...
# 📦 Including Firebase, Expo, Kafka, RabbitMQ, etc.
# 😰 Even though you only use Expo
```

### The jxpush Solution

```bash
# jxpush approach
npm install jxpush
# ✅ 5MB base install

npx jxpush init
# 🎯 Select only Expo
# ✅ Installs only expo-server-sdk (~5MB)
# 🎉 Total: 10MB (90% smaller!)
```

---

## 🚀 30-Second Quick Start

### Option 1: Interactive Setup (Recommended)

```bash
npm install jxpush
npx jxpush init
```

The wizard will guide you through selecting providers, queue backends, and features. Dependencies are installed automatically, and configuration files are generated for you.

### Option 2: Manual Setup

```bash
npm install jxpush firebase-admin
```

```typescript
import { PushClient, MessageBuilder, defineConfig } from 'jxpush';

const config = defineConfig({
  provider: 'fcm',
  providers: {
    fcm: {
      serviceAccountPath: './firebase-admin.json',
    },
  },
});

const client = new PushClient(config);
await client.initialize();

const message = new MessageBuilder()
  .setTitle('Hello World')
  .setBody('Your first notification')
  .setToken('device-token-here')
  .build();

const result = await client.send(message);
console.log('Sent:', result.success);
```

---

## 📊 Why jxpush?

### Feature Comparison

| Feature | `firebase-admin` | `expo-server-sdk` | `node-pushnotifications` | **jxpush** |
|---------|------------------|-------------------|--------------------------|------------|
| **Unified API** | ❌ FCM only | ❌ Expo only | ⚠️ Inconsistent | ✅ **Single API** |
| **Install Size** | ~50MB | ~5MB | ~80MB | **~5MB base** |
| **Modular** | ❌ Monolithic | ❌ Monolithic | ❌ Monolithic | ✅ **Optional deps** |
| **TypeScript** | ✅ Full | ⚠️ Partial | ❌ None | ✅ **100% typed** |
| **Bulk Sending** | ⚠️ Manual | ⚠️ Manual | ⚠️ Basic | ✅ **Auto-chunking** |
| **Rate Limiting** | ❌ None | ❌ None | ❌ None | ✅ **Token bucket** |
| **Retry Logic** | ❌ None | ❌ None | ❌ None | ✅ **Exponential backoff** |
| **Queue System** | ❌ None | ❌ None | ❌ None | ✅ **Redis/BullMQ** |
| **Templates** | ❌ None | ❌ None | ❌ None | ✅ **Handlebars** |
| **Email Support** | ❌ None | ❌ None | ❌ None | ✅ **Resend/SMTP** |
| **CLI Wizard** | ❌ None | ❌ None | ❌ None | ✅ **Interactive** |

### Architecture Philosophy

```
┌─────────────────────────────────────────────────────────┐
│                     jxpush Core                         │
│                    (~5MB, 4 deps)                       │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Providers  │  │   Adapters   │  │   Features   │
│  (optional)  │  │  (optional)  │  │  (optional)  │
├──────────────┤  ├──────────────┤  ├──────────────┤
│ • FCM        │  │ • Redis      │  │ • Templates  │
│ • Expo       │  │ • BullMQ     │  │ • i18n       │
│ • WebPush    │  │ • Kafka      │  │ • Email      │
│ • Email      │  │ • RabbitMQ   │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
     Dynamic           Dynamic           Dynamic
     Loading           Loading           Loading
```

**Key Principles:**
- **Zero Bloat**: Install only what you use
- **Dynamic Loading**: Providers loaded on-demand
- **Type Safety**: 100% TypeScript with strict types
- **Production Ready**: Battle-tested retry, rate limiting, queuing

---

## 📚 Table of Contents

- [Installation](#-installation)
- [CLI Setup Wizard](#-cli-setup-wizard)
- [Core Concepts](#-core-concepts)
- [Provider Configuration](#-provider-configuration)
  - [FCM (Firebase)](#fcm-firebase-cloud-messaging)
  - [Expo](#expo-push-notifications)
  - [Web Push](#web-push-vapid)
  - [Email (Resend/SMTP)](#email-resendsmtp)
- [Queue Adapters](#-queue-adapters)
- [Message Building](#-message-building)
- [Bulk Sending](#-bulk-sending)
- [Rate Limiting & Retry](#-rate-limiting--retry)
- [Templates & Localization](#-templates--localization)
- [Analytics & Hooks](#-analytics--hooks)
- [Configuration Reference](#-configuration-reference)
- [CLI Commands](#-cli-commands)
- [Real-World Examples](#-real-world-examples)
- [Production Scaling](#-production-scaling)
- [Security Best Practices](#-security-best-practices)
- [Error Handling](#-error-handling)
- [Troubleshooting](#-troubleshooting)
- [Plugin Development](#-plugin-development)
- [Migration Guide](#-migration-guide)
- [FAQ](#-faq)
- [Roadmap](#-roadmap)

---

## 📦 Installation

### Prerequisites

- **Node.js**: >= 20.0.0
- **Package Manager**: npm, yarn, or pnpm

### Base Installation

```bash
# npm
npm install jxpush

# yarn
yarn add jxpush

# pnpm
pnpm add jxpush
```

This installs the **core package only** (~5MB, 4 dependencies).

### Provider Dependencies

Install providers based on your needs:

```bash
# FCM (Firebase Cloud Messaging)
npm install firebase-admin

# Expo Push Notifications
npm install expo-server-sdk

# Web Push (VAPID)
npm install web-push

# Email via Resend
npm install resend

# Email via SMTP
npm install nodemailer

# Templates (Handlebars)
npm install handlebars
```

### Queue Adapter Dependencies

```bash
# Redis Queue
npm install ioredis

# BullMQ (Redis-based)
npm install bullmq

# Kafka
npm install kafkajs

# RabbitMQ
npm install amqplib
```

---

## 🧙 CLI Setup Wizard

The **interactive setup wizard** is the easiest way to configure jxpush.

### Running the Wizard

```bash
npx jxpush init
```

### Wizard Flow

```
🚀 Welcome to jxpush Setup Wizard

? Select your project language:
  ❯ TypeScript
    JavaScript

? Select push notification providers: (Space to select, Enter to confirm)
  ◉ FCM (Firebase Cloud Messaging)
  ◯ Expo Push Notifications
  ◯ Web Push (VAPID)

? Select queue backend:
  ❯ In-Memory (no dependencies)
    Redis
    BullMQ

? Select optional features:
  ◉ Template Engine (Handlebars)
  ◯ Localization (i18n)
  ◯ Email Support (Resend/SMTP)

📦 Installing dependencies...
  ✓ firebase-admin@12.0.0
  ✓ handlebars@4.7.8

📝 Generating configuration files...
  ✓ jxpush.config.ts
  ✓ src/push/providers.ts
  ✓ examples/send-notification.ts

✅ Setup complete! Run: npm run example
```

### Generated Files

The wizard creates:

1. **`jxpush.config.ts`** - Main configuration file
2. **`src/push/providers.ts`** - Provider initialization
3. **`src/push/queue.ts`** - Queue setup (if selected)
4. **`examples/send-notification.ts`** - Working example

---

## 🧠 Core Concepts

### 1. PushClient

The main entry point for sending messages.

```typescript
import { PushClient } from 'jxpush';

const client = new PushClient(config);
await client.initialize();

// Send a message
await client.send(message);

// Cleanup
await client.shutdown();
```

### 2. Message Builder

Fluent API for constructing messages.

```typescript
import { MessageBuilder } from 'jxpush';

const message = new MessageBuilder()
  .setTitle('Order Shipped')
  .setBody('Your order #1234 is on the way')
  .setToken('device-token')
  .setData({ orderId: '1234' })
  .setPriority('high')
  .build();
```

### 3. Provider Registry

Dynamic provider loading system.

```typescript
import { ProviderRegistry, ProviderType } from 'jxpush';

// Check if provider is available
const hasExpo = await ProviderRegistry.isAvailable(ProviderType.EXPO);

// Get provider instance
const provider = await ProviderRegistry.getProvider(
  ProviderType.FCM,
  config
);
```

### 4. Configuration

Type-safe configuration using `defineConfig`.

```typescript
import { defineConfig } from 'jxpush';

export default defineConfig({
  provider: 'fcm',
  providers: {
    fcm: { /* ... */ },
  },
  queue: { /* ... */ },
  rateLimit: { /* ... */ },
  retry: { /* ... */ },
});
```

---

## 🔥 Provider Configuration

### FCM (Firebase Cloud Messaging)

**Use Case**: Android, iOS, and Web push notifications via Firebase.

#### Setup

1. **Get Service Account**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Project Settings → Service Accounts
   - Generate New Private Key
   - Save as `firebase-admin.json`

2. **Install Dependency**:
   ```bash
   npm install firebase-admin
   ```

3. **Configure**:
   ```typescript
   import { defineConfig } from 'jxpush';

   export default defineConfig({
     provider: 'fcm',
     providers: {
       fcm: {
         serviceAccountPath: './firebase-admin.json',
         // OR use service account object
         serviceAccount: {
           projectId: 'your-project-id',
           clientEmail: 'firebase-adminsdk@your-project.iam.gserviceaccount.com',
           privateKey: '-----BEGIN PRIVATE KEY-----\n...',
         },
       },
     },
   });
   ```

#### FCM Example

```typescript
import { PushClient, MessageBuilder } from 'jxpush';
import config from './jxpush.config';

const client = new PushClient(config);
await client.initialize();

const message = new MessageBuilder()
  .setTitle('New Message')
  .setBody('You have a new notification')
  .setToken('fcm-device-token')
  .setData({ userId: '123', action: 'view' })
  .setPriority('high')
  .setSound('default')
  .setBadge(1)
  .build();

const result = await client.send(message);
```

#### FCM-Specific Features

```typescript
// Topic messaging
await client.sendToTopic('news', message);

// Condition-based messaging
const message = new MessageBuilder()
  .setTitle('Breaking News')
  .setCondition("'news' in topics && 'sports' in topics")
  .build();

// Platform-specific options
const message = new MessageBuilder()
  .setTitle('Custom Notification')
  .setAndroidConfig({
    priority: 'high',
    notification: {
      channelId: 'important',
      icon: 'notification_icon',
      color: '#FF0000',
    },
  })
  .setApnsConfig({
    payload: {
      aps: {
        sound: 'chime.aiff',
        badge: 1,
      },
    },
  })
  .build();
```

---

### Expo Push Notifications

**Use Case**: React Native apps using Expo.

#### Setup

1. **Get Access Token** (optional):
   - Go to [Expo Dashboard](https://expo.dev/)
   - Account Settings → Access Tokens
   - Create token

2. **Install Dependency**:
   ```bash
   npm install expo-server-sdk
   ```

3. **Configure**:
   ```typescript
   import { defineConfig } from 'jxpush';

   export default defineConfig({
     provider: 'expo',
     providers: {
       expo: {
         accessToken: process.env.EXPO_ACCESS_TOKEN, // Optional
       },
     },
   });
   ```

#### Expo Example

```typescript
const message = new MessageBuilder()
  .setTitle('Welcome!')
  .setBody('Thanks for installing our app')
  .setToken('ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]')
  .setData({ screen: 'home', userId: '123' })
  .setSound('default')
  .setBadge(1)
  .setPriority('high')
  .build();

await client.send(message);
```

#### Getting Expo Push Tokens

In your React Native app:

```javascript
import * as Notifications from 'expo-notifications';

async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    return;
  }

  const token = await Notifications.getExpoPushTokenAsync();
  console.log('Expo Push Token:', token.data);
  // Send this token to your backend
}
```

---

### Web Push (VAPID)

**Use Case**: Browser push notifications (Chrome, Firefox, Edge, Safari).

#### Setup

1. **Generate VAPID Keys**:
   ```bash
   npx web-push generate-vapid-keys
   ```

2. **Install Dependency**:
   ```bash
   npm install web-push
   ```

3. **Configure**:
   ```typescript
   import { defineConfig } from 'jxpush';

   export default defineConfig({
     provider: 'webpush',
     providers: {
       webpush: {
         vapidDetails: {
           subject: 'mailto:your-email@example.com',
           publicKey: 'BNg...',
           privateKey: 'abc...',
         },
       },
     },
   });
   ```

#### Web Push Example

```typescript
// Subscription object from browser
const subscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/...',
  keys: {
    p256dh: '...',
    auth: '...',
  },
};

const message = new MessageBuilder()
  .setTitle('New Article')
  .setBody('Check out our latest post')
  .setToken(JSON.stringify(subscription))
  .setData({ url: '/articles/123' })
  .setIcon('/icon.png')
  .build();

await client.send(message);
```

#### Client-Side Setup

```javascript
// In your web app
if ('serviceWorker' in navigator && 'PushManager' in window) {
  const registration = await navigator.serviceWorker.register('/sw.js');

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: 'YOUR_PUBLIC_VAPID_KEY',
  });

  // Send subscription to your backend
  await fetch('/api/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
  });
}
```

---

### Email (Resend/SMTP)

**Use Case**: Transactional emails alongside push notifications.

#### Resend Setup

```bash
npm install resend
```

```typescript
import { defineConfig } from 'jxpush';

export default defineConfig({
  provider: 'email',
  providers: {
    email: {
      adapter: 'resend',
      resend: {
        apiKey: process.env.RESEND_API_KEY,
        from: 'notifications@yourdomain.com',
      },
    },
  },
});
```

#### SMTP Setup

```bash
npm install nodemailer
```

```typescript
import { defineConfig } from 'jxpush';

export default defineConfig({
  provider: 'email',
  providers: {
    email: {
      adapter: 'smtp',
      smtp: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        from: 'notifications@yourdomain.com',
      },
    },
  },
});
```

#### Email Example

```typescript
const message = {
  to: 'user@example.com',
  subject: 'Order Confirmation',
  html: '<h1>Thank you for your order!</h1>',
  text: 'Thank you for your order!',
};

await client.send(message);
```

---

## 🔄 Queue Adapters

Queue adapters enable asynchronous message processing, retry logic, and horizontal scaling.

### In-Memory Queue

**Use Case**: Development, serverless, low-volume.

```typescript
import { defineConfig } from 'jxpush';

export default defineConfig({
  provider: 'fcm',
  queue: {
    adapter: 'memory',
    concurrency: 10,
    maxSize: 1000,
  },
});
```

**Pros**: Zero dependencies, simple
**Cons**: Not persistent, single-process only

---

### Redis Queue

**Use Case**: Production, distributed systems.

```bash
npm install ioredis
```

```typescript
import { defineConfig } from 'jxpush';

export default defineConfig({
  provider: 'fcm',
  queue: {
    adapter: 'redis',
    redis: {
      host: 'localhost',
      port: 6379,
      password: process.env.REDIS_PASSWORD,
      db: 0,
      keyPrefix: 'jxpush:',
    },
    concurrency: 50,
  },
});
```

**Features**:
- Persistent queue
- Multi-process support
- Atomic operations
- TTL support

---

### BullMQ

**Use Case**: Advanced job processing, scheduled messages.

```bash
npm install bullmq
```

```typescript
import { defineConfig } from 'jxpush';

export default defineConfig({
  provider: 'fcm',
  queue: {
    adapter: 'bullmq',
    bullmq: {
      connection: {
        host: 'localhost',
        port: 6379,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    },
    concurrency: 100,
  },
});
```

**Features**:
- Advanced retry strategies
- Delayed/scheduled jobs
- Job prioritization
- Rate limiting
- Job events and monitoring

---

### Kafka

**Use Case**: Event-driven architecture, high throughput.

```bash
npm install kafkajs
```

```typescript
import { defineConfig } from 'jxpush';

export default defineConfig({
  provider: 'fcm',
  queue: {
    adapter: 'kafka',
    kafka: {
      clientId: 'jxpush',
      brokers: ['localhost:9092'],
      topic: 'push-notifications',
      ssl: true,
      sasl: {
        mechanism: 'plain',
        username: process.env.KAFKA_USERNAME,
        password: process.env.KAFKA_PASSWORD,
      },
    },
  },
});
```

---

### RabbitMQ

**Use Case**: Complex routing, message patterns.

```bash
npm install amqplib
```

```typescript
import { defineConfig } from 'jxpush';

export default defineConfig({
  provider: 'fcm',
  queue: {
    adapter: 'rabbitmq',
    rabbitmq: {
      url: 'amqp://localhost',
      queue: 'push-notifications',
      exchange: 'notifications',
      routingKey: 'push',
    },
  },
});
```

---

## 🏗️ Message Building

### Basic Message

```typescript
import { MessageBuilder } from 'jxpush';

const message = new MessageBuilder()
  .setTitle('Hello')
  .setBody('World')
  .setToken('device-token')
  .build();
```

### Complete Message

```typescript
const message = new MessageBuilder()
  // Required
  .setToken('device-token')

  // Notification
  .setTitle('Order Shipped')
  .setBody('Your order #1234 is on the way')
  .setImage('https://example.com/image.jpg')
  .setIcon('notification_icon')

  // Data payload
  .setData({
    orderId: '1234',
    tracking: 'X999',
    screen: 'order-details',
  })

  // Behavior
  .setPriority('high')
  .setSound('chime.aiff')
  .setBadge(5)
  .setTTL(86400) // 24 hours
  .setCollapseKey('order-updates')

  // iOS-specific
  .setContentAvailable(true)
  .setMutableContent(true)

  .build();
```

### Multiple Tokens

```typescript
const message = new MessageBuilder()
  .setTitle('Flash Sale')
  .setBody('50% off everything!')
  .setToken(['token1', 'token2', 'token3'])
  .build();

await client.send(message);
```

### Topic Messaging

```typescript
const message = new MessageBuilder()
  .setTitle('Breaking News')
  .setBody('Major announcement')
  .setTopic('news')
  .build();

await client.sendToTopic('news', message);
```

---

## 📤 Bulk Sending

jxpush automatically handles batching and chunking based on provider limits.

### Simple Bulk Send

```typescript
const tokens = ['token1', 'token2', /* ... 10,000 more */];

const messages = tokens.map(token =>
  new MessageBuilder()
    .setTitle('Flash Sale')
    .setBody('50% off everything!')
    .setToken(token)
    .build()
);

const result = await client.sendBulk(messages);

console.log(`Sent: ${result.successCount}/${result.total}`);
console.log(`Failed: ${result.failureCount}`);
```

### Bulk with Custom Data

```typescript
const users = [
  { token: 'token1', name: 'Alice', orderId: '123' },
  { token: 'token2', name: 'Bob', orderId: '456' },
  // ... thousands more
];

const messages = users.map(user =>
  new MessageBuilder()
    .setTitle(`Hi ${user.name}!`)
    .setBody(`Your order ${user.orderId} shipped`)
    .setToken(user.token)
    .setData({ orderId: user.orderId })
    .build()
);

await client.sendBulk(messages);
```

### Bulk Send Results

```typescript
const result = await client.sendBulk(messages);

// Overall stats
console.log('Total:', result.total);
console.log('Success:', result.successCount);
console.log('Failed:', result.failureCount);
console.log('Duration:', result.durationMs, 'ms');

// Individual results
result.results.forEach((res, index) => {
  if (!res.success) {
    console.error(`Failed for token ${messages[index].token}:`, res.error);
  }
});
```

### Automatic Chunking

jxpush automatically chunks messages based on provider limits:

- **FCM**: 500 tokens per batch
- **Expo**: 100 tokens per batch
- **Web Push**: 1 per request (parallelized)

You don't need to worry about this—just send your array!

---

## ⚡ Rate Limiting & Retry

### Rate Limiting

Protect against API throttling with token bucket algorithm.

```typescript
import { defineConfig } from 'jxpush';

export default defineConfig({
  provider: 'fcm',
  rateLimit: {
    maxPerSecond: 100,      // Max 100 requests/second
    maxBurst: 200,          // Allow bursts up to 200
    enabled: true,
  },
});
```

**How it works**:
- Tokens replenish at `maxPerSecond` rate
- Burst capacity allows temporary spikes
- Requests wait if bucket is empty

### Retry Configuration

Automatic exponential backoff with jitter.

```typescript
import { defineConfig } from 'jxpush';

export default defineConfig({
  provider: 'fcm',
  retry: {
    maxAttempts: 5,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    jitter: true,
  },
});
```

**Retry Schedule Example**:
```
Attempt 1: Immediate
Attempt 2: 1s + jitter
Attempt 3: 2s + jitter
Attempt 4: 4s + jitter
Attempt 5: 8s + jitter
```

### Retry Hooks

```typescript
import { defineConfig } from 'jxpush';

export default defineConfig({
  provider: 'fcm',
  hooks: {
    onRetry: (attempt, error, delayMs) => {
      console.log(`Retry attempt ${attempt} after ${delayMs}ms`);
      console.log('Error:', error.message);
    },
  },
});
```

---

## 📝 Templates & Localization

### Template Engine

Use Handlebars templates for dynamic content.

#### Setup

```bash
npm install handlebars
```

```typescript
import { TemplateEngine } from 'jxpush';

const engine = new TemplateEngine({
  cacheTemplates: true,
  defaultLocale: 'en',
});

// Register template
engine.registerTemplate({
  id: 'order-shipped',
  locale: 'en',
  content: 'Hi {{name}}, your order {{orderId}} has shipped!',
});

// Render
const message = engine.render('order-shipped', {
  name: 'Alice',
  orderId: '1234',
});

console.log(message); // "Hi Alice, your order 1234 has shipped!"
```

#### Template Files

```typescript
import { TemplateLoader } from 'jxpush';

const loader = new TemplateLoader('./templates');
await loader.loadTemplates(engine);
```

**File structure**:
```
templates/
  order-shipped.en.hbs
  order-shipped.es.hbs
  welcome.en.hbs
  welcome.es.hbs
```

### Localization

```typescript
import { LocalizationEngine } from 'jxpush';

const i18n = new LocalizationEngine({
  defaultLocale: 'en',
  fallbackLocale: 'en',
});

// Register translations
i18n.registerLocale('en', {
  'order.shipped': 'Your order has shipped',
  'order.delivered': 'Your order was delivered',
});

i18n.registerLocale('es', {
  'order.shipped': 'Tu pedido ha sido enviado',
  'order.delivered': 'Tu pedido fue entregado',
});

// Translate
const message = i18n.translate('order.shipped', 'es');
console.log(message); // "Tu pedido ha sido enviado"
```

#### With Variables

```typescript
i18n.registerLocale('en', {
  'greeting': 'Hello {{name}}!',
});

const message = i18n.translate('greeting', 'en', { name: 'Alice' });
console.log(message); // "Hello Alice!"
```

---

## 📊 Analytics & Hooks

Track every aspect of your messaging pipeline.

### Available Hooks

```typescript
import { defineConfig } from 'jxpush';

export default defineConfig({
  provider: 'fcm',
  hooks: {
    // Before sending
    onBeforeSend: (message) => {
      console.log('Sending to:', message.token);
    },

    // After successful send
    onSendSuccess: (result, metrics) => {
      console.log('✅ Sent in', metrics.durationMs, 'ms');
      // Send to analytics
      analytics.track('push_sent', {
        provider: result.provider,
        duration: metrics.durationMs,
      });
    },

    // After failed send
    onSendFailure: (error, message) => {
      console.error('❌ Failed:', error.message);
      // Send to error tracking
      Sentry.captureException(error, {
        extra: { token: message.token },
      });
    },

    // On retry
    onRetry: (attempt, error, delayMs) => {
      console.log(`🔄 Retry ${attempt} in ${delayMs}ms`);
    },

    // On rate limit
    onRateLimit: (waitMs) => {
      console.log(`⏳ Rate limited, waiting ${waitMs}ms`);
    },

    // On queue events
    onQueueAdd: (job) => {
      console.log('📥 Job added:', job.id);
    },

    onQueueProcess: (job) => {
      console.log('⚙️ Processing:', job.id);
    },

    onQueueComplete: (job, result) => {
      console.log('✅ Completed:', job.id);
    },

    onQueueFailed: (job, error) => {
      console.error('❌ Job failed:', job.id, error);
    },
  },
});
```

### Metrics Collection

```typescript
import { Metrics } from 'jxpush';

const metrics = new Metrics();

// Track sends
metrics.recordSend('fcm', true, 150); // provider, success, durationMs

// Get stats
const stats = metrics.getStats('fcm');
console.log('Total sent:', stats.totalSent);
console.log('Success rate:', stats.successRate);
console.log('Avg duration:', stats.avgDurationMs);
```

---

## ⚙️ Configuration Reference

### Complete Configuration

```typescript
import { defineConfig, LogLevel } from 'jxpush';

export default defineConfig({
  // Provider selection (required)
  provider: 'fcm', // 'fcm' | 'expo' | 'webpush' | 'email'

  // Provider configurations
  providers: {
    fcm: {
      serviceAccountPath: './firebase-admin.json',
      // OR
      serviceAccount: {
        projectId: 'your-project',
        clientEmail: 'firebase-adminsdk@...',
        privateKey: '-----BEGIN PRIVATE KEY-----\n...',
      },
    },
    expo: {
      accessToken: process.env.EXPO_ACCESS_TOKEN, // Optional
    },
    webpush: {
      vapidDetails: {
        subject: 'mailto:your-email@example.com',
        publicKey: 'BNg...',
        privateKey: 'abc...',
      },
    },
    email: {
      adapter: 'resend', // 'resend' | 'smtp'
      resend: {
        apiKey: process.env.RESEND_API_KEY,
        from: 'notifications@yourdomain.com',
      },
      smtp: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        from: 'notifications@yourdomain.com',
      },
    },
  },

  // Queue configuration
  queue: {
    adapter: 'redis', // 'memory' | 'redis' | 'bullmq' | 'kafka' | 'rabbitmq'
    concurrency: 50,
    maxSize: 10000,

    // Adapter-specific config
    redis: {
      host: 'localhost',
      port: 6379,
      password: process.env.REDIS_PASSWORD,
      db: 0,
      keyPrefix: 'jxpush:',
    },
    bullmq: {
      connection: {
        host: 'localhost',
        port: 6379,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    },
    kafka: {
      clientId: 'jxpush',
      brokers: ['localhost:9092'],
      topic: 'push-notifications',
    },
    rabbitmq: {
      url: 'amqp://localhost',
      queue: 'push-notifications',
    },
  },

  // Rate limiting
  rateLimit: {
    enabled: true,
    maxPerSecond: 100,
    maxBurst: 200,
  },

  // Retry configuration
  retry: {
    maxAttempts: 5,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    jitter: true,
  },

  // Logging
  logLevel: LogLevel.INFO, // NONE | ERROR | WARN | INFO | DEBUG

  // Analytics hooks
  hooks: {
    onBeforeSend: (message) => {},
    onSendSuccess: (result, metrics) => {},
    onSendFailure: (error, message) => {},
    onRetry: (attempt, error, delayMs) => {},
    onRateLimit: (waitMs) => {},
    onQueueAdd: (job) => {},
    onQueueProcess: (job) => {},
    onQueueComplete: (job, result) => {},
    onQueueFailed: (job, error) => {},
  },
});
```

---

## 🖥️ CLI Commands

### `npx jxpush init`

Interactive setup wizard.

```bash
npx jxpush init
```

### `npx jxpush send`

Send a single notification.

```bash
npx jxpush send \
  --provider fcm \
  --token "device-token" \
  --title "Hello" \
  --body "World" \
  --data '{"key":"value"}' \
  --priority high
```

**Options**:
- `-p, --provider <provider>` - Provider (fcm, expo, webpush)
- `-t, --token <token>` - Device token
- `--title <title>` - Notification title
- `--body <body>` - Notification body
- `--data <json>` - Data payload (JSON string)
- `--priority <priority>` - Priority (high, normal, low)
- `--ttl <seconds>` - Time to live
- `--badge <number>` - Badge count
- `--sound <sound>` - Sound file
- `-c, --config <path>` - Config file path

### `npx jxpush bulk`

Send bulk notifications from file.

```bash
npx jxpush bulk \
  --provider expo \
  --file messages.json
```

**messages.json**:
```json
[
  {
    "token": "ExponentPushToken[xxx]",
    "title": "Hello Alice",
    "body": "Welcome!"
  },
  {
    "token": "ExponentPushToken[yyy]",
    "title": "Hello Bob",
    "body": "Welcome!"
  }
]
```

### CLI Command Reference

| Command | Description | Example |
|---------|-------------|---------|
| `init` | Interactive setup wizard | `npx jxpush init` |
| `send` | Send single notification | `npx jxpush send -p fcm -t token --title "Hi"` |
| `bulk` | Send bulk from file | `npx jxpush bulk -p expo -f messages.json` |
| `--version` | Show version | `npx jxpush --version` |
| `--help` | Show help | `npx jxpush --help` |

---

## 🌍 Real-World Examples

### Example 1: E-commerce Order Updates

```typescript
import { PushClient, MessageBuilder, defineConfig } from 'jxpush';

const config = defineConfig({
  provider: 'fcm',
  providers: {
    fcm: { serviceAccountPath: './firebase.json' },
  },
  queue: {
    adapter: 'bullmq',
    bullmq: { connection: { host: 'localhost', port: 6379 } },
  },
});

const client = new PushClient(config);
await client.initialize();

// Order shipped notification
async function notifyOrderShipped(userId: string, orderId: string) {
  const user = await db.users.findById(userId);

  const message = new MessageBuilder()
    .setTitle('Order Shipped! 📦')
    .setBody(`Your order #${orderId} is on the way`)
    .setToken(user.pushToken)
    .setData({
      orderId,
      screen: 'order-details',
      action: 'track',
    })
    .setPriority('high')
    .setSound('chime.aiff')
    .build();

  await client.send(message);
}
```

### Example 2: Multi-Platform Chat App

```typescript
import { PushClient, MessageBuilder, defineConfig } from 'jxpush';

const config = defineConfig({
  provider: 'fcm',
  providers: {
    fcm: { serviceAccountPath: './firebase.json' },
  },
  rateLimit: { maxPerSecond: 500 },
  retry: { maxAttempts: 3 },
});

const client = new PushClient(config);
await client.initialize();

async function sendChatMessage(
  recipientTokens: string[],
  senderName: string,
  messageText: string
) {
  const messages = recipientTokens.map(token =>
    new MessageBuilder()
      .setTitle(`${senderName} sent a message`)
      .setBody(messageText)
      .setToken(token)
      .setData({
        type: 'chat',
        sender: senderName,
        timestamp: Date.now(),
      })
      .setPriority('high')
      .setSound('message.mp3')
      .build()
  );

  const result = await client.sendBulk(messages);
  console.log(`Delivered to ${result.successCount}/${result.total} users`);
}
```

### Example 3: News App with Topics

```typescript
import { PushClient, MessageBuilder, defineConfig } from 'jxpush';

const config = defineConfig({
  provider: 'fcm',
  providers: {
    fcm: { serviceAccountPath: './firebase.json' },
  },
});

const client = new PushClient(config);
await client.initialize();

async function sendBreakingNews(article: Article) {
  const message = new MessageBuilder()
    .setTitle('🚨 Breaking News')
    .setBody(article.headline)
    .setImage(article.imageUrl)
    .setTopic('breaking-news')
    .setData({
      articleId: article.id,
      category: article.category,
    })
    .setPriority('high')
    .build();

  await client.sendToTopic('breaking-news', message);
}
```

### Example 4: Scheduled Reminders

```typescript
import { PushClient, MessageBuilder, defineConfig } from 'jxpush';

const config = defineConfig({
  provider: 'expo',
  providers: {
    expo: { accessToken: process.env.EXPO_ACCESS_TOKEN },
  },
  queue: {
    adapter: 'bullmq',
    bullmq: {
      connection: { host: 'localhost', port: 6379 },
      defaultJobOptions: {
        delay: 0, // Set per job
      },
    },
  },
});

const client = new PushClient(config);
await client.initialize();

async function scheduleReminder(
  token: string,
  reminderText: string,
  sendAt: Date
) {
  const delayMs = sendAt.getTime() - Date.now();

  const message = new MessageBuilder()
    .setTitle('Reminder')
    .setBody(reminderText)
    .setToken(token)
    .setData({ type: 'reminder' })
    .build();

  // Queue with delay
  await client.send(message, { delay: delayMs });
}
```

### Example 5: Localized Notifications

```typescript
import { PushClient, MessageBuilder, TemplateEngine, defineConfig } from 'jxpush';

const config = defineConfig({
  provider: 'fcm',
  providers: {
    fcm: { serviceAccountPath: './firebase.json' },
  },
});

const client = new PushClient(config);
await client.initialize();

const templates = new TemplateEngine({ defaultLocale: 'en' });

templates.registerTemplate({
  id: 'welcome',
  locale: 'en',
  content: 'Welcome {{name}}! Thanks for joining.',
});

templates.registerTemplate({
  id: 'welcome',
  locale: 'es',
  content: '¡Bienvenido {{name}}! Gracias por unirte.',
});

async function sendWelcome(user: User) {
  const body = templates.render('welcome', { name: user.name }, user.locale);

  const message = new MessageBuilder()
    .setTitle(user.locale === 'es' ? 'Bienvenido' : 'Welcome')
    .setBody(body)
    .setToken(user.pushToken)
    .build();

  await client.send(message);
}
```

---

## 🚀 Production Scaling

### Horizontal Scaling

Use queue adapters for multi-instance deployments.

```typescript
// Worker 1, 2, 3... all connect to same Redis
const config = defineConfig({
  provider: 'fcm',
  queue: {
    adapter: 'bullmq',
    bullmq: {
      connection: {
        host: process.env.REDIS_HOST,
        port: 6379,
      },
    },
    concurrency: 100, // Per worker
  },
});
```

**Architecture**:
```
┌─────────┐    ┌─────────┐    ┌─────────┐
│ Worker 1│    │ Worker 2│    │ Worker 3│
└────┬────┘    └────┬────┘    └────┬────┘
     │              │              │
     └──────────────┼──────────────┘
                    │
              ┌─────▼─────┐
              │   Redis   │
              │   Queue   │
              └───────────┘
```

### Performance Tuning

```typescript
const config = defineConfig({
  provider: 'fcm',

  // High throughput
  queue: {
    adapter: 'bullmq',
    concurrency: 200, // Process 200 jobs concurrently
  },

  // Aggressive rate limiting
  rateLimit: {
    maxPerSecond: 500,
    maxBurst: 1000,
  },

  // Fast retries
  retry: {
    maxAttempts: 3,
    initialDelayMs: 500,
    backoffMultiplier: 1.5,
  },

  // Minimal logging
  logLevel: LogLevel.ERROR,
});
```

### Monitoring

```typescript
import { defineConfig } from 'jxpush';
import StatsD from 'node-statsd';

const statsd = new StatsD();

const config = defineConfig({
  provider: 'fcm',
  hooks: {
    onSendSuccess: (result, metrics) => {
      statsd.increment('push.sent');
      statsd.timing('push.duration', metrics.durationMs);
    },
    onSendFailure: (error) => {
      statsd.increment('push.failed');
    },
    onQueueAdd: () => {
      statsd.increment('queue.added');
    },
  },
});
```

### Load Testing

```typescript
// Generate 100,000 test messages
const tokens = Array.from({ length: 100000 }, (_, i) => `test-token-${i}`);

const messages = tokens.map(token =>
  new MessageBuilder()
    .setTitle('Load Test')
    .setBody('Testing throughput')
    .setToken(token)
    .build()
);

console.time('bulk-send');
const result = await client.sendBulk(messages);
console.timeEnd('bulk-send');

console.log(`Throughput: ${result.total / (result.durationMs / 1000)} msg/sec`);
```

---

## 🔒 Security Best Practices

### 1. Environment Variables

Never commit credentials.

```typescript
// ✅ Good
const config = defineConfig({
  provider: 'fcm',
  providers: {
    fcm: {
      serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    },
  },
});

// ❌ Bad
const config = defineConfig({
  provider: 'fcm',
  providers: {
    fcm: {
      serviceAccount: {
        privateKey: '-----BEGIN PRIVATE KEY-----\n...',
      },
    },
  },
});
```

### 2. Token Validation

Validate tokens before sending.

```typescript
import { validateFCMToken } from 'jxpush';

const token = req.body.pushToken;

if (!validateFCMToken(token)) {
  throw new Error('Invalid FCM token');
}

await client.send(message);
```

### 3. Rate Limiting

Protect against abuse.

```typescript
const config = defineConfig({
  provider: 'fcm',
  rateLimit: {
    enabled: true,
    maxPerSecond: 100,
  },
});
```

### 4. Input Sanitization

Sanitize user input in messages.

```typescript
import { escapeHtml } from 'escape-html';

const message = new MessageBuilder()
  .setTitle(escapeHtml(userInput.title))
  .setBody(escapeHtml(userInput.body))
  .build();
```

### 5. Secure Queue Connections

Use TLS for queue connections.

```typescript
const config = defineConfig({
  queue: {
    adapter: 'redis',
    redis: {
      host: process.env.REDIS_HOST,
      port: 6380,
      password: process.env.REDIS_PASSWORD,
      tls: {
        rejectUnauthorized: true,
      },
    },
  },
});
```

---

## ❌ Error Handling

### Error Types

```typescript
import { PushError, ValidationError, ProviderError } from 'jxpush';

try {
  await client.send(message);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid message:', error.errors);
  } else if (error instanceof ProviderError) {
    console.error('Provider error:', error.provider, error.code);
  } else if (error instanceof PushError) {
    console.error('Push error:', error.code);
  }
}
```

### Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `INVALID_CONFIG` | Invalid configuration | Check config file |
| `INVALID_MESSAGE` | Invalid message format | Validate message |
| `INVALID_TOKEN` | Invalid device token | Remove token |
| `PROVIDER_INIT_FAILED` | Provider initialization failed | Check credentials |
| `SEND_FAILED` | Send operation failed | Retry or log |
| `RATE_LIMIT_EXCEEDED` | Rate limit hit | Wait and retry |
| `QUEUE_FULL` | Queue is full | Increase queue size |

### Graceful Error Handling

```typescript
const result = await client.send(message);

if (!result.success) {
  if (result.error?.code === 'INVALID_TOKEN') {
    // Remove invalid token from database
    await db.users.update(userId, { pushToken: null });
  } else if (result.error?.code === 'RATE_LIMIT_EXCEEDED') {
    // Queue for later
    await queue.add('retry-send', { message }, { delay: 60000 });
  } else {
    // Log and alert
    logger.error('Send failed', result.error);
    Sentry.captureException(result.error);
  }
}
```

---

## 🔧 Troubleshooting

### "Provider not registered" Error

**Error**:
```
Error: Provider "fcm" not registered. Did you install the required peer dependency?
```

**Solution**:
```bash
npm install firebase-admin
```

### "Failed to load provider" Error

**Error**:
```
Error: Failed to load provider "expo". Make sure the peer dependency is installed
```

**Solution**:
```bash
# Check if installed
npm list expo-server-sdk

# Reinstall if needed
npm install expo-server-sdk
```

### "Client not initialized" Error

**Error**:
```
Error: Client not initialized. Call initialize() first.
```

**Solution**:
```typescript
const client = new PushClient(config);
await client.initialize(); // Don't forget this!
await client.send(message);
```

### FCM "Invalid service account" Error

**Solution**:
1. Verify `firebase-admin.json` path is correct
2. Check file permissions
3. Validate JSON format
4. Ensure service account has correct permissions

### Expo "Invalid token" Error

**Solution**:
- Expo tokens must start with `ExponentPushToken[`
- Verify token is from a real device (not simulator)
- Check token hasn't expired

### Queue Connection Issues

**Redis connection failed**:
```typescript
// Add connection error handling
const config = defineConfig({
  queue: {
    adapter: 'redis',
    redis: {
      host: 'localhost',
      port: 6379,
      retryStrategy: (times) => {
        return Math.min(times * 50, 2000);
      },
    },
  },
});
```

### Memory Issues

**High memory usage**:
- Reduce queue `maxSize`
- Lower `concurrency`
- Disable template caching
- Use streaming for bulk sends

---

## 🔌 Plugin Development

### Creating a Custom Provider

```typescript
import { Provider } from 'jxpush';

export class CustomProvider extends Provider {
  async initialize(): Promise<void> {
    // Initialize your provider
  }

  async send(message: PushMessage): Promise<SendResult> {
    // Send logic
  }

  async sendBulk(messages: PushMessage[]): Promise<BulkSendResult> {
    // Bulk send logic
  }

  validateToken(token: string): boolean {
    // Token validation
  }

  getCapabilities(): ProviderCapabilities {
    return {
      supportsSingleSend: true,
      supportsBulkSend: true,
      supportsTopicMessaging: false,
      supportsScheduling: false,
      maxBatchSize: 100,
    };
  }
}
```

### Registering Custom Provider

```typescript
import { ProviderRegistry } from 'jxpush';
import { CustomProvider } from './CustomProvider';

ProviderRegistry.registerLoader('custom', async (config) => {
  return new CustomProvider(config);
});
```

### Creating a Custom Queue Adapter

```typescript
import { QueueAdapter } from 'jxpush';

export class CustomQueueAdapter implements QueueAdapter {
  async connect(): Promise<void> {
    // Connect to queue
  }

  async disconnect(): Promise<void> {
    // Disconnect
  }

  async enqueue(job: QueueJob): Promise<string> {
    // Add job to queue
  }

  async process(handler: (job: QueueJob) => Promise<void>): Promise<void> {
    // Process jobs
  }
}
```

---

## 📈 Migration Guide

### From v1.x to v2.0

**Breaking Changes**:
1. Optional peer dependencies (must install manually)
2. New configuration format
3. Dynamic provider loading

**Migration Steps**:

1. **Update package.json**:
   ```bash
   npm install jxpush@2.0.0-beta.1
   ```

2. **Install peer dependencies**:
   ```bash
   # If using FCM
   npm install firebase-admin

   # If using Expo
   npm install expo-server-sdk
   ```

3. **Update configuration**:
   ```typescript
   // v1.x
   const client = new PushClient({
     provider: ProviderType.FCM,
     fcm: { /* ... */ },
   });

   // v2.0
   import { defineConfig } from 'jxpush';

   const config = defineConfig({
     provider: 'fcm',
     providers: {
       fcm: { /* ... */ },
     },
   });

   const client = new PushClient(config);
   ```

4. **Test thoroughly**:
   ```bash
   npm test
   ```

### From Other Libraries

#### From `firebase-admin`

```typescript
// Before
import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert('./firebase.json'),
});

await admin.messaging().send({
  token: 'device-token',
  notification: {
    title: 'Hello',
    body: 'World',
  },
});

// After
import { PushClient, MessageBuilder, defineConfig } from 'jxpush';

const config = defineConfig({
  provider: 'fcm',
  providers: {
    fcm: { serviceAccountPath: './firebase.json' },
  },
});

const client = new PushClient(config);
await client.initialize();

const message = new MessageBuilder()
  .setTitle('Hello')
  .setBody('World')
  .setToken('device-token')
  .build();

await client.send(message);
```

#### From `expo-server-sdk`

```typescript
// Before
import { Expo } from 'expo-server-sdk';

const expo = new Expo();

await expo.sendPushNotificationsAsync([{
  to: 'ExponentPushToken[xxx]',
  title: 'Hello',
  body: 'World',
}]);

// After
import { PushClient, MessageBuilder, defineConfig } from 'jxpush';

const config = defineConfig({
  provider: 'expo',
});

const client = new PushClient(config);
await client.initialize();

const message = new MessageBuilder()
  .setTitle('Hello')
  .setBody('World')
  .setToken('ExponentPushToken[xxx]')
  .build();

await client.send(message);
```

---

## ❓ FAQ

### Q: Do I need to install all peer dependencies?

**A**: No! Only install the providers and adapters you actually use. The CLI wizard (`npx jxpush init`) will install only what you select.

### Q: Can I use multiple providers in the same app?

**A**: Yes! Create separate `PushClient` instances for each provider:

```typescript
const fcmClient = new PushClient({ provider: 'fcm', /* ... */ });
const expoClient = new PushClient({ provider: 'expo', /* ... */ });
```

### Q: Is jxpush production-ready?

**A**: Yes! jxpush is battle-tested with:
- 100% TypeScript
- Comprehensive test suite
- Retry logic and rate limiting
- Used in production by multiple companies

### Q: What's the performance overhead?

**A**: Minimal. Dynamic loading adds ~10ms on first use, then providers are cached. Queue adapters add negligible latency.

### Q: Can I use jxpush in serverless (Lambda, Vercel)?

**A**: Yes! Use in-memory queue or no queue for serverless:

```typescript
const config = defineConfig({
  provider: 'expo',
  queue: {
    adapter: 'memory',
    concurrency: 10,
  },
});
```

### Q: How do I handle token expiration?

**A**: Check send results and remove invalid tokens:

```typescript
const result = await client.send(message);

if (!result.success && result.error?.code === 'INVALID_TOKEN') {
  await db.users.update(userId, { pushToken: null });
}
```

### Q: Can I schedule messages?

**A**: Yes, with BullMQ adapter:

```typescript
await client.send(message, { delay: 3600000 }); // 1 hour delay
```

### Q: How do I test without sending real notifications?

**A**: Use a mock provider or dry-run mode:

```typescript
const config = defineConfig({
  provider: 'fcm',
  dryRun: true, // No actual sends
});
```

---

## 🗺️ Roadmap

### v2.1 (Q2 2026)
- [ ] SMS support (Twilio, AWS SNS)
- [ ] WhatsApp Business API
- [ ] Slack/Discord webhooks
- [ ] Message scheduling UI

### v2.2 (Q3 2026)
- [ ] GraphQL API
- [ ] Admin dashboard
- [ ] A/B testing framework
- [ ] Advanced analytics

### v3.0 (Q4 2026)
- [ ] Multi-tenant support
- [ ] Message templates marketplace
- [ ] AI-powered personalization
- [ ] Real-time delivery tracking

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

**Quick Start**:
```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/jxpush.git
cd jxpush

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Submit PR
```

---

## 📄 License

MIT © [jxngrx](https://github.com/jxngrx)

---

## 🙏 Acknowledgments

Built with:
- [firebase-admin](https://github.com/firebase/firebase-admin-node)
- [expo-server-sdk](https://github.com/expo/expo-server-sdk-node)
- [web-push](https://github.com/web-push-libs/web-push)
- [BullMQ](https://github.com/taskforcesh/bullmq)
- [Handlebars](https://handlebarsjs.com/)

---

<div align="center">

**[⬆ Back to Top](#jxpush)**

Made with ❤️ by [jxngrx](https://github.com/jxngrx)

</div>
