const { redisClient, isRedisEnabled } = require("../config/redis");

// Local fallback cache
const localCache = new Map();

const setCache = async (key, value, ttlSeconds = 3600) => {
  if (isRedisEnabled()) {
    try {
      await redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch (err) {
      console.error("Redis setCache error:", err.message);
    }
  } else {
    localCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }
};

const getCache = async (key) => {
  if (isRedisEnabled()) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error("Redis getCache error:", err.message);
      return null;
    }
  } else {
    const cached = localCache.get(key);
    if (!cached) return null;
    if (Date.now() > cached.expiresAt) {
      localCache.delete(key);
      return null;
    }
    return cached.value;
  }
};

const delCache = async (key) => {
  if (isRedisEnabled()) {
    try {
      await redisClient.del(key);
    } catch (err) {
      console.error("Redis delCache error:", err.message);
    }
  } else {
    localCache.delete(key);
  }
};

module.exports = {
  setCache,
  getCache,
  delCache,
};
