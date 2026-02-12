/**
 * Exponential backoff calculation utility
 */

/**
 * Calculate exponential backoff delay with optional jitter
 * @param attempt - Current attempt number (0-indexed)
 * @param initialDelayMs - Initial delay in milliseconds
 * @param maxDelayMs - Maximum delay in milliseconds
 * @param multiplier - Exponential backoff multiplier
 * @param useJitter - Whether to add random jitter
 * @returns Delay in milliseconds
 */
export function calculateBackoff(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  multiplier: number,
  useJitter = true
): number {
  // Calculate exponential delay
  let delay = initialDelayMs * Math.pow(multiplier, attempt);

  // Cap at max delay
  delay = Math.min(delay, maxDelayMs);

  // Add jitter if enabled (±25% random variation)
  if (useJitter) {
    const jitterRange = delay * 0.25;
    const jitter = Math.random() * jitterRange * 2 - jitterRange;
    delay = Math.max(0, delay + jitter);
  }

  return Math.floor(delay);
}

/**
 * Sleep for a specified duration
 * @param ms - Duration in milliseconds
 * @returns Promise that resolves after the duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with exponential backoff retry
 * @param fn - Function to execute
 * @param maxAttempts - Maximum number of attempts
 * @param initialDelayMs - Initial delay in milliseconds
 * @param maxDelayMs - Maximum delay in milliseconds
 * @param multiplier - Exponential backoff multiplier
 * @param shouldRetry - Function to determine if error is retryable
 * @returns Result of the function
 */
export async function withBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  initialDelayMs: number,
  maxDelayMs: number,
  multiplier: number,
  shouldRetry: (error: Error) => boolean = () => true
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if this is the last attempt or error is not retryable
      if (attempt === maxAttempts - 1 || !shouldRetry(lastError)) {
        throw lastError;
      }

      // Calculate and wait for backoff delay
      const delay = calculateBackoff(attempt, initialDelayMs, maxDelayMs, multiplier);
      await sleep(delay);
    }
  }

  throw lastError!;
}
