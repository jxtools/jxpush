/**
 * Message validation utilities
 */

import { PushMessage } from '../types/message.types.js';
import { ValidationError } from '../errors/ValidationError.js';

/**
 * Validate push message structure
 */
export function validateMessage(message: PushMessage): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Must have either token or topic
  if (!message.token && !message.topic) {
    errors.push('Message must have either token or topic');
  }

  // Cannot have both token and topic
  if (message.token && message.topic) {
    errors.push('Message cannot have both token and topic');
  }

  // Validate token if present
  if (message.token) {
    if (Array.isArray(message.token)) {
      if (message.token.length === 0) {
        errors.push('Token array cannot be empty');
      }
      // Individual token validation will be done by provider
    } else if (typeof message.token !== 'string' || message.token.trim() === '') {
      errors.push('Token must be a non-empty string or array of strings');
    }
  }

  // Validate topic if present
  if (message.topic) {
    if (typeof message.topic !== 'string' || message.topic.trim() === '') {
      errors.push('Topic must be a non-empty string');
    }
  }

  // Validate notification payload if present
  if (message.notification) {
    if (!message.notification.title && !message.notification.body) {
      errors.push('Notification must have at least title or body');
    }

    if (message.notification.title && typeof message.notification.title !== 'string') {
      errors.push('Notification title must be a string');
    }

    if (message.notification.body && typeof message.notification.body !== 'string') {
      errors.push('Notification body must be a string');
    }

    if (message.notification.badge !== undefined) {
      if (typeof message.notification.badge !== 'number' || message.notification.badge < 0) {
        errors.push('Badge must be a non-negative number');
      }
    }
  }

  // Validate data payload if present
  if (message.data) {
    if (typeof message.data !== 'object' || Array.isArray(message.data)) {
      errors.push('Data must be an object');
    } else {
      // All values must be strings for FCM compatibility
      for (const [key, value] of Object.entries(message.data)) {
        if (typeof value !== 'string') {
          errors.push(`Data value for key '${key}' must be a string, got ${typeof value}`);
        }
      }
    }
  }

  // Validate TTL if present
  if (message.ttl !== undefined) {
    if (typeof message.ttl !== 'number' || message.ttl < 0) {
      errors.push('TTL must be a non-negative number');
    }
  }

  // Must have either notification or data
  if (!message.notification && !message.data && !message.contentAvailable) {
    errors.push('Message must have notification, data, or contentAvailable flag');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate message and throw if invalid
 */
export function validateMessageOrThrow(message: PushMessage): void {
  const result = validateMessage(message);
  if (!result.valid) {
    throw ValidationError.fromErrors(result.errors);
  }
}

/**
 * Validate batch size
 */
export function validateBatchSize(size: number, maxSize: number): void {
  if (size <= 0) {
    throw new ValidationError('Batch size must be greater than 0', ['Invalid batch size']);
  }

  if (size > maxSize) {
    throw new ValidationError(`Batch size ${size} exceeds maximum ${maxSize}`, [
      `Batch size exceeds maximum of ${maxSize}`,
    ]);
  }
}
