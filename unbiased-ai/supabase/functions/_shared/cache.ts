import { createClient } from "https://esm.sh/redis@4.6.10";

// Redis connection configuration
const REDIS_URL = Deno.env.get('REDIS_URL') || Deno.env.get('UPSTASH_REDIS_REST_URL');
const REDIS_TOKEN = Deno.env.get('REDIS_TOKEN') || Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

// Create Redis client
let redisClient: any = null;

export const getRedisClient = () => {
  // Disabling Redis TCP client as it causes edge functions to hang
  return null;
};

// Content hashing utility
export const hashContent = (content: string): string => {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

// Cache key generation
export const generateCacheKey = (prefix: string, content: string, params?: any): string => {
  const contentHash = hashContent(content);
  const paramString = params ? JSON.stringify(params) : '';
  const paramHash = paramString ? `:${hashContent(paramString)}` : '';
  return `${prefix}:${contentHash}${paramHash}`;
};

// Generic caching functions
export const getCachedResult = async (key: string): Promise<any | null> => {
  try {
    const client = getRedisClient();
    if (!client) return null;

    const cached = await client.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.warn('Cache read error:', error.message);
    return null;
  }
};

export const setCachedResult = async (key: string, data: any, ttlSeconds: number = 3600): Promise<void> => {
  try {
    const client = getRedisClient();
    if (!client) return;

    await client.setex(key, ttlSeconds, JSON.stringify(data));
  } catch (error) {
    console.warn('Cache write error:', error.message);
  }
};

export const invalidateCache = async (pattern: string): Promise<void> => {
  try {
    const client = getRedisClient();
    if (!client) return;

    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (error) {
    console.warn('Cache invalidation error:', error.message);
  }
};

// Analysis-specific caching
export const CACHE_KEYS = {
  ANALYSIS: (content: string) => generateCacheKey('analysis', content),
  WEB_SCAN: (url: string) => generateCacheKey('webscan', url),
  USER_PROFILE: (userId: string) => `user:${userId}`,
  FORECAST: (userId: string, period: string) => `forecast:${userId}:${period}`,
  BATCH_JOB: (batchId: string) => `batch:${batchId}`,
};

// Rate limiting
export const checkRateLimit = async (userId: string, action: string, limit: number = 30, windowSeconds: number = 60): Promise<boolean> => {
  try {
    const client = getRedisClient();
    if (!client) return true; // Allow if Redis is not available

    const key = `ratelimit:${action}:${userId}`;
    const current = await client.incr(key);

    if (current === 1) {
      await client.expire(key, windowSeconds);
    }

    return current <= limit;
  } catch (error) {
    console.warn('Rate limit check error:', error.message);
    return true; // Allow on error
  }
};

export const getRateLimitRemaining = async (userId: string, action: string): Promise<number> => {
  try {
    const client = getRedisClient();
    if (!client) return 999;

    const key = `ratelimit:${action}:${userId}`;
    const current = await client.get(key);
    return current ? parseInt(current.toString()) : 0;
  } catch (error) {
    console.warn('Rate limit remaining check error:', error.message);
    return 999;
  }
};

// Analytics tracking
export const trackEvent = async (event: string, userId: string, data?: any): Promise<void> => {
  try {
    const client = getRedisClient();
    if (!client) return;

    const eventKey = `analytics:${event}:${Date.now()}`;
    const eventData = {
      userId,
      timestamp: new Date().toISOString(),
      ...data
    };

    await client.setex(eventKey, 86400, JSON.stringify(eventData)); // Keep for 24 hours
  } catch (error) {
    console.warn('Analytics tracking error:', error.message);
  }
};

// Health check
export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    const client = getRedisClient();
    if (!client) return false;

    await client.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error.message);
    return false;
  }
};
