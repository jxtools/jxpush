/**
 * Mock integration test that doesn't require real Firebase credentials
 * Use this to verify the test structure works before adding real credentials
 */

import { PushClient, ProviderType, LogLevel, MessagePriority } from '../../src';
import { user1Token } from '../data/token';

// Mock Firebase Admin
jest.mock('firebase-admin', () => {
  const mockMessaging = {
    send: jest.fn().mockResolvedValue('mock-message-id-12345'),
    sendEachForMulticast: jest.fn().mockImplementation((multicastMessage: any) => {
      const tokens = multicastMessage.tokens || [];
      return Promise.resolve({
        responses: tokens.map((_: any, index: number) => ({
          success: true,
          messageId: `mock-id-${index + 1}`,
        })),
        successCount: tokens.length,
        failureCount: 0,
      });
    }),
  };

  const mockApp = {
    messaging: () => mockMessaging,
    delete: jest.fn().mockResolvedValue(undefined),
  };

  return {
    credential: {
      cert: jest.fn().mockReturnValue({}),
    },
    initializeApp: jest.fn().mockReturnValue(mockApp),
    messaging: jest.fn().mockReturnValue(mockMessaging),
  };
});

describe('PushClient Mock Integration - Send Notifications', () => {
  let client: PushClient;

  beforeAll(async () => {
    // Initialize client with FCM (will use mocked Firebase)
    client = new PushClient({
      provider: ProviderType.FCM,
      fcm: {
        serviceAccountPath: '../../firebase-service-account.json',
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
    it('should successfully send a notification to a valid token', async () => {
      const result = await client.send({
        token: user1Token,
        notification: {
          title: 'Mock Integration Test',
          body: 'Testing notification delivery with mocks',
        },
        data: {
          testId: 'mock-integration-test-1',
          timestamp: new Date().toISOString(),
        },
        priority: MessagePriority.HIGH,
      });

      // Verify the result
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.error).toBeUndefined();

      console.log('✅ Mock notification sent successfully:', result.messageId);
    });

    it('should send notification using MessageBuilder', async () => {
      const message = client
        .message()
        .token(user1Token)
        .title('Builder Test')
        .body('Testing MessageBuilder integration')
        .data({ source: 'builder-test' })
        .priority(MessagePriority.NORMAL)
        .badge(1)
        .sound('default')
        .build();

      const result = await client.send(message);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();

      console.log('✅ MessageBuilder notification sent:', result.messageId);
    });
  });

  describe('Bulk Notification Send', () => {
    it('should send notifications to multiple tokens', async () => {
      const messages = [
        {
          token: user1Token,
          notification: {
            title: 'Bulk Test 1',
            body: 'First message in bulk send',
          },
        },
        {
          token: user1Token,
          notification: {
            title: 'Bulk Test 2',
            body: 'Second message in bulk send',
          },
        },
        {
          token: user1Token,
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

      console.log('✅ Bulk send completed:', {
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
        token: user1Token,
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
      expect(metrics.byProvider.get(ProviderType.FCM)).toBeDefined();

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
        provider: ProviderType.FCM,
        fcm: {
          serviceAccountPath: './firebase-service-account.json',
        },
        logLevel: LogLevel.INFO,
        hooks,
      });

      await hookedClient.initialize();

      // Send notification
      await hookedClient.send({
        token: user1Token,
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
