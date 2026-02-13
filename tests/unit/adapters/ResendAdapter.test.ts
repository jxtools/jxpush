/**
 * Unit tests for ResendAdapter
 */

import { ResendAdapter } from '../../../src/adapters/email/ResendAdapter';
import type { EmailMessage } from '../../../src/types/email.types';
import { Resend } from 'resend';

// Mock resend
jest.mock('resend');

describe('ResendAdapter', () => {
  let adapter: ResendAdapter;
  let mockSend: jest.Mock;

  beforeEach(() => {
    mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });

    (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
      emails: {
        send: mockSend,
      },
    } as any));

    adapter = new ResendAdapter({
      apiKey: 'test-api-key',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('send', () => {
    it('should send email successfully', async () => {
      const message: EmailMessage = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Hello World</p>',
      };

      const result = await adapter.send(message);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('email-123');
    });

    it('should send email with attachments', async () => {
      const message: EmailMessage = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Email',
        text: 'Hello',
        attachments: [
          {
            filename: 'test.pdf',
            content: Buffer.from('test content'),
          },
        ],
      };

      await adapter.send(message);

      expect(mockSend).toHaveBeenCalled();
    });

    it('should handle send errors', async () => {
      mockSend.mockRejectedValue(new Error('API Error'));

      const message: EmailMessage = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Email',
        text: 'Hello',
      };

      const result = await adapter.send(message);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('sendBulk', () => {
    it('should send multiple emails', async () => {
      const messages: EmailMessage[] = [
        {
          from: 'sender@example.com',
          to: 'recipient1@example.com',
          subject: 'Email 1',
          text: 'Hello 1',
        },
        {
          from: 'sender@example.com',
          to: 'recipient2@example.com',
          subject: 'Email 2',
          text: 'Hello 2',
        },
      ];

      const results = await adapter.sendBulk(messages);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(2);
    });
  });
});
