import Redis from "ioredis";

const globalForRedis = global as unknown as { redis: Redis };

const createRedisClient = () => {
  const connectionString = process.env.REDIS_URL;
  
  const client = new Redis(connectionString || "redis://127.0.0.1:6379", {
    maxRetriesPerRequest: 1,
    showFriendlyErrorStack: true,
    retryStrategy(times) {
      if (!connectionString && process.env.NODE_ENV === "production") {
        return null; // Stop retrying in production if no Redis URL is configured
      }
      return Math.min(times * 100, 3000);
    },
  });

  // Handle the error event cleanly to prevent unhandled crash/log spam
  client.on("error", (err) => {
    if (connectionString) {
      console.error("Redis connection error:", err.message);
    }
  });

  return client;
};

export const redis = globalForRedis.redis || createRedisClient();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;
