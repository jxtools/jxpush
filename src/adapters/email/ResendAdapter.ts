/**
 * Resend Email Adapter
 * Email sending using Resend API
 */

import { Resend } from 'resend';
import type { IEmailAdapter } from './IEmailAdapter.js';
import type { EmailMessage, EmailSendResult, ResendConfig } from '../../types/email.types.js';

export class ResendAdapter implements IEmailAdapter {
  private client: Resend;

  constructor(config: ResendConfig) {
    this.client = new Resend(config.apiKey);
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    try {
      const result = await this.client.emails.send({
        from: message.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        cc: message.cc,
        bcc: message.bcc,
        replyTo: message.replyTo,
        headers: message.headers,
        attachments: message.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
        })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  async sendBulk(messages: EmailMessage[]): Promise<EmailSendResult[]> {
    // Resend doesn't have native bulk API, send in parallel
    return Promise.all(messages.map((msg) => this.send(msg)));
  }

  async sendTemplate(
    _templateId: string,
    _data: Record<string, unknown>,
    _to: string | string[]
  ): Promise<EmailSendResult> {
    // Resend doesn't have built-in template support
    // This would need to be implemented with external template engine
    throw new Error('Template support not yet implemented for Resend adapter');
  }

  async close(): Promise<void> {
    // No cleanup needed for Resend
  }
}
