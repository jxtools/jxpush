# Testing Guide for jxpush

This directory contains tests for the jxpush package.

## Test Structure

```
tests/
├── unit/              # Unit tests (fast, no external dependencies)
│   └── MessageBuilder.test.ts
├── integration/       # Integration tests (require Firebase credentials)
│   └── send-notification.test.ts
└── data/             # Test data and fixtures
    └── token.ts
```

## Running Tests

### Unit Tests Only
```bash
npm test
```

### Integration Tests (Requires Firebase Setup)
```bash
npm run test:integration
```

### All Tests
```bash
npm run test:all
```

## Integration Test Setup

Integration tests require a valid Firebase service account and a real device token.

### Prerequisites

1. **Firebase Service Account**
   - Place your `firebase-service-account.json` in the project root
   - Get it from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key

2. **Device Token**
   - Update `tests/data/token.ts` with a valid FCM device token
   - Get a token from your mobile app or use the example apps

### What Integration Tests Verify

✅ **Actual Notification Delivery**
- Sends real notifications to Firebase
- Verifies successful delivery with message IDs
- Tests error handling with invalid tokens

✅ **MessageBuilder Integration**
- Tests the fluent API with real sends
- Verifies all builder options work correctly

✅ **Bulk Send Operations**
- Tests sending to multiple devices
- Verifies batch processing
- Tests mixed valid/invalid tokens

✅ **Metrics & Analytics**
- Verifies metrics collection
- Tests analytics hooks
- Validates timing and counters

✅ **Error Handling**
- Tests graceful failure scenarios
- Verifies error messages
- Tests retry logic

## Test Output

Integration tests will output:
- ✅ Success messages with message IDs
- 📊 Metrics (success/failure counts, latency)
- 🔍 Detailed error information when failures occur

## Important Notes

⚠️ **Integration tests send real notifications** - Make sure your test token is valid and you're okay with receiving test notifications.

⚠️ **Rate Limits** - Be mindful of Firebase quotas when running integration tests repeatedly.

⚠️ **Credentials** - Never commit `firebase-service-account.json` to version control. It's already in `.gitignore`.

## Example Test Run

```bash
$ npm run test:integration

 PASS  tests/integration/send-notification.test.ts
  PushClient Integration - Send Notifications
    Single Notification Send
      ✓ should successfully send a notification to a valid token (1234ms)
      ✅ Notification sent successfully: projects/my-project/messages/0:1234567890
      ✓ should fail gracefully with an invalid token (567ms)
      ✅ Invalid token handled correctly: Invalid registration token
    Bulk Notification Send
      ✓ should send notifications to multiple tokens (2345ms)
      ✅ Bulk send completed: { total: 3, success: 3, failure: 0, duration: '2345ms' }
    Metrics Tracking
      ✓ should track metrics correctly after sending (890ms)
      ✅ Metrics collected: { totalSent: 7, totalSuccess: 6, totalFailure: 1 }

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
```
