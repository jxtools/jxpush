/**
 * Token validation utilities
 */

import { ProviderType } from '../types/config.types';

/**
 * Validate FCM token format
 * FCM tokens are typically 152-163 characters long and alphanumeric with some special chars
 */
export function validateFCMToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // FCM tokens should be between 140-200 characters
  if (token.length < 140 || token.length > 200) {
    return false;
  }

  // FCM tokens contain alphanumeric characters, hyphens, underscores, and colons
  const fcmTokenPattern = /^[a-zA-Z0-9_:-]+$/;
  return fcmTokenPattern.test(token);
}

/**
 * Validate Expo push token format
 * Expo tokens start with ExponentPushToken[...]
 */
export function validateExpoToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // Expo tokens follow the format: ExponentPushToken[XXXX...]
  const expoTokenPattern = /^ExponentPushToken\[[a-zA-Z0-9_-]+\]$/;
  return expoTokenPattern.test(token);
}

/**
 * Validate token based on provider type
 */
export function validateToken(token: string, provider: ProviderType): boolean {
  switch (provider) {
    case ProviderType.FCM:
      return validateFCMToken(token);
    case ProviderType.EXPO:
      return validateExpoToken(token);
    default:
      return false;
  }
}

/**
 * Validate an array of tokens
 */
export function validateTokens(
  tokens: string[],
  provider: ProviderType
): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const token of tokens) {
    if (validateToken(token, provider)) {
      valid.push(token);
    } else {
      invalid.push(token);
    }
  }

  return { valid, invalid };
}
