import "server-only";
import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Sliding-window limiters. Uses Upstash Redis when configured (shared across
 * all serverless instances); otherwise a best-effort per-instance in-memory
 * window so local dev and previews still work.
 */
const POLICIES = {
  /** Data mutations and exports. */
  mutation: { limit: 60, window: "60 s", ms: 60_000 },
  /** Outgoing email the user can trigger (verification, test): abuse-sensitive. */
  email: { limit: 5, window: "1 h", ms: 3_600_000 },
} satisfies Record<string, { limit: number; window: Duration; ms: number }>;

export type RateLimitPolicy = keyof typeof POLICIES;

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? Redis.fromEnv() : null;
const upstash = redis
  ? Object.fromEntries(
      Object.entries(POLICIES).map(([name, p]) => [
        name,
        new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(p.limit, p.window), prefix: `fixlog:rl:${name}` }),
      ]),
    )
  : null;

const memory = new Map<string, number[]>();

export async function checkRateLimit(key: string, policy: RateLimitPolicy = "mutation"): Promise<boolean> {
  if (upstash) {
    const { success } = await upstash[policy].limit(key);
    return success;
  }
  const { limit, ms } = POLICIES[policy];
  const bucket = `${policy}:${key}`;
  const now = Date.now();
  const hits = (memory.get(bucket) ?? []).filter((t) => now - t < ms);
  if (hits.length >= limit) {
    memory.set(bucket, hits);
    return false;
  }
  hits.push(now);
  memory.set(bucket, hits);
  if (memory.size > 10_000) memory.clear();
  return true;
}
