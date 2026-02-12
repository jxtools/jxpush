/**
 * In-memory queue implementation
 */

import { PushMessage } from '../types/message.types.js';
import { Logger } from '../utils/logger.js';
import { EventEmitter } from 'events';

/**
 * Queue item with priority
 */
export interface QueueItem {
  id: string;
  message: PushMessage;
  priority: number;
  addedAt: Date;
  attempts: number;
}

/**
 * In-memory queue with priority support
 */
export class InMemoryQueue extends EventEmitter {
  private queue: QueueItem[] = [];
  private maxSize: number;
  private logger: Logger;
  private idCounter = 0;

  constructor(maxSize = 0, logger: Logger) {
    super();
    this.maxSize = maxSize;
    this.logger = logger;
  }

  /**
   * Add message to queue
   * @returns Queue item ID
   */
  enqueue(message: PushMessage, priority = 0): string {
    // Check queue size limit
    if (this.maxSize > 0 && this.queue.length >= this.maxSize) {
      this.logger.warn('Queue is full', { size: this.queue.length, maxSize: this.maxSize });
      throw new Error(`Queue is full (max size: ${this.maxSize})`);
    }

    const id = `queue-${++this.idCounter}-${Date.now()}`;
    const item: QueueItem = {
      id,
      message,
      priority,
      addedAt: new Date(),
      attempts: 0,
    };

    this.queue.push(item);

    // Sort by priority (higher priority first)
    this.queue.sort((a, b) => b.priority - a.priority);

    this.emit('enqueue', item);
    this.logger.debug('Message enqueued', { id, priority, queueSize: this.queue.length });

    return id;
  }

  /**
   * Remove and return next message from queue
   */
  dequeue(): QueueItem | undefined {
    const item = this.queue.shift();

    if (item) {
      this.emit('dequeue', item);
      this.logger.debug('Message dequeued', { id: item.id, queueSize: this.queue.length });
    }

    return item;
  }

  /**
   * Get multiple items from queue
   */
  dequeueBatch(count: number): QueueItem[] {
    const items: QueueItem[] = [];

    for (let i = 0; i < count && this.queue.length > 0; i++) {
      const item = this.dequeue();
      if (item) {
        items.push(item);
      }
    }

    return items;
  }

  /**
   * Peek at next item without removing it
   */
  peek(): QueueItem | undefined {
    return this.queue[0];
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Check if queue is full
   */
  isFull(): boolean {
    return this.maxSize > 0 && this.queue.length >= this.maxSize;
  }

  /**
   * Clear all items from queue
   */
  clear(): void {
    const count = this.queue.length;
    this.queue = [];
    this.emit('clear', count);
    this.logger.debug('Queue cleared', { count });
  }

  /**
   * Get all items (without removing)
   */
  getAll(): QueueItem[] {
    return [...this.queue];
  }

  /**
   * Remove specific item by ID
   */
  remove(id: string): boolean {
    const index = this.queue.findIndex((item) => item.id === id);

    if (index !== -1) {
      const item = this.queue.splice(index, 1)[0];
      this.emit('remove', item);
      this.logger.debug('Message removed from queue', { id });
      return true;
    }

    return false;
  }

  /**
   * Increment attempt count for an item
   */
  incrementAttempts(id: string): void {
    const item = this.queue.find((i) => i.id === id);
    if (item) {
      item.attempts++;
    }
  }
}
