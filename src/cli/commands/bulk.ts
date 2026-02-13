/**
 * CLI Command - Bulk
 * Send bulk push notifications from a file
 */

import { Command } from 'commander';
import { PushClient } from '../../client/PushClient.js';
import { MessageBuilder } from '../../builder/MessageBuilder.js';
import type { PushClientConfig } from '../../types/config.types.js';
import { Formatter } from '../utils/formatter.js';
import { InputParser } from '../utils/input-parser.js';
import { ConfigLoader } from '../utils/config-loader.js';
import type { BulkOptions, BulkMessageInput } from '../types.js';

export function createBulkCommand(): Command {
  const command = new Command('bulk');

  command
    .description('Send bulk push notifications from a file')
    .requiredOption('-p, --provider <provider>', 'Provider (fcm, expo)')
    .requiredOption('-f, --file <path>', 'Path to JSON file with messages')
    .option('--title <title>', 'Default title for all messages')
    .option('--body <body>', 'Default body for all messages')
    .option('--data <json>', 'Default data as JSON string')
    .option('--batch-size <size>', 'Batch size for sending', '100')
    .option('-c, --config <path>', 'Path to config file')
    .action(async (options: BulkOptions) => {
      try {
        console.log(Formatter.header('\n📤 Sending Bulk Push Notifications\n'));

        // Load config
        const config = await ConfigLoader.loadConfig(options.config);
        const envConfig = ConfigLoader.loadEnvVars();
        const mergedConfig = ConfigLoader.mergeWithOptions(
          { ...envConfig, ...config },
          options as unknown as Record<string, unknown>
        );

        // Validate provider
        const provider = options.provider.toLowerCase();
        if (!['fcm', 'expo'].includes(provider)) {
          console.error(Formatter.error(`Invalid provider: ${options.provider}`));
          console.log(Formatter.info('Valid providers: fcm, expo'));
          process.exit(1);
        }

        // Load messages from file
        console.log(Formatter.info(`Loading messages from: ${options.file}`));
        const fileData = InputParser.readJSONFile<BulkMessageInput[] | { messages: BulkMessageInput[] }>(
          options.file
        );

        const messages = Array.isArray(fileData) ? fileData : fileData.messages;

        if (!messages || messages.length === 0) {
          console.error(Formatter.error('No messages found in file'));
          process.exit(1);
        }

        console.log(Formatter.info(`Loaded ${messages.length} messages`));
        console.log('');

        // Initialize client
        const client = new PushClient(mergedConfig as unknown as PushClientConfig);

        // Parse default data
        const defaultData = InputParser.parseDataArgument(options.data);

        // Build messages
        const pushMessages = messages.map((msg) => {
          const builder = new MessageBuilder()
            .token(msg.token)
            .title(msg.title || options.title || '')
            .body(msg.body || options.body || '');

          const messageData = { ...defaultData, ...(msg.data || {}) };
          if (Object.keys(messageData).length > 0) {
            builder.data(messageData as Record<string, string>);
          }

          return builder.build();
        });

        // Send bulk
        const startTime = Date.now();

        console.log(Formatter.info('Sending messages...'));
        console.log('');

        const result = await client.sendBulk(pushMessages);
        const duration = Date.now() - startTime;

        // Display results
        console.log('');
        console.log(Formatter.header('Results:'));
        console.log('');

        const resultsForTable = result.results.slice(0, 10).map((r, idx) => ({
          status: r.success ? 'success' : 'failed',
          token: messages[idx]?.token || 'N/A',
          message: r.success
            ? `Sent (ID: ${r.messageId || 'N/A'})`
            : r.error?.message || 'Unknown error',
        }));

        console.log(Formatter.createResultsTable(resultsForTable));

        if (result.results.length > 10) {
          console.log(Formatter.info(`... and ${result.results.length - 10} more`));
        }

        console.log('');
        console.log(Formatter.header('Summary:'));
        console.log('');

        console.log(
          Formatter.createSummaryTable({
            total: result.total,
            success: result.successCount,
            failed: result.failureCount,
            duration,
          })
        );

        console.log('');

        // Close client
        await client.shutdown();

        process.exit(result.failureCount === 0 ? 0 : 1);
      } catch (error) {
        console.error(
          Formatter.error(
            `Failed to send bulk messages: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        );
        process.exit(1);
      }
    });

  return command;
}
