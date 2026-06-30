import config from "../config.js";

/**
 * TOKEN BUCKET ALGORITHM
 *
 * Think of it like this:
 * - You have a bucket that holds max 10 tokens
 * - Every second, 1 new token is added to the bucket
 * - Every request you make costs 1 token
 * - If bucket is empty, your request is blocked until a token refills
 * - This allows short bursts (up to 10 requests at once) while
 *   enforcing a steady average rate (1 request/sec) over time
 */

// This Map stores one bucket per client
// key = client IP address
// value = { tokens, lastRefillTime }
const buckets = new Map();

/**
 * Get or create a bucket for a client, and refill tokens
 * based on how much time has passed since last request.
 * We do NOT use a timer — we calculate refill on demand.
 * This is called "lazy refill" and is the standard approach.
 */
function getBucket(key) {
  const now = Date.now(); // current time in milliseconds
  const capacity = Number(config.rateLimit.capacity);
  const refillRate = Number(config.rateLimit.refillRate);

  // If this client has never made a request, create a fresh bucket
  // with full tokens
  if (!buckets.has(key)) {
    buckets.set(key, {
      tokens: capacity,
      lastRefillTime: now,
    });
    return buckets.get(key);
  }

  // Client exists — calculate how many tokens should have
  // refilled since their last request
  const bucket = buckets.get(key);
  const elapsedSeconds = (now - bucket.lastRefillTime) / 1000;
  const tokensToAdd = elapsedSeconds * refillRate;

  if (tokensToAdd > 0) {
    // Add tokens but never exceed capacity
    bucket.tokens = Math.min(capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefillTime = now;
  }

  return bucket;
}

/**
 * Main function — call this on every incoming request.
 * Returns whether the request is allowed or blocked.
 *
 * @param {string} key - client identifier (usually their IP address)
 * @returns {{ allowed: boolean, remainingTokens: number, retryAfterMs: number }}
 */
export function tryConsume(key) {
  const bucket = getBucket(key);
  const capacity = Number(config.rateLimit.capacity);

  if (bucket.tokens >= 1) {
    // Allow the request — remove 1 token
    bucket.tokens -= 1;
    return {
      allowed: true,
      remainingTokens: Math.floor(bucket.tokens),
      retryAfterMs: 0,
    };
  }

  // Block the request — calculate how long until 1 token refills
  const refillRate = Number(config.rateLimit.refillRate);
  const tokensNeeded = 1 - bucket.tokens;
  const retryAfterMs = Math.ceil((tokensNeeded / refillRate) * 1000);

  return {
    allowed: false,
    remainingTokens: 0,
    retryAfterMs, // tells the client "wait this many ms before retrying"
  };
}

/**
 * Read-only peek at a client's current bucket state.
 * Used by the /api/status endpoint so the UI dashboard
 * can show remaining tokens WITHOUT consuming one.
 *
 * @param {string} key - client identifier
 */
export function getState(key) {
  const bucket = getBucket(key);
  return {
    tokens: Math.floor(bucket.tokens),
    capacity: Number(config.rateLimit.capacity),
  };
}