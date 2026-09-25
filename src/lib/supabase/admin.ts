import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "../env";

/**
 * Service-role client. BYPASSES RLS — use only in trusted, signature-verified
 * server code (e.g. the Clerk webhook). Never import from a component.
 */
export function getAdminSupabase() {
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY is not configured");
  return createClient(publicEnv().NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
