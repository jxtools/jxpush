/**
 * CLI Command - Send
 * Send a single push notification
 */

import { Command } from 'commander';
import { PushClient } from '../../client/PushClient.js';
import { MessageBuilder } from '../../builder/MessageBuilder.js';
import { MessagePriority } from '../../types/message.types.js';
import type { PushClientConfig } from '../../types/config.types.js';
import { Formatter } from '../utils/formatter.js';
import { InputParser } from '../utils/input-parser.js';
import { ConfigLoader } from '../utils/config-loader.js';
import type { SendOptions } from '../types.js';

export function createSendCommand(): Command {
  const command = new Command('send');

  command
    .description('Send a single push notification')
    .requiredOption('-p, --provider <provider>', 'Provider (fcm, expo, webpush)')
    .requiredOption('-t, --token <token>', 'Device token or subscription')
    .option('--title <title>', 'Notification title')
    .option('--body <body>', 'Notification body')
    .option('--data <json>', 'Additional data as JSON string')
    .option('--priority <priority>', 'Message priority (high, normal, low)', 'normal')
    .option('--ttl <seconds>', 'Time to live in seconds', '86400')
    .option('--badge <number>', 'Badge count')
    .option('--sound <sound>', 'Notification sound')
    .option('-c, --config <path>', 'Path to config file')
    .action(async (options: SendOptions) => {
      try {
        console.log(Formatter.header('\n📤 Sending Push Notification\n'));

        // Load config
        const config = await ConfigLoader.loadConfig(options.config);
        const envConfig = ConfigLoader.loadEnvVars();
        const mergedConfig = ConfigLoader.mergeWithOptions(
          { ...envConfig, ...config },
          options as unknown as Record<string, unknown>
        );

        // Validate provider
        const provider = options.provider.toLowerCase();
        if (!['fcm', 'expo', 'webpush'].includes(provider)) {
          console.error(Formatter.error(`Invalid provider: ${options.provider}`));
          console.log(Formatter.info('Valid providers: fcm, expo, webpush'));
          process.exit(1);
        }

        // Initialize client
        const client = new PushClient(mergedConfig as unknown as PushClientConfig);

        // Parse data
        const data = InputParser.parseDataArgument(options.data);

        // Build message
        const builder = new MessageBuilder()
          .token(options.token);

        if (options.title) builder.title(options.title);
        if (options.body) builder.body(options.body);
        if (data) builder.data(data as Record<string, string>);
        if (options.badge) builder.badge(parseInt(options.badge.toString()));
        if (options.sound) builder.sound(options.sound);

        // Set priority
        if (options.priority) {
          const priorityMap: Record<string, MessagePriority> = {
            high: MessagePriority.HIGH,
            normal: MessagePriority.NORMAL,
            low: MessagePriority.LOW,
          };
          builder.priority(priorityMap[options.priority] || MessagePriority.NORMAL);
        }

        const message = builder.build();

        // Send message
        console.log(Formatter.info(`Provider: ${provider}`));
        console.log(Formatter.info(`Token: ${options.token.substring(0, 20)}...`));
        if (options.title) console.log(Formatter.info(`Title: ${options.title}`));
        if (options.body) console.log(Formatter.info(`Body: ${options.body}`));
        console.log('');

        const startTime = Date.now();
        const result = await client.send(message);
        const duration = Date.now() - startTime;

        // Display result
        if (result.success) {
          console.log(Formatter.success('Message sent successfully!'));
          if (result.messageId) {
            console.log(Formatter.keyValue('Message ID', result.messageId));
          }
        } else {
          console.log(Formatter.error('Failed to send message'));
          if (result.error) {
            console.log(Formatter.keyValue('Error', result.error.message));
          }
        }

        console.log(Formatter.keyValue('Duration', `${duration}ms`));
        console.log('');

        // Close client
        await client.shutdown();

        process.exit(result.success ? 0 : 1);
      } catch (error) {
        console.error(Formatter.error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`));
        process.exit(1);
      }
    });

  return command;
}
