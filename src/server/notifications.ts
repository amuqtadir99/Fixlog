import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAppUrl } from "@/lib/app-url";
import { addInterval, getUrgency, todayInTimeZone } from "@/lib/domain";
import { sendEmail, unsubscribeHeaders, type SendResult } from "@/lib/email/resend";
import { digestEmail, verificationEmail, type DigestTask } from "@/lib/email/templates";

export interface NotificationSettings {
  user_id: string;
  email: string | null;
  enabled: boolean;
  frequency: "daily" | "weekly";
  lead_days: number;
  timezone: string | null;
  email_verified_at: string | null;
  verify_sent_at: string | null;
  unsubscribe_token: string;
  last_sent_at: string | null;
}

export const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function unsubscribeUrl(token: string): string {
  return `${getAppUrl()}/unsubscribe?token=${encodeURIComponent(token)}`;
}

/** Stores a fresh verification token (hashed) and emails the link. Uses the service role. */
export async function sendVerification(admin: SupabaseClient, userId: string, email: string): Promise<SendResult> {
  const token = newToken();
  const { error } = await admin
    .from("notification_settings")
    .update({ verify_token_hash: hashToken(token), verify_sent_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("email", email);
  if (error) {
    console.error("[notifications] store token:", error.code, error.message);
    return { ok: false, error: "could not store token" };
  }
  const verifyUrl = `${getAppUrl()}/api/notifications/verify?token=${encodeURIComponent(token)}`;
  return sendEmail(email, verificationEmail({ verifyUrl }));
}

/** Is a digest due for this user now? Crons run once a day, so allow some slack. */
export function isDigestDue(s: Pick<NotificationSettings, "frequency" | "last_sent_at">, now: Date): boolean {
  if (!s.last_sent_at) return true;
  const hours = (now.getTime() - new Date(s.last_sent_at).getTime()) / 3_600_000;
  return s.frequency === "daily" ? hours >= 20 : hours >= 6 * 24 + 20;
}

async function digestTasks(admin: SupabaseClient, s: NotificationSettings, today: string): Promise<DigestTask[]> {
  const horizon = addInterval(today, s.lead_days, "day");
  const { data, error } = await admin
    .from("maintenance_tasks")
    .select("id, title, next_due_on, status, asset:assets!inner(name, archived)")
    .eq("user_id", s.user_id)
    .eq("asset.archived", false)
    .neq("status", "done")
    .not("next_due_on", "is", null)
    .lte("next_due_on", horizon)
    .order("next_due_on")
    .limit(100);
  if (error) throw new Error(`digest query failed: ${error.code}`);
  return (
    data as unknown as { id: string; title: string; next_due_on: string; status: string; asset: { name: string } }[]
  ).map((t) => ({
    id: t.id,
    title: t.title,
    assetName: t.asset.name,
    dueOn: t.next_due_on,
    urgency: getUrgency(t, today),
  }));
}

export interface ReminderRunResult {
  considered: number;
  sent: number;
  nothingDue: number;
  notDueYet: number;
  failed: number;
}

/** Sends due digests to every verified, enabled subscriber. */
export async function runReminders(admin: SupabaseClient, now = new Date()): Promise<ReminderRunResult> {
  const result: ReminderRunResult = { considered: 0, sent: 0, nothingDue: 0, notDueYet: 0, failed: 0 };
  const { data, error } = await admin
    .from("notification_settings")
    .select("*")
    .eq("enabled", true)
    .not("email", "is", null)
    .not("email_verified_at", "is", null)
    .limit(1000);
  if (error) throw new Error(`settings query failed: ${error.code}`);

  for (const s of data as NotificationSettings[]) {
    result.considered++;
    if (!isDigestDue(s, now)) {
      result.notDueYet++;
      continue;
    }
    try {
      const today = todayInTimeZone(s.timezone ?? undefined, now);
      const tasks = await digestTasks(admin, s, today);
      if (tasks.length === 0) {
        result.nothingDue++;
        continue;
      }
      const unsub = unsubscribeUrl(s.unsubscribe_token);
      const sent = await sendEmail(
        s.email!,
        digestEmail({ tasks, today, leadDays: s.lead_days, appUrl: getAppUrl(), unsubscribeUrl: unsub }),
        {
          headers: unsubscribeHeaders(`${getAppUrl()}/api/notifications/unsubscribe?token=${s.unsubscribe_token}`),
          idempotencyKey: `digest-${s.user_id}-${today}`,
        },
      );
      if (!sent.ok) {
        result.failed++;
        continue;
      }
      await admin.from("notification_settings").update({ last_sent_at: now.toISOString() }).eq("user_id", s.user_id);
      result.sent++;
    } catch (e) {
      console.error("[reminders] user failed:", e instanceof Error ? e.message : e);
      result.failed++;
    }
  }
  return result;
}
