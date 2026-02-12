/**
 * Validation error class
 */

import { PushError, ErrorCode } from './PushError';

/**
 * Validation error with field-level details
 */
export class ValidationError extends PushError {
  public readonly field?: string;
  public readonly validationErrors: string[];

  constructor(message: string, validationErrors: string[] = [], field?: string) {
    super(message, ErrorCode.INVALID_PAYLOAD, false);
    this.name = 'ValidationError';
    this.field = field;
    this.validationErrors = validationErrors;
  }

  /**
   * Create validation error from field errors
   */
  static fromErrors(errors: string[], field?: string): ValidationError {
    const message = field
      ? `Validation failed for field '${field}': ${errors.join(', ')}`
      : `Validation failed: ${errors.join(', ')}`;

    return new ValidationError(message, errors, field);
  }

  /**
   * Serialize to JSON
   */
  toJSON(): object {
    return {
      ...super.toJSON(),
      field: this.field,
      validationErrors: this.validationErrors,
    };
  }
}
