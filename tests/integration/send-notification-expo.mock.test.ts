/**
 * Mock integration test for Expo notifications
 * This test uses Jest mocks instead of real Expo credentials
 */

import { PushClient, ProviderType, LogLevel, MessagePriority } from '../../src';

// Mock Expo SDK
jest.mock('expo-server-sdk', () => {
  class MockExpo {
    static isExpoPushToken(token: string) {
      return token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[');
    }

    async sendPushNotificationsAsync(messages: any[]) {
      return messages.map((_, index) => ({
        status: 'ok',
        id: `expo-mock-id-${index + 1}`,
      }));
    }
  }

  return {
    __esModule: true,
    Expo: MockExpo,
    default: MockExpo,
  };
});

describe('PushClient Mock Integration - Expo Notifications', () => {
  let client: PushClient;
  const expoToken = 'ExponentPushToken[cqHtY8AMULephqgQQS8BvD]';

  beforeAll(async () => {
    // Initialize client with Expo
    client = new PushClient({
      provider: ProviderType.EXPO,
      expo: {
        // No access token needed for mock
      },
      logLevel: LogLevel.INFO,
      retry: {
        enabled: true,
        maxAttempts: 3,
        initialDelayMs: 1000,
      },
    });

    await client.initialize();
  });

  afterAll(async () => {
    await client.shutdown();
  });

  describe('Single Notification Send', () => {
    it('should successfully send a notification to a valid Expo token', async () => {
      const result = await client.send({
        token: expoToken,
        notification: {
          title: 'Expo Integration Test',
          body: 'Testing Expo notification delivery',
        },
        data: {
          testId: 'expo-integration-test-1',
          timestamp: new Date().toISOString(),
        },
        priority: MessagePriority.HIGH,
      });

      // Verify the result
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.error).toBeUndefined();

      console.log('✅ Expo notification sent successfully:', result.messageId);
    });

    it('should send notification using MessageBuilder', async () => {
      const message = client
        .message()
        .token(expoToken)
        .title('Builder Test')
        .body('Testing MessageBuilder with Expo')
        .data({ source: 'builder-test' })
        .priority(MessagePriority.NORMAL)
        .badge(1)
        .sound('default')
        .build();

      const result = await client.send(message);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();

      console.log('✅ MessageBuilder Expo notification sent:', result.messageId);
    });
  });

  describe('Bulk Notification Send', () => {
    it('should send notifications to multiple Expo tokens', async () => {
      const messages = [
        {
          token: expoToken,
          notification: {
            title: 'Bulk Test 1',
            body: 'First message in bulk send',
          },
        },
        {
          token: expoToken,
          notification: {
            title: 'Bulk Test 2',
            body: 'Second message in bulk send',
          },
        },
        {
          token: expoToken,
          notification: {
            title: 'Bulk Test 3',
            body: 'Third message in bulk send',
          },
        },
      ];

      const result = await client.sendBulk(messages);

      expect(result).toBeDefined();
      expect(result.total).toBe(3);
      expect(result.successCount).toBe(3);
      expect(result.failureCount).toBe(0);
      expect(result.results).toHaveLength(3);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);

      console.log('✅ Expo bulk send completed:', {
        total: result.total,
        success: result.successCount,
        failure: result.failureCount,
        duration: `${result.durationMs}ms`,
      });
    });
  });

  describe('Metrics Tracking', () => {
    it('should track metrics correctly after sending', async () => {
      // Send a notification
      await client.send({
        token: expoToken,
        notification: {
          title: 'Metrics Test',
          body: 'Testing metrics collection',
        },
      });

      // Get metrics
      const metrics = client.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalSent).toBeGreaterThan(0);
      expect(metrics.totalSuccess).toBeGreaterThan(0);
      expect(metrics.byProvider).toBeDefined();
      expect(metrics.byProvider.get(ProviderType.EXPO)).toBeDefined();

      console.log('✅ Metrics collected:', {
        totalSent: metrics.totalSent,
        totalSuccess: metrics.totalSuccess,
        totalFailure: metrics.totalFailure,
        averageLatency: `${metrics.averageLatencyMs.toFixed(2)}ms`,
      });
    });
  });

  describe('Analytics Hooks', () => {
    it('should trigger hooks during notification send', async () => {
      const hooks = {
        onSendStart: jest.fn(),
        onSendSuccess: jest.fn(),
        onSendFailure: jest.fn(),
      };

      // Create a new client with hooks
      const hookedClient = new PushClient({
        provider: ProviderType.EXPO,
        expo: {},
        logLevel: LogLevel.INFO,
        hooks,
      });

      await hookedClient.initialize();

      // Send notification
      await hookedClient.send({
        token: expoToken,
        notification: {
          title: 'Hook Test',
          body: 'Testing analytics hooks',
        },
      });

      // Verify hooks were called
      expect(hooks.onSendStart).toHaveBeenCalled();
      expect(hooks.onSendSuccess).toHaveBeenCalled();

      console.log('✅ Hooks triggered successfully');

      await hookedClient.shutdown();
    });
  });
});
