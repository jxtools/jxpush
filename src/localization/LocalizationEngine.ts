/**
 * Localization Engine
 * Multi-language support with fallback mechanism
 */

import type { LocaleData, LocalizationConfig } from '../types/localization.types.js';

export class LocalizationEngine {
  private config: LocalizationConfig;
  private locales: Map<string, LocaleData> = new Map();

  constructor(config: LocalizationConfig = {}) {
    this.config = {
      defaultLocale: 'en',
      fallbackLocale: 'en',
      supportedLocales: ['en'],
      ...config,
    };
  }

  /**
   * Register a locale
   */
  registerLocale(localeCode: string, data: LocaleData): void {
    this.locales.set(localeCode, data);
  }

  /**
   * Translate a key
   */
  translate(key: string, locale?: string, variables?: Record<string, unknown>): string {
    const targetLocale = locale || this.config.defaultLocale!;

    // Try target locale
    let translation = this.getTranslation(key, targetLocale);

    // Try fallback locale if not found
    if (!translation && targetLocale !== this.config.fallbackLocale) {
      translation = this.getTranslation(key, this.config.fallbackLocale!);
    }

    // Return key if no translation found
    if (!translation) {
      return key;
    }

    // Replace variables
    if (variables) {
      return this.replaceVariables(translation, variables);
    }

    return translation;
  }

  /**
   * Translate multiple keys
   */
  translateBatch(
    keys: string[],
    locale?: string,
    variables?: Record<string, unknown>
  ): Record<string, string> {
    const result: Record<string, string> = {};

    for (const key of keys) {
      result[key] = this.translate(key, locale, variables);
    }

    return result;
  }

  /**
   * Check if locale is supported
   */
  isLocaleSupported(locale: string): boolean {
    return this.locales.has(locale);
  }

  /**
   * Get all supported locales
   */
  getSupportedLocales(): string[] {
    return Array.from(this.locales.keys());
  }

  /**
   * Get locale data
   */
  getLocaleData(locale: string): LocaleData | undefined {
    return this.locales.get(locale);
  }

  /**
   * Clear all locales
   */
  clearLocales(): void {
    this.locales.clear();
  }

  /**
   * Get translation for a key in a specific locale
   */
  private getTranslation(key: string, locale: string): string | null {
    const localeData = this.locales.get(locale);

    if (!localeData) {
      return null;
    }

    // Support nested keys (e.g., "messages.welcome")
    const keys = key.split('.');
    let current: unknown = localeData;

    for (const k of keys) {
      if (typeof current === 'object' && current !== null && k in current) {
        current = (current as Record<string, unknown>)[k];
      } else {
        return null;
      }
    }

    return typeof current === 'string' ? current : null;
  }

  /**
   * Replace variables in translation
   */
  private replaceVariables(translation: string, variables: Record<string, unknown>): string {
    let result = translation;

    for (const [key, value] of Object.entries(variables)) {
      // Support {{variable}} and {variable} syntax
      result = result.replace(new RegExp(`{{${key}}}|{${key}}`, 'g'), String(value));
    }

    return result;
  }

  /**
   * Format number according to locale
   */
  formatNumber(value: number, locale?: string): string {
    const targetLocale = locale || this.config.defaultLocale!;
    return new Intl.NumberFormat(targetLocale).format(value);
  }

  /**
   * Format date according to locale
   */
  formatDate(date: Date, locale?: string, options?: Intl.DateTimeFormatOptions): string {
    const targetLocale = locale || this.config.defaultLocale!;
    return new Intl.DateTimeFormat(targetLocale, options).format(date);
  }

  /**
   * Format currency according to locale
   */
  formatCurrency(value: number, currency: string, locale?: string): string {
    const targetLocale = locale || this.config.defaultLocale!;
    return new Intl.NumberFormat(targetLocale, {
      style: 'currency',
      currency,
    }).format(value);
  }
}
