#!/usr/bin/env node

/**
 * Add .js extensions to all TypeScript imports for ESM compatibility
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const srcDir = join(__dirname, '../src');

// Find all TypeScript files
const files = glob.sync('**/*.ts', { cwd: srcDir, absolute: true });

let totalFixed = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let modified = false;

  // Replace relative imports without .js extension
  // Match: from './path' or from '../path' or from './path/file'
  // Don't match if already has .js
  content = content.replace(
    /from\s+['"](\.\.[\/\\][\w\/\\-]+|\.\/[\w\/\\-]+)(?<!\.js)['"]/g,
    (match, path) => {
      modified = true;
      return `from '${path}.js'`;
    }
  );

  if (modified) {
    writeFileSync(file, content, 'utf-8');
    console.log(`✓ Fixed: ${file.replace(srcDir, 'src')}`);
    totalFixed++;
  }
}

console.log(`\n✅ Fixed ${totalFixed} files`);
