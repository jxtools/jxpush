/**
 * Base error class for jxpush
 */

export enum ErrorCode {
  // Configuration errors
  INVALID_CONFIG = 'INVALID_CONFIG',
  MISSING_PROVIDER = 'MISSING_PROVIDER',
  INVALID_PROVIDER = 'INVALID_PROVIDER',

  // Validation errors
  INVALID_TOKEN = 'INVALID_TOKEN',
  INVALID_MESSAGE = 'INVALID_MESSAGE',
  INVALID_PAYLOAD = 'INVALID_PAYLOAD',

  // Provider errors
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  PROVIDER_INIT_FAILED = 'PROVIDER_INIT_FAILED',
  SEND_FAILED = 'SEND_FAILED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',

  // Rate limiting errors
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Queue errors
  QUEUE_FULL = 'QUEUE_FULL',
  QUEUE_ERROR = 'QUEUE_ERROR',

  // Retry errors
  MAX_RETRIES_EXCEEDED = 'MAX_RETRIES_EXCEEDED',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',

  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Base error class for all jxpush errors
 */
export class PushError extends Error {
  public readonly code: ErrorCode;
  public readonly retryable: boolean;
  public readonly originalError?: Error;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    retryable = false,
    originalError?: Error
  ) {
    super(message);
    this.name = 'PushError';
    this.code = code;
    this.retryable = retryable;
    this.originalError = originalError;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PushError);
    }
  }

  /**
   * Check if an error is retryable
   */
  static isRetryable(error: Error | PushError): boolean {
    if (error instanceof PushError) {
      return error.retryable;
    }

    // Check for common retryable error patterns
    const retryablePatterns = [
      /timeout/i,
      /ETIMEDOUT/i,
      /ECONNRESET/i,
      /ENOTFOUND/i,
      /ECONNREFUSED/i,
      /503/,
      /502/,
      /429/, // Rate limit
      /500/, // Internal server error
    ];

    const errorMessage = error.message || '';
    return retryablePatterns.some((pattern) => pattern.test(errorMessage));
  }

  /**
   * Convert any error to PushError
   */
  static from(error: unknown, code?: ErrorCode): PushError {
    if (error instanceof PushError) {
      return error;
    }

    if (error instanceof Error) {
      const isRetryable = PushError.isRetryable(error);
      return new PushError(
        error.message,
        code || ErrorCode.UNKNOWN_ERROR,
        isRetryable,
        error
      );
    }

    return new PushError(
      String(error),
      code || ErrorCode.UNKNOWN_ERROR,
      false
    );
  }

  /**
   * Serialize error to JSON
   */
  toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      retryable: this.retryable,
      timestamp: this.timestamp.toISOString(),
      originalError: this.originalError
        ? {
            name: this.originalError.name,
            message: this.originalError.message,
          }
        : undefined,
    };
  }
}
