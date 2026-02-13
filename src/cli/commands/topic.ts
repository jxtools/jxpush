/**
 * CLI Command - Topic
 * Send notifications to a topic (FCM only for now)
 */

import { Command } from 'commander';
import { Formatter } from '../utils/formatter.js';
import type { TopicOptions } from '../types.js';

export function createTopicCommand(): Command {
  const command = new Command('topic');

  command
    .description('Send notification to a topic (FCM only)')
    .requiredOption('-p, --provider <provider>', 'Provider (currently only fcm supported)')
    .requiredOption('--topic <topic>', 'Topic name')
    .option('--title <title>', 'Notification title')
    .option('--body <body>', 'Notification body')
    .option('--data <json>', 'Additional data as JSON string')
    .option('-c, --config <path>', 'Path to config file')
    .action(async (options: TopicOptions) => {
      try {
        console.log(Formatter.header('\n📢 Sending Topic Notification\n'));

        // Validate provider
        const provider = options.provider.toLowerCase();
        if (provider !== 'fcm') {
          console.error(Formatter.error('Topic messaging is currently only supported for FCM'));
          process.exit(1);
        }

        console.log(Formatter.warning('Topic messaging feature coming soon!'));
        console.log(
          Formatter.info('This will allow sending to FCM topics and condition-based messaging')
        );
        console.log('');
        console.log(Formatter.keyValue('Topic', options.topic));
        if (options.title) console.log(Formatter.keyValue('Title', options.title));
        if (options.body) console.log(Formatter.keyValue('Body', options.body));
        console.log('');

        // TODO: Implement topic messaging
        // This requires extending FCMProvider to support topic-based messaging
        // using admin.messaging().sendToTopic() or sendToCondition()

        process.exit(0);
      } catch (error) {
        console.error(
          Formatter.error(
            `Failed to send topic message: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        );
        process.exit(1);
      }
    });

  return command;
}
