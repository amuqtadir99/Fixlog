/**
 * Maps Supabase/PostgREST errors that mean "the deployment is misconfigured"
 * to a kind we can explain to the user. Everything else stays generic.
 */
export type SetupIssue = "missing_tables" | "auth_integration";

export function classifyDbError(error: { code?: string | null; message?: string | null }): SetupIssue | null {
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();
  if (code === "PGRST205" || code === "42P01" || message.includes("could not find the table")) {
    return "missing_tables";
  }
  // JWT rejected (Clerk not added as a Supabase third-party auth provider), or
  // accepted but without role=authenticated (Clerk's Supabase integration off):
  // PostgREST then runs as `anon`, which has no table grants → 42501.
  if (
    code.startsWith("PGRST30") ||
    code === "42501" ||
    /jwt|jws|no suitable key|invalid token|invalid signature/.test(message)
  ) {
    return "auth_integration";
  }
  return null;
}

export const SETUP_ISSUE_MESSAGES: Record<SetupIssue, string> = {
  missing_tables:
    "The database tables don't exist yet. Run the SQL files in supabase/migrations (Supabase → SQL Editor), then try again.",
  auth_integration:
    "Supabase isn't accepting your sign-in. Add Clerk under Supabase → Authentication → Third-party auth and activate the Supabase integration in Clerk.",
};
