/**
 * Analytics hooks example
 */

import { PushClient, ProviderType, LogLevel } from '../src';

async function main() {
  // Track statistics
  const stats = {
    sendAttempts: 0,
    successes: 0,
    failures: 0,
    retries: 0,
    rateLimits: 0,
    drops: 0,
    totalLatency: 0,
  };

  // Initialize client with hooks
  const client = new PushClient({
    provider: ProviderType.FCM,
    fcm: {
      serviceAccountPath: './path/to/serviceAccountKey.json',
    },
    hooks: {
      onSendStart: (data) => {
        stats.sendAttempts += data.messageCount;
        console.log(`[HOOK] Send started: ${data.messageCount} messages to ${data.provider}`);
      },

      onSendSuccess: (data) => {
        stats.successes += data.messageCount;
        stats.totalLatency += data.durationMs;
        console.log(
          `[HOOK] Send succeeded: ${data.messageCount} messages in ${data.durationMs}ms`
        );
      },

      onSendFailure: (data) => {
        stats.failures += data.messageCount;
        console.error(
          `[HOOK] Send failed: ${data.messageCount} messages - ${data.error.message}`
        );
      },

      onRetry: (data) => {
        stats.retries++;
        console.log(
          `[HOOK] Retrying (${data.attempt}/${data.maxAttempts}) after ${data.delayMs}ms - ${data.error.message}`
        );
      },

      onRateLimit: (data) => {
        stats.rateLimits++;
        console.log(`[HOOK] Rate limited: waiting ${data.waitMs}ms (queue size: ${data.queueSize})`);
      },

      onDrop: (data) => {
        stats.drops += data.messageCount;
        console.error(`[HOOK] Dropped ${data.messageCount} messages: ${data.reason}`);
      },
    },
    retry: {
      enabled: true,
      maxAttempts: 3,
      initialDelayMs: 1000,
    },
    logLevel: LogLevel.INFO,
  });

  await client.initialize();

  try {
    console.log('=== Analytics Hooks Example ===\n');

    // Send some messages
    const tokens = Array.from({ length: 10 }, (_, i) => `device-token-${i}`);

    const messages = tokens.map((token) => ({
      token,
      notification: {
        title: 'Hooks Demo',
        body: 'Testing analytics hooks',
      },
    }));

    await client.sendBulk(messages);

    // Print statistics
    console.log('\n=== Statistics ===');
    console.log('Send attempts:', stats.sendAttempts);
    console.log('Successes:', stats.successes);
    console.log('Failures:', stats.failures);
    console.log('Retries:', stats.retries);
    console.log('Rate limits:', stats.rateLimits);
    console.log('Drops:', stats.drops);
    console.log(
      'Average latency:',
      stats.successes > 0 ? `${(stats.totalLatency / stats.successes).toFixed(2)}ms` : 'N/A'
    );

    // Get built-in metrics
    console.log('\n=== Built-in Metrics ===');
    const metrics = client.getMetrics();
    console.log(JSON.stringify(metrics, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.shutdown();
  }
}

main().catch(console.error);
