import "server-only";
import type { EmailContent } from "./templates";

/** Resend REST API (https://resend.com/docs/api-reference/emails/send-email). */
const RESEND_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "FixLog <onboarding@resend.dev>";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Server env vars reminders need (names only). */
export function missingEmailConfig(): string[] {
  const missing: string[] = [];
  if (!process.env.RESEND_API_KEY) missing.push("RESEND_API_KEY");
  if (!(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) missing.push("SUPABASE_SECRET_KEY");
  if (!process.env.CRON_SECRET) missing.push("CRON_SECRET");
  return missing;
}

export type SendResult = { ok: true; id: string } | { ok: false; error: string };

export async function sendEmail(
  to: string,
  content: EmailContent,
  opts: { headers?: Record<string, string>; idempotencyKey?: string } = {},
  fetchImpl: typeof fetch = fetch,
): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY is not set" };
  try {
    const res = await fetchImpl(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(opts.idempotencyKey ? { "Idempotency-Key": opts.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || DEFAULT_FROM,
        to: [to],
        subject: content.subject,
        html: content.html,
        text: content.text,
        headers: opts.headers,
      }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
    if (!res.ok || !body.id) {
      // Log the provider's reason server-side only; never the API key.
      console.error("[email] send failed", res.status, body.name ?? "", body.message ?? "");
      return { ok: false, error: body.message ?? `HTTP ${res.status}` };
    }
    return { ok: true, id: body.id };
  } catch (e) {
    console.error("[email] send error", e instanceof Error ? e.message : e);
    return { ok: false, error: "network error" };
  }
}

/** RFC 8058 one-click unsubscribe headers (Gmail/Yahoo bulk-sender requirement). */
export function unsubscribeHeaders(url: string): Record<string, string> {
  return { "List-Unsubscribe": `<${url}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" };
}
