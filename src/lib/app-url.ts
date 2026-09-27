/**
 * Absolute base URL for links in emails. Never derived from the request's Host
 * header (spoofable) in production.
 */
export function getAppUrl(): string {
  const explicit = process.env.APP_URL;
  if (explicit) {
    try {
      const u = new URL(explicit);
      if (u.protocol === "https:" || u.hostname === "localhost") return u.origin;
    } catch {
      // fall through
    }
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}
