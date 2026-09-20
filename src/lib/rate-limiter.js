import { RateLimitError } from './errors.js';

if (!global.__rateLimiterStore) {
  global.__rateLimiterStore = new Map();
}

const store = global.__rateLimiterStore;

// Clean up stale timestamps periodically
if (!global.__rateLimiterCleanupInterval) {
  global.__rateLimiterCleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of store.entries()) {
      const valid = timestamps.filter((t) => now - t < 300000); // 5 min max window
      if (valid.length === 0) {
        store.delete(key);
      } else {
        store.set(key, valid);
      }
    }
  }, 60000);
  if (global.__rateLimiterCleanupInterval.unref) {
    global.__rateLimiterCleanupInterval.unref();
  }
}

/**
 * Checks and updates sliding window rate limit for a given key.
 *
 * @param {string} key - Unique identifier (e.g., "login:127.0.0.1" or "invoice:token")
 * @param {{ limit: number, windowMs: number }} options
 * @returns {{ allowed: boolean, remaining: number, resetTimeMs: number }}
 */
export function checkRateLimit(key, { limit = 60, windowMs = 60000 } = {}) {
  const now = Date.now();
  const timestamps = store.get(key) || [];

  // Filter out timestamps outside the current window
  const windowStart = now - windowMs;
  const validTimestamps = timestamps.filter((t) => t > windowStart);

  if (validTimestamps.length >= limit) {
    const oldestTimestamp = validTimestamps[0];
    const resetTimeMs = Math.max(0, oldestTimestamp + windowMs - now);
    return {
      allowed: false,
      remaining: 0,
      resetTimeMs,
    };
  }

  validTimestamps.push(now);
  store.set(key, validTimestamps);

  return {
    allowed: true,
    remaining: limit - validTimestamps.length,
    resetTimeMs: windowMs,
  };
}

/**
 * Asserts rate limit for a given key or throws RateLimitError.
 *
 * @param {string} key
 * @param {{ limit?: number, windowMs?: number, message?: string }} [options]
 */
export function assertRateLimit(key, options = {}) {
  const { limit = 60, windowMs = 60000, message } = options;
  const result = checkRateLimit(key, { limit, windowMs });

  if (!result.allowed) {
    const retryAfter = Math.ceil(result.resetTimeMs / 1000) || 1;
    throw new RateLimitError(
      message || `Rate limit exceeded. Please try again in ${retryAfter} second(s).`,
      retryAfter
    );
  }

  return result;
}

/**
 * Helper to extract client IP from Next.js request headers
 *
 * @param {Request} request
 * @returns {string}
 */
export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

/**
 * Reset rate limits (primarily for testing)
 */
export function resetRateLimits() {
  store.clear();
}
