import type { OkxErrorCategory, OkxApiError } from './types.js';

/**
 * Classify OKX API error by error code
 */
export function classifyError(error: OkxApiError): OkxErrorCategory {
  const code = error.code;

  // Authentication errors (50100-50113)
  if (code >= '50100' && code <= '50113') {
    return 'AUTHENTICATION';
  }

  // Rate limit error
  if (code === '50011') {
    return 'RATE_LIMIT';
  }

  // Insufficient balance
  if (code === '51008') {
    return 'INSUFFICIENT_BALANCE';
  }

  // Order validation errors (51000-51999)
  if (code >= '51000' && code <= '51999') {
    return 'INVALID_ORDER';
  }

  // Network errors
  if (code === 'NETWORK' || code === 'TIMEOUT') {
    return 'NETWORK';
  }

  // Server errors (5xx)
  if (code.startsWith('5')) {
    return 'SERVER';
  }

  return 'UNKNOWN';
}

/**
 * Determine if an error category is retriable
 */
export function isRetriable(category: OkxErrorCategory): boolean {
  switch (category) {
    case 'NETWORK':
    case 'RATE_LIMIT':
    case 'SERVER':
      return true;
    
    case 'AUTHENTICATION':
    case 'INSUFFICIENT_BALANCE':
    case 'INVALID_ORDER':
    case 'UNKNOWN':
      return false;
    
    default:
      return false;
  }
}

/**
 * Get retry delay for rate limit errors
 */
export function getRetryDelay(error: OkxApiError): number | undefined {
  if (error.code === '50011' && error.retryAfterMs) {
    return error.retryAfterMs;
  }
  return undefined;
}
