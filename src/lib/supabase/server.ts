import "server-only";
import { auth } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import { DEMO_USER_ID, getAuthMode } from "../auth-mode";
import { publicEnv } from "../env";
import { getAdminSupabase } from "./admin";

export class UnauthorizedError extends Error {
  constructor() {
    super("Not signed in");
  }
}

/** The signed-in user's id, the shared demo id in demo mode, or null. */
export async function getCurrentUserId(): Promise<string | null> {
  const mode = getAuthMode();
  if (mode === "demo") return DEMO_USER_ID;
  if (mode !== "clerk") return null;
  return (await auth()).userId;
}

/**
 * Per-request Supabase client plus the caller's user id.
 *
 * Clerk mode: authenticated with the caller's Clerk session token, so every
 * query runs under Postgres RLS as that user.
 * Demo mode: service-role client (RLS bypassed). Every query and mutation in
 * src/server/ therefore ALSO filters/sets user_id explicitly — keep it that way.
 */
export const getSupabase = cache(async (): Promise<{ supabase: SupabaseClient; userId: string }> => {
  const mode = getAuthMode();
  if (mode === "demo") return { supabase: getAdminSupabase(), userId: DEMO_USER_ID };
  if (mode !== "clerk") throw new UnauthorizedError();

  const { userId, getToken } = await auth();
  if (!userId) throw new UnauthorizedError();
  const env = publicEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    accessToken: async () => (await getToken()) ?? null,
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
  return { supabase, userId };
});
