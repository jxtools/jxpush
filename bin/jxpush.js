#!/usr/bin/env node

/**
 * jxpush CLI Entry Point
 * Handles both setup wizard and send commands
 */

const { Command } = require('commander');
const path = require('path');

const program = new Command();

program
  .name('jxpush')
  .description('Zero-bloat modular messaging engine for Node.js')
  .version('2.0.0-beta.1');

// Setup/Init command
program
  .command('init')
  .alias('setup')
  .description('Interactive setup wizard to configure jxpush')
  .action(async () => {
    try {
      // Dynamic import of setup wizard
      const setupPath = path.join(__dirname, '../dist/cjs/cli/setup.js');
      require(setupPath);
    } catch (error) {
      console.error('Failed to run setup wizard:', error.message);
      console.error('Make sure jxpush is built: npm run build');
      process.exit(1);
    }
  });

// Send command (existing functionality)
program
  .command('send')
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
  .action(async (options) => {
    try {
      const { createSendCommand } = require('../dist/cjs/cli/commands/send.js');
      const sendCmd = createSendCommand();
      await sendCmd.parseAsync(process.argv.slice(2));
    } catch (error) {
      console.error('Send command failed:', error.message);
      process.exit(1);
    }
  });

// Bulk command
program
  .command('bulk')
  .description('Send bulk push notifications from file')
  .requiredOption('-p, --provider <provider>', 'Provider (fcm, expo, webpush)')
  .requiredOption('-f, --file <path>', 'Path to JSON file with messages')
  .option('--title <title>', 'Default title for all messages')
  .option('--body <body>', 'Default body for all messages')
  .option('--data <json>', 'Default data for all messages')
  .option('-c, --config <path>', 'Path to config file')
  .action(async (options) => {
    try {
      const { createBulkCommand } = require('../dist/cjs/cli/commands/bulk.js');
      const bulkCmd = createBulkCommand();
      await bulkCmd.parseAsync(process.argv.slice(2));
    } catch (error) {
      console.error('Bulk command failed:', error.message);
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
