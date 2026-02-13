/**
 * Template Engine
 * Handlebars-based template rendering with caching
 */

import Handlebars from 'handlebars';
import type {
  Template,
  TemplateData,
  TemplateConfig,
  RenderedTemplate,
} from '../types/template.types.js';

export class TemplateEngine {
  private config: TemplateConfig;
  private templates: Map<string, Handlebars.TemplateDelegate> = new Map();
  private rawTemplates: Map<string, Template> = new Map();

  constructor(config: TemplateConfig = {}) {
    this.config = {
      defaultLocale: 'en',
      cacheTemplates: true,
      ...config,
    };

    // Register common helpers
    this.registerHelpers();
  }

  /**
   * Register a template
   */
  registerTemplate(template: Template): void {
    const key = this.getTemplateKey(template.id, template.locale || this.config.defaultLocale);

    // Compile template
    const compiled = Handlebars.compile(template.content);

    if (this.config.cacheTemplates) {
      this.templates.set(key, compiled);
      this.rawTemplates.set(key, template);
    }
  }

  /**
   * Render a template
   */
  render(templateId: string, data: TemplateData, locale?: string): RenderedTemplate {
    const key = this.getTemplateKey(templateId, locale || this.config.defaultLocale);

    let compiled = this.templates.get(key);

    if (!compiled) {
      // Try default locale if specific locale not found
      if (locale && locale !== this.config.defaultLocale) {
        const defaultKey = this.getTemplateKey(templateId, this.config.defaultLocale);
        compiled = this.templates.get(defaultKey);
      }

      if (!compiled) {
        throw new Error(
          `Template not found: ${templateId} (locale: ${locale || this.config.defaultLocale})`
        );
      }
    }

    const rendered = compiled(data);

    // Parse rendered content (assuming JSON format)
    try {
      return JSON.parse(rendered) as RenderedTemplate;
    } catch {
      // If not JSON, return as body
      return { body: rendered };
    }
  }

  /**
   * Render template string directly
   */
  renderString(templateString: string, data: TemplateData): string {
    const compiled = Handlebars.compile(templateString);
    return compiled(data);
  }

  /**
   * Check if template exists
   */
  hasTemplate(templateId: string, locale?: string): boolean {
    const key = this.getTemplateKey(templateId, locale || this.config.defaultLocale);
    return this.rawTemplates.has(key);
  }

  /**
   * Get all registered templates
   */
  getTemplates(): Template[] {
    return Array.from(this.rawTemplates.values());
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.templates.clear();
    // Note: rawTemplates are kept so templates remain registered
  }

  /**
   * Register custom helper
   */
  registerHelper(name: string, helper: Handlebars.HelperDelegate): void {
    Handlebars.registerHelper(name, helper);
  }

  /**
   * Register common helpers
   */
  private registerHelpers(): void {
    // Uppercase helper
    Handlebars.registerHelper('uppercase', (str: string) => {
      return str ? str.toUpperCase() : '';
    });

    // Lowercase helper
    Handlebars.registerHelper('lowercase', (str: string) => {
      return str ? str.toLowerCase() : '';
    });

    // Capitalize helper
    Handlebars.registerHelper('capitalize', (str: string) => {
      return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
    });

    // Date format helper
    Handlebars.registerHelper('dateFormat', (date: Date | string) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      // Simple date formatting (could be enhanced with date-fns or similar)
      return d.toLocaleDateString();
    });

    // JSON stringify helper
    Handlebars.registerHelper('json', (obj: unknown) => {
      return JSON.stringify(obj);
    });

    // Conditional helpers
    Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
    Handlebars.registerHelper('ne', (a: unknown, b: unknown) => a !== b);
    Handlebars.registerHelper('gt', (a: number, b: number) => a > b);
    Handlebars.registerHelper('lt', (a: number, b: number) => a < b);
  }

  /**
   * Get template cache key
   */
  private getTemplateKey(templateId: string, locale?: string): string {
    return locale ? `${templateId}:${locale}` : templateId;
  }
}
