import type { RetryContext, OkxApiError } from './types.js';
import { classifyError, isRetriable, getRetryDelay } from './errorHandler.js';

export class OkxRetryHandler {
  /**
   * Execute an operation with retry logic
   */
  async execute<T>(
    operation: () => Promise<T>,
    context: RetryContext
  ): Promise<T> {
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= context.maxRetries) {
      try {
        // Try to execute the operation
        return await operation();
      } catch (error) {
        lastError = error as Error;
        attempt++;

        // Check if we should retry
        if (attempt > context.maxRetries) {
          break;
        }

        // Check if error is retriable
        if (error instanceof Error && 'code' in error) {
          const okxError = error as OkxApiError;
          const category = classifyError(okxError);

          if (!isRetriable(category)) {
            // Non-retriable error, throw immediately
            if (category === 'AUTHENTICATION') {
              console.error(`CRITICAL: Authentication error in ${context.operationName}:`, okxError.message);
            }
            throw error;
          }

          // Calculate delay
          let delay: number;
          const rateLimitDelay = getRetryDelay(okxError);
          
          if (rateLimitDelay) {
            // Use rate limit specified delay
            delay = rateLimitDelay;
          } else {
            // Use exponential backoff with jitter
            const exponentialDelay = context.baseDelayMs * Math.pow(2, attempt - 1);
            const jitter = Math.random() * 500; // Random jitter up to 500ms
            delay = Math.min(exponentialDelay + jitter, context.maxDelayMs);
          }

          console.warn(
            `Retry attempt ${attempt}/${context.maxRetries} for ${context.operationName} ` +
            `after ${Math.round(delay)}ms delay. Error: ${okxError.message}`
          );

          // Wait before retrying
          await this.sleep(delay);
        } else {
          // Unknown error type, don't retry
          throw error;
        }
      }
    }

    // Max retries reached
    throw new Error(
      `Max retries (${context.maxRetries}) reached for ${context.operationName}. ` +
      `Last error: ${lastError?.message}`
    );
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
