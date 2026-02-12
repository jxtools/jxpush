/**
 * Queue usage example
 */

import { PushClient, ProviderType } from '../src';

async function main() {
  // Initialize client with queue enabled
  const client = new PushClient({
    provider: ProviderType.FCM,
    fcm: {
      serviceAccountPath: './path/to/serviceAccountKey.json',
    },
    queue: {
      enabled: true,
      concurrency: 10, // Process 10 messages concurrently
      maxSize: 1000, // Max 1000 messages in queue
      autoStart: true, // Start processing automatically
    },
    rateLimit: {
      enabled: true,
      maxPerSecond: 50, // Max 50 requests per second
      maxPerMinute: 2000, // Max 2000 requests per minute
      allowBurst: true,
    },
    logLevel: 'info' as const,
  });

  await client.initialize();

  try {
    console.log('=== Queue Example ===\n');

    // Queue multiple messages
    const messageIds: string[] = [];

    for (let i = 0; i < 100; i++) {
      const id = client.queue(
        {
          token: `device-token-${i}`,
          notification: {
            title: `Queued Message ${i}`,
            body: 'This message is being processed by the queue',
          },
          data: {
            messageNumber: String(i),
          },
        },
        i % 10 // Priority (0-9)
      );

      messageIds.push(id);
    }

    console.log(`Queued ${messageIds.length} messages`);

    // Check queue status
    const status = client.getQueueStatus();
    console.log('\nQueue status:', status);

    // Wait for queue to process
    console.log('\nProcessing queue...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Check final status
    const finalStatus = client.getQueueStatus();
    console.log('\nFinal queue status:', finalStatus);

    // Get metrics
    const metrics = client.getMetrics();
    console.log('\nMetrics:');
    console.log('- Total sent:', metrics.totalSent);
    console.log('- Total success:', metrics.totalSuccess);
    console.log('- Total failure:', metrics.totalFailure);
    console.log('- Rate limited:', metrics.totalRateLimited);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.shutdown();
  }
}

main().catch(console.error);
