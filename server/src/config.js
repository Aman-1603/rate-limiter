const config = {
  // Server settings
  port: process.env.PORT || 4000,

  // Redis connection (we'll use this when we add Redis later)
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",

  // Rate limiter settings
  // How many requests a client is allowed before being blocked
  rateLimit: {
    // Max tokens the bucket can hold (also the burst limit)
    capacity: process.env.RATE_LIMIT_CAPACITY || 10,

    // How many tokens refill per second
    // 10 capacity + 1 per second means: allow burst of 10, then 1 req/sec steady
    refillRate: process.env.RATE_LIMIT_REFILL_RATE || 1,

    // Which algorithm to use (we'll support swapping later)
    algorithm: process.env.RATE_LIMIT_ALGORITHM || "token-bucket",
  },
};

export default config;