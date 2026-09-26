/**
 * How the app authenticates. Evaluated on the server (and in proxy.ts).
 *
 * - "clerk": Clerk keys are present — normal, per-user auth + Supabase RLS.
 * - "demo":  no Clerk keys AND DEMO_MODE=true — no sign-in; everyone shares one
 *            demo account. For previews only. Clerk keys always win over this.
 * - "unconfigured": neither — the app shows a setup page instead of crashing.
 */
export type AuthMode = "clerk" | "demo" | "unconfigured";

export const DEMO_USER_ID = "demo_user";

export function isClerkConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
}

export function getAuthMode(): AuthMode {
  if (isClerkConfigured()) return "clerk";
  if (process.env.DEMO_MODE === "true") return "demo";
  return "unconfigured";
}

/** Env vars still missing for the current mode (names only — never values). */
export function missingConfig(): string[] {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)");
  }
  const mode = getAuthMode();
  if (mode === "unconfigured") {
    missing.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY (or DEMO_MODE=true to try without sign-in)");
  }
  if (mode === "demo" && !(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    missing.push("SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) — required for demo mode");
  }
  return missing;
}
