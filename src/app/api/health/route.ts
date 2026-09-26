import { getAuthMode, missingConfig } from "@/lib/auth-mode";
import { getAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type DbStatus = "ok" | "missing_tables" | "error" | "unchecked";

/** Checks the schema exists without reading any row data. */
async function checkDatabase(): Promise<DbStatus> {
  if (!(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) return "unchecked";
  try {
    const { error } = await getAdminSupabase().from("assets").select("id").limit(0);
    if (!error) return "ok";
    return error.code === "PGRST205" || error.code === "42P01" ? "missing_tables" : "error";
  } catch {
    return "error";
  }
}

export async function GET() {
  const missing = missingConfig();
  return Response.json(
    {
      status: missing.length ? "setup_required" : "ok",
      authMode: getAuthMode(),
      missing,
      database: await checkDatabase(),
      time: new Date().toISOString(),
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
