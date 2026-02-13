/**
 * SMTP Email Adapter
 * Email sending using SMTP (nodemailer)
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { IEmailAdapter } from './IEmailAdapter.js';
import type { EmailMessage, EmailSendResult, SMTPConfig } from '../../types/email.types.js';

export class SMTPAdapter implements IEmailAdapter {
  private transporter: Transporter;

  constructor(config: SMTPConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure ?? config.port === 465,
      auth: config.auth,
      tls: config.tls,
    });
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    try {
      const result = await this.transporter.sendMail({
        from: message.from,
        to: message.to,
        cc: message.cc,
        bcc: message.bcc,
        subject: message.subject,
        text: message.text,
        html: message.html,
        replyTo: message.replyTo,
        headers: message.headers,
        attachments: message.attachments,
      });

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  async sendBulk(messages: EmailMessage[]): Promise<EmailSendResult[]> {
    // Send all messages in parallel
    return Promise.all(messages.map((msg) => this.send(msg)));
  }

  async sendTemplate(
    _templateId: string,
    _data: Record<string, unknown>,
    _to: string | string[]
  ): Promise<EmailSendResult> {
    // Template support would need external template engine
    throw new Error('Template support not yet implemented for SMTP adapter');
  }

  async close(): Promise<void> {
    this.transporter.close();
  }

  /**
   * Verify SMTP connection
   */
  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}
