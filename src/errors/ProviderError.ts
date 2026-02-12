/**
 * Provider-specific error class
 */

import { PushError, ErrorCode } from './PushError.js';
import { ProviderType } from '../types/config.types.js';

/**
 * Provider error with provider context
 */
export class ProviderError extends PushError {
  public readonly provider: ProviderType;
  public readonly providerErrorCode?: string;

  constructor(
    message: string,
    provider: ProviderType,
    code: ErrorCode = ErrorCode.PROVIDER_ERROR,
    retryable = false,
    providerErrorCode?: string,
    originalError?: Error
  ) {
    super(message, code, retryable, originalError);
    this.name = 'ProviderError';
    this.provider = provider;
    this.providerErrorCode = providerErrorCode;
  }

  /**
   * Create provider error from provider response
   */
  static fromProviderError(
    error: Error,
    provider: ProviderType,
    providerErrorCode?: string
  ): ProviderError {
    const isRetryable = PushError.isRetryable(error);
    return new ProviderError(
      error.message,
      provider,
      ErrorCode.PROVIDER_ERROR,
      isRetryable,
      providerErrorCode,
      error
    );
  }

  /**
   * Serialize to JSON
   */
  toJSON(): object {
    return {
      ...super.toJSON(),
      provider: this.provider,
      providerErrorCode: this.providerErrorCode,
    };
  }
}
