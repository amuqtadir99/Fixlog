import "server-only";
import { auth } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import { publicEnv } from "../env";

export class UnauthorizedError extends Error {
  constructor() {
    super("Not signed in");
  }
}

/**
 * Per-request Supabase client authenticated with the caller's Clerk session
 * token. Every query runs under Postgres RLS as that user.
 */
export const getSupabase = cache(async (): Promise<{ supabase: SupabaseClient; userId: string }> => {
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
