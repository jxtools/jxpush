/**
 * jxpush CLI
 * Main entry point for the command-line interface
 */

import { Command } from 'commander';
import { createSendCommand } from './commands/send.js';
import { createBulkCommand } from './commands/bulk.js';
import { createTopicCommand } from './commands/topic.js';
import { createQueueCommand } from './commands/queue.js';
import { createTemplateCommand } from './commands/template.js';
import { Formatter } from './utils/formatter.js';

const packageJson = {
  name: 'jxpush',
  version: '2.0.0',
  description: 'Production-grade unified messaging and push delivery engine for Node.js',
};

export async function run(): Promise<void> {
  const program = new Command();

  program
    .name(packageJson.name)
    .description(packageJson.description)
    .version(packageJson.version, '-v, --version', 'Output the current version');

  // Add commands
  program.addCommand(createSendCommand());
  program.addCommand(createBulkCommand());
  program.addCommand(createTopicCommand());
  program.addCommand(createQueueCommand());
  program.addCommand(createTemplateCommand());

  // Custom help
  program.on('--help', () => {
    console.log('');
    console.log(Formatter.header('Examples:'));
    console.log('');
    console.log('  # Send a single notification');
    console.log('  $ npx jxpush send --provider fcm --token TOKEN --title "Hello" --body "World"');
    console.log('');
    console.log('  # Send bulk notifications from file');
    console.log('  $ npx jxpush bulk --provider fcm --file messages.json');
    console.log('');
    console.log('  # Send to a topic');
    console.log(
      '  $ npx jxpush topic --provider fcm --topic news --title "Breaking" --body "News"'
    );
    console.log('');
    console.log('  # Check queue status');
    console.log('  $ npx jxpush queue status');
    console.log('');
    console.log('  # Render a template');
    console.log('  $ npx jxpush template render --name welcome --data \'{"name":"John"}\'');
    console.log('');
    console.log(Formatter.info('For more information, visit: https://jxpush.jxngrx.com'));
    console.log('');
  });

  // Parse arguments
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error(
      Formatter.error(`CLI Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    );
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error(
    Formatter.error(
      `Unhandled rejection: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  );
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(Formatter.error(`Uncaught exception: ${error.message}`));
  process.exit(1);
});
