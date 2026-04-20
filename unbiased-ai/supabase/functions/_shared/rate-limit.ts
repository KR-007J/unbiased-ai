import { getRedisClient, checkRateLimit, getRateLimitRemaining } from './cache.ts';
import { createRateLimitResponse } from './api.ts';

// Rate limit configurations
export const RATE_LIMITS = {
  // Analysis endpoints
  DETECT_BIAS: { limit: 30, window: 60 }, // 30 requests per minute
  REWRITE: { limit: 20, window: 60 }, // 20 requests per minute
  COMPARE: { limit: 15, window: 60 }, // 15 requests per minute
  ANALYZE: { limit: 10, window: 60 }, // 10 requests per minute

  // Chat and communication
  CHAT: { limit: 50, window: 60 }, // 50 messages per minute
  MESSAGES: { limit: 100, window: 60 }, // 100 messages per minute

  // Data retrieval
  WEB_SCAN: { limit: 5, window: 60 }, // 5 web scans per minute
  FORECAST: { limit: 10, window: 3600 }, // 10 forecasts per hour
  BATCH_ANALYZE: { limit: 3, window: 3600 }, // 3 batch jobs per hour

  // General API
  GENERAL: { limit: 100, window: 60 }, // 100 general requests per minute
} as const;

// Apply rate limiting to a request
export const enforceRateLimit = async (
  userId: string | null,
  action: keyof typeof RATE_LIMITS,
  fallbackUserId?: string
): Promise<{ allowed: boolean; response?: Response; remaining?: number }> => {
  // Use fallback for anonymous users
  const effectiveUserId = userId || fallbackUserId || 'anonymous';

  const config = RATE_LIMITS[action];
  if (!config) {
    console.warn(`No rate limit config found for action: ${action}`);
    return { allowed: true };
  }

  const allowed = await checkRateLimit(effectiveUserId, action, config.limit, config.window);

  if (!allowed) {
    const remaining = await getRateLimitRemaining(effectiveUserId, action);
    const response = new Response(JSON.stringify(createRateLimitResponse(config.window)), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': config.limit.toString(),
        'X-RateLimit-Remaining': Math.max(0, config.limit - remaining).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + config.window * 1000).toISOString(),
        'Retry-After': config.window.toString(),
      },
    });
    return { allowed: false, response, remaining: Math.max(0, config.limit - remaining) };
  }

  const remaining = await getRateLimitRemaining(effectiveUserId, action);
  return { allowed: true, remaining: Math.max(0, config.limit - remaining) };
};

// Rate limit middleware for edge functions
export const withRateLimit = (
  handler: Function,
  action: keyof typeof RATE_LIMITS
) => {
  return async (req: Request): Promise<Response> => {
    try {
      // Extract user ID from request (you might need to adjust this based on your auth)
      const authHeader = req.headers.get('authorization');
      let userId: string | null = null;

      if (authHeader) {
        // This is a simplified extraction - adjust based on your JWT structure
        try {
          const token = authHeader.replace('Bearer ', '');
          // You might want to decode the JWT here to extract user ID
          // For now, we'll use a placeholder
          userId = 'extracted-user-id'; // TODO: Extract from JWT
        } catch (error) {
          console.warn('Failed to extract user ID from token');
        }
      }

      const rateLimitResult = await enforceRateLimit(userId, action);

      if (!rateLimitResult.allowed) {
        return rateLimitResult.response!;
      }

      // Add rate limit headers to successful responses
      const originalResponse = await handler(req);

      // Clone the response to add headers
      const response = new Response(originalResponse.body, {
        status: originalResponse.status,
        statusText: originalResponse.statusText,
        headers: originalResponse.headers,
      });

      // Add rate limit headers
      const config = RATE_LIMITS[action];
      response.headers.set('X-RateLimit-Limit', config.limit.toString());
      response.headers.set('X-RateLimit-Remaining', (rateLimitResult.remaining || 0).toString());
      response.headers.set('X-RateLimit-Reset', new Date(Date.now() + config.window * 1000).toISOString());

      return response;
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fall back to allowing the request if rate limiting fails
      return await handler(req);
    }
  };
};

// Sliding window rate limiting for more sophisticated control
export const checkSlidingWindowRateLimit = async (
  userId: string,
  action: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> => {
  try {
    const client = getRedisClient();
    if (!client) return true;

    const now = Date.now();
    const windowStart = now - (windowSeconds * 1000);
    const key = `sliding:${action}:${userId}`;

    // Remove old entries outside the window
    await client.zremrangebyscore(key, '-inf', windowStart);

    // Count current requests in window
    const requestCount = await client.zcard(key);

    if (requestCount >= limit) {
      return false;
    }

    // Add current request
    await client.zadd(key, now, now.toString());

    // Set expiry on the sorted set
    await client.expire(key, windowSeconds);

    return true;
  } catch (error) {
    console.warn('Sliding window rate limit error:', error.message);
    return true; // Allow on error
  }
};

// Burst rate limiting (allow bursts but maintain average rate)
export const checkBurstRateLimit = async (
  userId: string,
  action: string,
  burstLimit: number,
  sustainedRate: number, // requests per second
  burstWindow: number = 60 // seconds
): Promise<boolean> => {
  try {
    const client = getRedisClient();
    if (!client) return true;

    const now = Date.now();
    const key = `burst:${action}:${userId}`;

    // Get current burst count
    const currentBurst = parseInt(await client.get(`${key}:burst`) || '0');
    const lastRefill = parseInt(await client.get(`${key}:refill`) || now.toString());

    // Calculate tokens to add since last refill
    const timePassed = (now - lastRefill) / 1000; // seconds
    const tokensToAdd = timePassed * sustainedRate;
    const newBurst = Math.min(burstLimit, currentBurst + tokensToAdd);

    if (newBurst < 1) {
      return false; // Not enough tokens
    }

    // Update burst count and last refill time
    await client.setex(`${key}:burst`, burstWindow, (newBurst - 1).toString());
    await client.setex(`${key}:refill`, burstWindow, now.toString());

    return true;
  } catch (error) {
    console.warn('Burst rate limit error:', error.message);
    return true;
  }
};