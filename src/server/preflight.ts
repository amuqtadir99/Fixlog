import "server-only";
import { cache } from "react";
import { classifyDbError, type SetupIssue } from "@/lib/db-errors";
import { getSupabase, UnauthorizedError } from "@/lib/supabase/server";

/**
 * One cheap query per request (limit 1, own rows only) that tells the app
 * shell whether data access works, so a misconfigured deployment shows setup
 * steps instead of a generic error on every page.
 */
export const checkDataAccess = cache(async (): Promise<SetupIssue | null> => {
  try {
    const { supabase, userId } = await getSupabase();
    const { error } = await supabase.from("assets").select("id").eq("user_id", userId).limit(1);
    if (!error) return null;
    console.error("[preflight]", error.code, error.message);
    return classifyDbError(error);
  } catch (e) {
    if (e instanceof UnauthorizedError) return null;
    throw e;
  }
});
