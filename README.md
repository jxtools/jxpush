# jxpush

> Production-grade unified push notification library for Node.js with zero-bloat architecture.

[![npm version](https://img.shields.io/npm/v/jxpush.svg)](https://www.npmjs.com/package/jxpush)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`jxpush` is a modular, provider-agnostic push notification engine designed for high-throughput production environments. It abstracts the complexities of different push providers (FCM, Expo, Web Push) into a single, unified API while ensuring that your application only loads the dependencies it actually needs.

Unlike other libraries that bundle all provider SDKs together, `jxpush` uses dynamic lazy loading. If you only use FCM, you don't pay the performance or install size penalty of Expo or Web Push dependencies.

## Features

-   **Zero-Bloat Architecture**: Providers and their SDKs are lazy-loaded on demand.
-   **Unified API**: Send messages to iOS, Android, and Web using a consistent interface.
-   **Multi-Provider Support**:
    -   **Firebase Cloud Messaging (FCM)** (v1 HTTP API)
    -   **Expo Push Notifications**
    -   **Web Push** (VAPID)
-   **Built-in Queue System**:
    -   **In-Memory**: For development and simple use cases.
    -   **Redis**: For production using `ioredis`.
    -   **BullMQ**: For robust, job-based processing.
    -   **RabbitMQ**: For AMQP-based architectures.
-   **Resilience**:
    -   **Automatic Retries**: Configurable exponential backoff.
    -   **Rate Limiting**: Token bucket implementation to prevent provider 429 errors.
-   **Developer Experience**:
    -   written in **TypeScript** with complete type definitions.
    -   **Interactive CLI** for project scaffolding.

## Installation

Install the core library:

```bash
npm install jxpush
# or
pnpm add jxpush
# or
yarn add jxpush
```

### Install Provider Dependencies

You must install the SDKs for the providers you intend to use.

**For FCM:**
```bash
npm install firebase-admin
```

**For Expo:**
```bash
npm install expo-server-sdk
```

**For Web Push:**
```bash
npm install web-push
```

### Install Queue Dependencies (Optional)

**For Redis:**
```bash
npm install ioredis
```

**For BullMQ:**
```bash
npm install bullmq ioredis
```

**For RabbitMQ:**
```bash
npm install amqplib
```

## Requirements

-   Node.js >= 20.0.0

## Quick Start

1.  **Initialize a project:**

    ```bash
    npx jxpush setup
    ```

2.  **Manually create a client:**

    ```typescript
    import { PushClient, ProviderType } from 'jxpush';

    const client = new PushClient({
      provider: ProviderType.FCM,
      fcm: {
        serviceAccountPath: './service-account.json',
      },
    });

    await client.initialize();

    const result = await client.send({
      token: 'DEVICE_FCM_TOKEN',
      notification: {
        title: 'Security Alert',
        body: 'Motion detected at the front door.',
      },
      data: {
        eventId: '12345',
      },
    });

    console.log(result);
    ```

## Configuration

`jxpush` uses a typed configuration object. You can define this in `jxpush.config.ts` or pass it directly to the `PushClient` constructor.

```typescript
import { defineConfig, ProviderType } from 'jxpush';

export default defineConfig({
  provider: ProviderType.FCM,

  fcm: {
    serviceAccountPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  },

  // explicit rate limiting configuration
  rateLimit: {
    enabled: true,
    maxPerSecond: 100,
  },

  // retry configuration
  retry: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    backoffMultiplier: 2,
  },

  // queue configuration
  queue: {
    enabled: true,
    adapter: 'redis',
    redis: {
        host: 'localhost',
        port: 6379
    }
  }
});
```

## Provider Setup Guides

### FCM Setup

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Navigate to Project Settings > Service accounts.
3.  Click "Generate new private key".
4.  Save the JSON file and reference it in `serviceAccountPath`.

### Expo Setup

1.  Obtain an Access Token from your [Expo Account Settings](https://expo.dev/settings/access-tokens).
2.  Configure it in `jxpush`:

```typescript
expo: {
  accessToken: process.env.EXPO_ACCESS_TOKEN,
}
```

### Web Push Setup

1.  Generate VAPID keys using `web-push`:

    ```bash
    npx web-push generate-vapid-keys
    ```

2.  Configure them in `jxpush`:

```typescript
webpush: {
  vapidKeys: {
    subject: 'mailto:admin@example.com',
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
  },
}
```

## Usage Examples

### Sending Bulk Notifications

The `sendBulk` method automatically chunks requests based on the provider's limits (e.g., 500 for FCM, 100 for Expo).

```typescript
const messages = users.map(user => ({
  token: user.pushToken,
  notification: { title: 'Weekly Updates', body: 'Check out what is new!' }
}));

const result = await client.sendBulk(messages);

console.log(`Success: ${result.successCount}, Failed: ${result.failureCount}`);
```

### Sending to a Topic (FCM Only)

```typescript
await client.sendToTopic('news-updates', {
  notification: {
    title: 'Breaking News',
    body: 'Story details...',
  }
});
```

### Using the Queue

Offload sending to a background worker to prevent blocking the main thread.

```typescript
// Enqueue message
const jobId = await client.queue({
  token: 'DEVICE_TOKEN',
  notification: { title: 'Queued Message', body: 'This will be processed by a worker' }
});

console.log(`Message queued with Job ID: ${jobId}`);
```

## Architecture Overview

`jxpush` is built on a layered architecture:

1.  **Client Layer (`PushClient`)**: The public facade that handles validation, rate limiting, and retry orchestration.
2.  **Registry Layer**: `ProviderRegistry` and `AdapterRegistry` handle dynamic imports of dependencies.
3.  **Provider Layer**: Standardized `IProvider` interface implementations for FCM, Expo, and WebPush.
4.  **Transport Layer**: Handles the actual HTTP/TCP communication with external services.

## Comparison

| Feature | Direct SDKs (Firebase/Expo) | jxpush |
| :--- | :--- | :--- |
| **API Surface** | Different for every provider | Unified `PushMessage` interface |
| **Retries** | Manual implementation required | Built-in exponential backoff |
| **Rate Limiting** | Manual implementation required | Built-in Token Bucket |
| **Dependencies** | Specific SDKs only | Modular & Lazy-loaded |
| **Queueing** | External implementation required | Native Redis/BullMQ support |
| **Batching** | Manual chunking required | Automatic chunking |

## Error Handling

All errors thrown by the library are instances of `PushError` or `ProviderError`, containing standardized error codes.

```typescript
import { PushClient, ErrorCode } from 'jxpush';

try {
  await client.send(message);
} catch (error) {
  if (error.code === ErrorCode.INVALID_CONFIG) {
    console.error('Configuration error:', error.message);
  } else if (error.code === ErrorCode.PROVIDER_ERROR) {
    console.error('Provider API error:', error.message);
  }
}
```

## Contributing

1.  Fork the repository.
2.  Install dependencies: `npm install`.
3.  Run tests: `npm test`.
4.  Submit a Pull Request.

## License

MIT © [jxngrx](https://github.com/jxngrx)

## Repository Structure

-   `src/client`: Main entry point and orchestration logic.
-   `src/providers`: Implementation of specific push providers.
-   `src/queue`: Queue adapters and logic.
-   `src/cli`: Setup wizard and CLI tools.
-   `examples`: Working code examples.
