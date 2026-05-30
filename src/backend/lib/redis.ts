import Redis from "ioredis";

const globalForRedis = global as unknown as { redis: Redis };

const createRedisClient = () => {
  const connectionString = process.env.REDIS_URL;
  const isProd = process.env.NODE_ENV === "production";
  
  if (isProd && !connectionString) {
    throw new Error("CRITICAL: REDIS_URL environment variable is required in production.");
  }
  
  const client = new Redis(connectionString || "redis://127.0.0.1:6379", {
    maxRetriesPerRequest: 1,
    showFriendlyErrorStack: !isProd,
    tls: connectionString?.startsWith("rediss://") ? { rejectUnauthorized: false } : undefined,
    retryStrategy(times) {
      if (isProd && times > 5) {
        return null; // Stop retrying after 5 attempts in production to fail fast
      }
      return Math.min(times * 200, 2000);
    },
  });

  // Handle the error event cleanly to prevent unhandled crash/log spam
  client.on("error", (err) => {
    if (connectionString || isProd) {
      console.error("Redis connection error:", err.message);
    }
  });

  return client;
};

export const redis = globalForRedis.redis || createRedisClient();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;
