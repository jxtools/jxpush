# Expo Push Notifications Setup Guide

This guide explains how to set up and use Expo Push Notifications with the `jxpush` library.

## Overview

Expo provides a simple push notification service for apps built with Expo or React Native. The `jxpush` library integrates with Expo's push notification service through the `expo-server-sdk`.

## Prerequisites

- An Expo account (free at [expo.dev](https://expo.dev))
- An Expo app (either using Expo Go or a standalone build)
- Expo push tokens from your app

## Getting Expo Push Tokens

### Option 1: Using Expo Go (Development)

1. **Install Expo Go** on your device from the App Store or Google Play

2. **Add push notifications to your Expo app**:
   ```javascript
   import * as Notifications from 'expo-notifications';

   async function registerForPushNotificationsAsync() {
     const { status: existingStatus } = await Notifications.getPermissionsAsync();
     let finalStatus = existingStatus;

     if (existingStatus !== 'granted') {
       const { status } = await Notifications.requestPermissionsAsync();
       finalStatus = status;
     }

     if (finalStatus !== 'granted') {
       alert('Failed to get push token for push notification!');
       return;
     }

     const token = (await Notifications.getExpoPushTokenAsync()).data;
     console.log('Expo Push Token:', token);
     return token;
   }
   ```

3. **Run your app** and copy the token that appears in the console
   - The token will look like: `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`
   - Example: `ExponentPushToken[abc123def456ghi789jkl012]`

### Option 2: Production Apps

For production apps (standalone builds), Expo automatically handles push token generation. Use the same code as above to retrieve tokens from your users' devices.

## Using jxpush with Expo

### Basic Setup

```typescript
import { PushClient, ProviderType } from 'jxpush';

const client = new PushClient({
  provider: ProviderType.EXPO,
  // expo config is optional - only needed if you want to use an access token
  // expo: {
  //   accessToken: process.env.EXPO_ACCESS_TOKEN,
  // },
});

await client.initialize();
```

> **Note**: The `expo` configuration object is completely optional. You only need to provide it if you want to use an access token for higher rate limits (6,000 vs 600 requests/hour).

### Sending Notifications

```typescript
// Single notification
await client.send({
  token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  notification: {
    title: 'Hello!',
    body: 'This is a test notification',
  },
  data: {
    customKey: 'customValue',
  },
});

// Bulk notifications
await client.sendBulk([
  {
    token: 'ExponentPushToken[token1]',
    notification: { title: 'Hi User 1', body: 'Message 1' },
  },
  {
    token: 'ExponentPushToken[token2]',
    notification: { title: 'Hi User 2', body: 'Message 2' },
  },
]);
```

## Expo Access Token (Optional)

An access token increases your rate limits from 600 to 6,000 requests per hour.

### How to Get an Access Token

1. Go to [expo.dev](https://expo.dev)
2. Sign in to your account
3. Navigate to **Account Settings** → **Access Tokens**
4. Click **Create Token**
5. Give it a name (e.g., "jxpush Production")
6. Copy the token and store it securely

### Using the Access Token

```typescript
const client = new PushClient({
  provider: ProviderType.EXPO,
  expo: {
    accessToken: process.env.EXPO_ACCESS_TOKEN, // Store in environment variable
  },
});
```

## Token Format

Expo push tokens come in two formats:

- **New format**: `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`
- **Old format**: `ExpoPushToken[xxxxxxxxxxxxxxxxxxxxxx]`

Both formats are supported by `jxpush`.

## Testing Notifications

### Using Expo's Push Notification Tool

Expo provides a web-based tool to test push notifications:

1. Go to [expo.dev/notifications](https://expo.dev/notifications)
2. Enter your Expo push token
3. Enter a title and message
4. Click "Send a Notification"

This is useful for verifying that your token works before integrating with `jxpush`.

### Using jxpush Mock Tests

The library includes mock tests that don't require real Expo credentials:

```bash
npm run test:integration
```

## Rate Limits

| Tier | Requests per Hour |
|------|-------------------|
| Without access token | 600 |
| With access token | 6,000 |

The `jxpush` library automatically handles batching (max 100 notifications per request) to optimize your rate limit usage.

## Supported Features

| Feature | Supported |
|---------|-----------|
| Single send | ✅ |
| Bulk send | ✅ |
| Custom data | ✅ |
| Sound | ✅ |
| Badge | ✅ |
| Priority | ✅ |
| TTL (expiration) | ✅ |
| Topic messaging | ❌ |
| Scheduling | ❌ |

## Troubleshooting

### "DeviceNotRegistered" Error

This means the Expo push token is no longer valid. Common causes:
- User uninstalled the app
- User disabled notifications
- Token expired

**Solution**: Remove the token from your database and request a new one when the user opens the app again.

### "MessageTooBig" Error

The notification payload exceeds Expo's size limit (4KB).

**Solution**: Reduce the size of your notification title, body, and data payload.

### "MessageRateExceeded" Error

You've exceeded Expo's rate limit.

**Solution**:
- Get an access token to increase limits
- Implement rate limiting in your application
- Use the built-in queue system in `jxpush`

## Production Checklist

- [ ] Store Expo access token in environment variables
- [ ] Implement token refresh logic in your app
- [ ] Handle "DeviceNotRegistered" errors by removing invalid tokens
- [ ] Monitor rate limits and adjust sending frequency
- [ ] Test notifications on both iOS and Android
- [ ] Set up error logging and monitoring

## Additional Resources

- [Expo Push Notifications Documentation](https://docs.expo.dev/push-notifications/overview/)
- [Expo Server SDK](https://github.com/expo/expo-server-sdk-node)
- [jxpush Examples](../examples/basic-expo.ts)
