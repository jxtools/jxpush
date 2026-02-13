/**
 * Config Helper
 * Provides defineConfig helper for type-safe configuration
 */

import type { PushClientConfig } from './types/config.types.js';

export function defineConfig(config: PushClientConfig): PushClientConfig {
  return config;
}
