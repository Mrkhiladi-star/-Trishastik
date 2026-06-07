const Redis = require("ioredis");

let redisClient = null;

const isRedisEnabled = process.env.REDIS_ENABLED === "true";

if (isRedisEnabled) {
  try {
    const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
    console.log(`Connecting to Redis at ${redisUrl}...`);
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
    });

    redisClient.on("connect", () => {
      console.log("Connected to Redis successfully");
    });

    redisClient.on("error", (err) => {
      console.error("Redis connection error, disabling Redis caching:", err.message);
      redisClient = null;
    });
  } catch (err) {
    console.error("Failed to initialize Redis client:", err.message);
    redisClient = null;
  }
} else {
  console.log("Redis is disabled by default. Using in-memory fallback.");
}

module.exports = {
  redisClient,
  isRedisEnabled: () => redisClient !== null,
};
