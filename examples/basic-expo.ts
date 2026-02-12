/**
 * Basic Expo usage example
 */

import { PushClient, ProviderType, MessagePriority, LogLevel } from '../src';

async function main() {
  // Initialize client with Expo
  const client = new PushClient({
    provider: ProviderType.EXPO,
    expo: {
      // Option 1: Use access token (optional, for higher rate limits)
      // accessToken: process.env.EXPO_ACCESS_TOKEN,

      // Option 2: No config needed for basic usage
    },
    logLevel: LogLevel.INFO,
  });

  // Initialize the client
  await client.initialize();

  try {
    // Example 1: Send a single notification
    console.log('\n=== Example 1: Single Send ===');
    const singleResult = await client.send({
      token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]', // Replace with your Expo push token
      notification: {
        title: 'Hello from jxpush!',
        body: 'This is a test notification via Expo',
      },
      data: {
        customKey: 'customValue',
      },
      priority: MessagePriority.HIGH,
    });

    console.log('Single send result:', singleResult);

    // Example 2: Send using message builder
    console.log('\n=== Example 2: Using Message Builder ===');
    const message = client
      .message()
      .token('ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]') // Replace with your token
      .title('Built with MessageBuilder')
      .body('This message was created using the fluent API')
      .data({ source: 'builder-example' })
      .priority(MessagePriority.NORMAL)
      .badge(5)
      .sound('default')
      .build();

    const builderResult = await client.send(message);
    console.log('Builder send result:', builderResult);

    // Example 3: Bulk send to multiple devices
    console.log('\n=== Example 3: Bulk Send ===');
    const tokens = [
      'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
      'ExponentPushToken[yyyyyyyyyyyyyyyyyyyyyy]',
      'ExponentPushToken[zzzzzzzzzzzzzzzzzzzzzz]',
      // ... up to 100 tokens per batch
    ];

    const bulkMessages = tokens.map((token) => ({
      token,
      notification: {
        title: 'Bulk Notification',
        body: 'Sent to multiple devices at once',
      },
      data: {
        campaign: 'bulk-2024',
      },
    }));

    const bulkResult = await client.sendBulk(bulkMessages);
    console.log('Bulk send result:', {
      total: bulkResult.total,
      success: bulkResult.successCount,
      failure: bulkResult.failureCount,
      duration: `${bulkResult.durationMs}ms`,
    });

    // Example 4: Send with custom data and sound
    console.log('\n=== Example 4: Rich Notification ===');
    const richResult = await client.send({
      token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
      notification: {
        title: '🎉 Special Offer!',
        body: 'Check out our latest deals',
        sound: 'default',
        badge: 1,
      },
      data: {
        screen: 'offers',
        offerId: '12345',
      },
      priority: MessagePriority.HIGH,
      ttl: 3600, // 1 hour
    });

    console.log('Rich notification result:', richResult);

    // Get metrics
    console.log('\n=== Metrics ===');
    const metrics = client.getMetrics();
    console.log('Total sent:', metrics.totalSent);
    console.log('Total success:', metrics.totalSuccess);
    console.log('Total failure:', metrics.totalFailure);
    console.log('Average latency:', `${metrics.averageLatencyMs.toFixed(2)}ms`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Cleanup
    await client.shutdown();
  }
}

main().catch(console.error);
