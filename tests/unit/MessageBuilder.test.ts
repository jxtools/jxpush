/**
 * Simple unit test example for jxpush
 */

import { MessageBuilder } from '../src/builder/MessageBuilder';
import { MessagePriority } from '../src/types/message.types';

describe('MessageBuilder', () => {
  it('should build a valid message', () => {
    const builder = new MessageBuilder();
    const message = builder
      .token('test-token')
      .title('Test Title')
      .body('Test Body')
      .priority(MessagePriority.HIGH)
      .build();

    expect(message.token).toBe('test-token');
    expect(message.notification?.title).toBe('Test Title');
    expect(message.notification?.body).toBe('Test Body');
    expect(message.priority).toBe(MessagePriority.HIGH);
  });

  it('should validate message on build', () => {
    const builder = new MessageBuilder();
    builder.title('Title Only');

    expect(() => builder.build()).toThrow();
  });

  it('should support fluent API', () => {
    const builder = new MessageBuilder();
    const result = builder.token('test').title('Title');

    expect(result).toBe(builder);
  });
});
