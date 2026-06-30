import { tryConsume } from "../algorithms/tokenBucket.js";

/**
 * RATE LIMITER MIDDLEWARE
 *
 * This function is plugged into Express and runs on every
 * request to any protected route, before the route handler runs.
 *
 * Express middleware always receives three arguments:
 * - req: the incoming request (headers, body, IP, etc.)
 * - res: the response object (used to send back data)
 * - next: a function to call if we want to let the request through
 */
export function rateLimiter(req, res, next) {
  // Identify the client by their IP address
  // req.ip gives us the IP from Express
  // In production behind a proxy/load balancer, we'd use
  // req.headers['x-forwarded-for'] inst  
  const clientKey = req.ip;

  // Ask the token bucket: is this client allowed?
  const result = tryConsume(clientKey);

  // Always send these headers back so the client (and our UI)
  // can see the current rate limit status
  // This is the same pattern used by GitHub, Stripe, Twitter APIs
  res.setHeader("X-RateLimit-Limit", 10);
  res.setHeader("X-RateLimit-Remaining", result.remainingTokens);

  if (result.allowed) {
    // Request is allowed — pass it through to the route handler
    next();
  } else {
    // Request is blocked — send 429 Too Many Requests
    // Retry-After tells the client how many seconds to wait
    res.setHeader("Retry-After", Math.ceil(result.retryAfterMs / 1000));

    return res.status(429).json({
      error: "Too Many Requests",
      message: "You have exceeded the rate limit. Please slow down.",
      retryAfterMs: result.retryAfterMs,
    });
  }
}