/**
 * Email Adapter Interface
 */

import type { EmailMessage, EmailSendResult } from '../../types/email.types.js';

export interface IEmailAdapter {
  /**
   * Send a single email
   */
  send(message: EmailMessage): Promise<EmailSendResult>;

  /**
   * Send bulk emails
   */
  sendBulk(messages: EmailMessage[]): Promise<EmailSendResult[]>;

  /**
   * Send templated email
   */
  sendTemplate?(
    templateId: string,
    data: Record<string, unknown>,
    to: string | string[]
  ): Promise<EmailSendResult>;

  /**
   * Close adapter and cleanup resources
   */
  close(): Promise<void>;
}
