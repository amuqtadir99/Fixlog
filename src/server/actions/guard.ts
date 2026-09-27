import "server-only";
import { getSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { classifyDbError, SETUP_ISSUE_MESSAGES } from "@/lib/db-errors";

export class RateLimitError extends Error {
  constructor() {
    super("Too many requests. Please slow down and try again in a minute.");
  }
}

/** Every mutation goes through here: auth (throws if signed out) + rate limit. */
export async function mutationContext() {
  const ctx = await getSupabase();
  if (!(await checkRateLimit(`mut:${ctx.userId}`))) throw new RateLimitError();
  return ctx;
}

export function dbError(context: string, error: { message: string; code?: string }) {
  console.error(`[db] ${context}:`, error.code, error.message);
  const issue = classifyDbError(error);
  // Configuration problems get an actionable message; anything else stays generic.
  if (issue) return { ok: false as const, message: `Could not ${context}. ${SETUP_ISSUE_MESSAGES[issue]}` };
  return { ok: false as const, message: `Could not ${context}. Please try again.` };
}
