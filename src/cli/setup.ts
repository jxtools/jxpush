#!/usr/bin/env node
/**
 * jxpush Setup Wizard
 * Interactive CLI for configuring jxpush with only needed dependencies
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

interface SetupAnswers {
  providers: string[];
  queueBackend: string;
  features: string[];
  projectName: string;
  language: 'typescript' | 'javascript';
  packageManager: 'npm' | 'yarn' | 'pnpm';
}

const PROVIDER_DEPS: Record<string, string> = {
  fcm: 'firebase-admin@^12.0.0',
  expo: 'expo-server-sdk@^5.0.0',
  apns: '@parse/node-apn@^6.0.0',
  webpush: 'web-push@^3.6.7',
  email: 'nodemailer@^8.0.1 resend@^6.9.2',
};

const QUEUE_DEPS: Record<string, string> = {
  redis: 'ioredis@^5.9.3',
  bullmq: 'bullmq@^5.69.0 ioredis@^5.9.3',
  rabbitmq: 'amqplib@^0.10.9',
  kafka: 'kafkajs@^2.2.4',
};

const FEATURE_DEPS: Record<string, string> = {
  templates: 'handlebars@^4.7.8',
};

async function runSetup() {
  console.log(chalk.cyan.bold('\n🚀 Welcome to jxpush Setup Wizard\n'));

  const answers = await inquirer.prompt<SetupAnswers>([
    {
      type: 'checkbox',
      name: 'providers',
      message: 'Select push notification providers:',
      choices: [
        { name: 'FCM (Firebase Cloud Messaging)', value: 'fcm' },
        { name: 'Expo Push Notifications', value: 'expo' },
        { name: 'APNs (Apple Push Notification service)', value: 'apns' },
        { name: 'Web Push (VAPID)', value: 'webpush' },
        { name: 'Email (SMTP/Resend)', value: 'email' },
      ],
      validate: (input) => input.length > 0 || 'Select at least one provider',
    },
    {
      type: 'list',
      name: 'queueBackend',
      message: 'Select queue backend:',
      choices: [
        { name: 'In-Memory (no dependencies)', value: 'memory' },
        { name: 'Redis', value: 'redis' },
        { name: 'BullMQ (Redis-based)', value: 'bullmq' },
        { name: 'RabbitMQ', value: 'rabbitmq' },
        { name: 'Kafka', value: 'kafka' },
      ],
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select optional features:',
      choices: [
        { name: 'Template Engine (Handlebars)', value: 'templates' },
        { name: 'Localization', value: 'localization' },
        { name: 'Analytics Hooks', value: 'analytics' },
        { name: 'CLI Send Commands', value: 'cli' },
      ],
    },
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: 'my-push-service',
    },
    {
      type: 'list',
      name: 'language',
      message: 'TypeScript or JavaScript?',
      choices: ['typescript', 'javascript'],
      default: 'typescript',
    },
    {
      type: 'list',
      name: 'packageManager',
      message: 'Package manager:',
      choices: ['npm', 'yarn', 'pnpm'],
      default: 'npm',
    },
  ]);

  // Calculate dependencies
  const depsToInstall: string[] = [];

  answers.providers.forEach((provider) => {
    if (PROVIDER_DEPS[provider]) {
      depsToInstall.push(...PROVIDER_DEPS[provider].split(' '));
    }
  });

  if (answers.queueBackend !== 'memory' && QUEUE_DEPS[answers.queueBackend]) {
    depsToInstall.push(...QUEUE_DEPS[answers.queueBackend].split(' '));
  }

  answers.features.forEach((feature) => {
    if (FEATURE_DEPS[feature]) {
      depsToInstall.push(...FEATURE_DEPS[feature].split(' '));
    }
  });

  // Install dependencies
  if (depsToInstall.length > 0) {
    console.log(chalk.cyan('\n📦 Installing dependencies...\n'));
    const installCmd = getInstallCommand(answers.packageManager, depsToInstall);
    console.log(chalk.gray(`  $ ${installCmd}\n`));

    try {
      execSync(installCmd, { stdio: 'inherit' });
      console.log(chalk.green('\n✓ Dependencies installed\n'));
    } catch (error) {
      console.error(chalk.red('\n✗ Failed to install dependencies\n'));
      process.exit(1);
    }
  }

  // Generate files
  console.log(chalk.cyan('📝 Generating configuration...\n'));

  const projectDir = process.cwd();
  const srcDir = path.join(projectDir, 'src');
  const pushDir = path.join(srcDir, 'push');

  // Create directories
  [srcDir, pushDir].forEach((dir) => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  });

  // Generate config file
  const configContent = generateConfig(answers);
  const configExt = answers.language === 'typescript' ? 'ts' : 'js';
  writeFileSync(path.join(projectDir, `jxpush.config.${configExt}`), configContent);
  console.log(chalk.green(`  ✓ jxpush.config.${configExt}`));

  // Generate provider setup
  const providerContent = generateProviderSetup(answers);
  writeFileSync(path.join(pushDir, `providers.${configExt}`), providerContent);
  console.log(chalk.green(`  ✓ src/push/providers.${configExt}`));

  // Generate queue setup
  const queueContent = generateQueueSetup(answers);
  writeFileSync(path.join(pushDir, `queue.${configExt}`), queueContent);
  console.log(chalk.green(`  ✓ src/push/queue.${configExt}`));

  // Generate example
  const exampleDir = path.join(projectDir, 'examples');
  if (!existsSync(exampleDir)) {
    mkdirSync(exampleDir, { recursive: true });
  }
  const exampleContent = generateExample(answers);
  writeFileSync(path.join(exampleDir, `send-notification.${configExt}`), exampleContent);
  console.log(chalk.green(`  ✓ examples/send-notification.${configExt}`));

  // Print next steps
  console.log(chalk.green.bold('\n✅ Setup complete!\n'));
  console.log(chalk.cyan('Next steps:\n'));

  if (answers.providers.includes('fcm')) {
    console.log(chalk.yellow('  1. Configure FCM credentials in jxpush.config.ts'));
    console.log(chalk.gray('     - Download service account JSON from Firebase Console'));
    console.log(chalk.gray('     - Set serviceAccountPath in config\n'));
  }

  if (answers.queueBackend === 'redis' || answers.queueBackend === 'bullmq') {
    console.log(chalk.yellow('  2. Start Redis:'));
    console.log(chalk.gray('     $ docker run -d -p 6379:6379 redis\n'));
  }

  if (answers.queueBackend === 'rabbitmq') {
    console.log(chalk.yellow('  2. Start RabbitMQ:'));
    console.log(chalk.gray('     $ docker run -d -p 5672:5672 rabbitmq\n'));
  }

  if (answers.queueBackend === 'kafka') {
    console.log(chalk.yellow('  2. Start Kafka:'));
    console.log(chalk.gray('     $ docker-compose up -d kafka\n'));
  }

  console.log(chalk.yellow('  3. Run example:'));
  console.log(chalk.gray(`     $ ${answers.language === 'typescript' ? 'ts-node' : 'node'} examples/send-notification.${configExt}\n`));
}

function getInstallCommand(pm: string, deps: string[]): string {
  const depsStr = deps.join(' ');
  switch (pm) {
    case 'yarn':
      return `yarn add ${depsStr}`;
    case 'pnpm':
      return `pnpm add ${depsStr}`;
    default:
      return `npm install ${depsStr}`;
  }
}

function generateConfig(answers: SetupAnswers): string {
  const isTS = answers.language === 'typescript';
  const imports = isTS ? "import { defineConfig } from 'jxpush';\n\n" : '';
  const exportPrefix = isTS ? 'export default ' : 'module.exports = ';

  const providerConfigs: string[] = [];

  if (answers.providers.includes('fcm')) {
    providerConfigs.push(`    fcm: {
      serviceAccountPath: './firebase-admin.json',
    }`);
  }

  if (answers.providers.includes('expo')) {
    providerConfigs.push(`    expo: {
      accessToken: process.env.EXPO_ACCESS_TOKEN,
    }`);
  }

  if (answers.providers.includes('webpush')) {
    providerConfigs.push(`    webpush: {
      vapidKeys: {
        publicKey: process.env.VAPID_PUBLIC_KEY,
        privateKey: process.env.VAPID_PRIVATE_KEY,
      },
    }`);
  }

  const queueConfig =
    answers.queueBackend === 'memory'
      ? `    adapter: 'memory',`
      : `    adapter: '${answers.queueBackend}',
    ${answers.queueBackend}: {
      host: 'localhost',
      port: ${answers.queueBackend === 'redis' || answers.queueBackend === 'bullmq' ? 6379 : answers.queueBackend === 'rabbitmq' ? 5672 : 9092},
    },`;

  return `${imports}${exportPrefix}${isTS ? 'defineConfig' : ''}({
  providers: {
${providerConfigs.join(',\n')}
  },
  queue: {
${queueConfig}
  },
  features: {
    templates: ${answers.features.includes('templates')},
    localization: ${answers.features.includes('localization')},
    analytics: ${answers.features.includes('analytics')},
  },
});
`;
}

function generateProviderSetup(answers: SetupAnswers): string {
  const isTS = answers.language === 'typescript';
  const imports = answers.providers
    .map((p) => {
      const className = p.charAt(0).toUpperCase() + p.slice(1) + 'Provider';
      return `import { ${className} } from 'jxpush';`;
    })
    .join('\n');

  return `${imports}
import config from '../jxpush.config${isTS ? '' : '.js'}';

// Initialize providers based on config
export const providers = {
${answers.providers.map((p) => `  ${p}: new ${p.charAt(0).toUpperCase() + p.slice(1)}Provider(config.providers.${p}),`).join('\n')}
};
`;
}

function generateQueueSetup(answers: SetupAnswers): string {
  const isTS = answers.language === 'typescript';
  const adapterName =
    answers.queueBackend === 'memory'
      ? 'InMemoryQueue'
      : answers.queueBackend.charAt(0).toUpperCase() +
        answers.queueBackend.slice(1) +
        'Adapter';

  return `import { ${adapterName} } from 'jxpush';
import config from '../jxpush.config${isTS ? '' : '.js'}';

export const queue = new ${adapterName}(config.queue.${answers.queueBackend} || {});
`;
}

function generateExample(answers: SetupAnswers): string {
  const isTS = answers.language === 'typescript';

  return `import { PushClient } from 'jxpush';
import config from './jxpush.config${isTS ? '' : '.js'}';

async function sendNotification() {
  const client = new PushClient(config);
  await client.initialize();

  const result = await client.send({
    token: 'YOUR_DEVICE_TOKEN',
    notification: {
      title: 'Hello from jxpush!',
      body: 'Your first notification',
    },
  });

  console.log('Result:', result);
  await client.shutdown();
}

sendNotification().catch(console.error);
`;
}

// Run setup
runSetup().catch((error) => {
  console.error(chalk.red('\n✗ Setup failed:'), error);
  process.exit(1);
});
