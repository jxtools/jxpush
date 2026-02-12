/**
 * Basic FCM usage example
 */

import { PushClient, ProviderType, MessagePriority } from '../src';

async function main() {
  // Initialize client with FCM
  const client = new PushClient({
    provider: ProviderType.FCM,
    fcm: {
      // Option 1: Use service account file path
      serviceAccountPath: './path/to/serviceAccountKey.json',

      // Option 2: Use service account object
      // serviceAccount: require('./path/to/serviceAccountKey.json'),
    },
    logLevel: 'info' as const,
  });

  // Initialize the client
  await client.initialize();

  try {
    // Example 1: Send a single notification
    console.log('\n=== Example 1: Single Send ===');
    const singleResult = await client.send({
      token: 'device-token-here',
      notification: {
        title: 'Hello from jxpush!',
        body: 'This is a test notification',
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
      .token('device-token-here')
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
      'device-token-1',
      'device-token-2',
      'device-token-3',
      // ... up to thousands of tokens
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

    // Example 4: Send to topic
    console.log('\n=== Example 4: Topic Messaging ===');
    const topicResult = await client.sendToTopic('news', {
      notification: {
        title: 'Breaking News',
        body: 'Important update for all subscribers',
      },
    });

    console.log('Topic send result:', topicResult);

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
