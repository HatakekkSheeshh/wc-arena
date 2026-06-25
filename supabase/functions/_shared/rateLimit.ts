import { redisCommand } from './redis.ts';

export type RateLimitOptions = {
  key: string;
  action: string;
  windowSeconds: number;
  maxCount: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export async function checkRateLimit({ key, action, windowSeconds, maxCount }: RateLimitOptions): Promise<RateLimitResult> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(nowSeconds / windowSeconds) * windowSeconds;
  const resetAt = (windowStart + windowSeconds) * 1000;
  const redisKey = `wc26:rate:${action}:${key}:${windowStart}`;

  try {
    const count = Number(await redisCommand<number>(['INCR', redisKey]));
    if (count === 1) {
      await redisCommand<unknown>(['EXPIRE', redisKey, windowSeconds]);
    }

    return {
      allowed: count <= maxCount,
      remaining: Math.max(0, maxCount - count),
      resetAt,
    };
  } catch (error) {
    console.warn(`Rate limit unavailable for ${action}: ${error instanceof Error ? error.message : String(error)}`);
    return {
      allowed: true,
      remaining: maxCount,
      resetAt,
    };
  }
}
