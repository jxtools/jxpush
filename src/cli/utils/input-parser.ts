/**
 * CLI Utilities - Input Parser
 * Parse and validate JSON input from files or command-line arguments
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Formatter } from './formatter.js';

export class InputParser {
  /**
   * Parse JSON string
   */
  static parseJSON<T = unknown>(jsonString: string): T {
    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Read and parse JSON file
   */
  static readJSONFile<T = unknown>(filePath: string): T {
    try {
      const absolutePath = resolve(process.cwd(), filePath);
      const content = readFileSync(absolutePath, 'utf-8');
      return this.parseJSON<T>(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      }
      throw error;
    }
  }

  /**
   * Parse data argument (JSON string or object)
   */
  static parseDataArgument(data?: string): Record<string, unknown> | undefined {
    if (!data) return undefined;

    try {
      return this.parseJSON<Record<string, unknown>>(data);
    } catch (error) {
      console.error(
        Formatter.error(
          `Failed to parse data argument: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      );
      process.exit(1);
    }
  }

  /**
   * Validate required fields
   */
  static validateRequired(options: Record<string, unknown>, requiredFields: string[]): void {
    const missing = requiredFields.filter((field) => !options[field]);

    if (missing.length > 0) {
      console.error(Formatter.error(`Missing required fields: ${missing.join(', ')}`));
      process.exit(1);
    }
  }

  /**
   * Parse tokens from file or array
   */
  static parseTokens(input: string | string[]): string[] {
    if (Array.isArray(input)) {
      return input;
    }

    // If it's a file path
    if (input.endsWith('.json') || input.endsWith('.txt')) {
      const data = this.readJSONFile<string[] | { tokens: string[] }>(input);

      if (Array.isArray(data)) {
        return data;
      }

      if (data && typeof data === 'object' && 'tokens' in data) {
        return data.tokens;
      }

      throw new Error(
        'Invalid tokens file format. Expected array of strings or object with "tokens" property.'
      );
    }

    // Try to parse as JSON array
    try {
      const parsed = this.parseJSON<string[]>(input);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Not JSON, treat as single token
    }

    return [input];
  }

  /**
   * Parse environment variables
   */
  static getEnvVar(name: string, defaultValue?: string): string | undefined {
    return process.env[name] || defaultValue;
  }

  /**
   * Parse boolean argument
   */
  static parseBoolean(value: string | boolean | undefined): boolean {
    if (typeof value === 'boolean') return value;
    if (!value) return false;

    const normalized = value.toString().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }

  /**
   * Parse number argument
   */
  static parseNumber(value: string | number | undefined, defaultValue: number): number {
    if (typeof value === 'number') return value;
    if (!value) return defaultValue;

    const parsed = parseInt(value.toString(), 10);
    if (isNaN(parsed)) {
      throw new Error(`Invalid number: ${value}`);
    }

    return parsed;
  }
}
