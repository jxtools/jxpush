/**
 * Internal logging utility
 */

import { LogLevel } from '../types/config.types';

/**
 * Logger class for internal logging
 */
export class Logger {
  private level: LogLevel;
  private prefix: string;

  constructor(level: LogLevel = LogLevel.WARN, prefix = '[jxpush]') {
    this.level = level;
    this.prefix = prefix;
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.level;
  }

  /**
   * Log debug message
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`${this.prefix} [DEBUG]`, message, ...args);
    }
  }

  /**
   * Log info message
   */
  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`${this.prefix} [INFO]`, message, ...args);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`${this.prefix} [WARN]`, message, ...args);
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      if (error) {
        console.error(`${this.prefix} [ERROR]`, message, error, ...args);
      } else {
        console.error(`${this.prefix} [ERROR]`, message, ...args);
      }
    }
  }

  /**
   * Check if message should be logged based on current level
   */
  private shouldLog(messageLevel: LogLevel): boolean {
    if (this.level === LogLevel.NONE) {
      return false;
    }

    const levels = [LogLevel.NONE, LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(messageLevel);

    return messageLevelIndex <= currentLevelIndex;
  }
}

/**
 * Create a logger instance
 */
export function createLogger(level: LogLevel = LogLevel.WARN, prefix?: string): Logger {
  return new Logger(level, prefix);
}
