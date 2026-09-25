import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Sliding-window limiter for mutations. Uses Upstash Redis when configured
 * (shared across all serverless instances); otherwise a best-effort
 * per-instance in-memory window so local dev and previews still work.
 */
const LIMIT = 60;
const WINDOW_MS = 60_000;

const upstash =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(LIMIT, "60 s"),
        prefix: "fixlog:rl",
        analytics: false,
      })
    : null;

const memory = new Map<string, number[]>();

export async function checkRateLimit(key: string): Promise<boolean> {
  if (upstash) {
    const { success } = await upstash.limit(key);
    return success;
  }
  const now = Date.now();
  const hits = (memory.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= LIMIT) {
    memory.set(key, hits);
    return false;
  }
  hits.push(now);
  memory.set(key, hits);
  if (memory.size > 10_000) memory.clear();
  return true;
}
