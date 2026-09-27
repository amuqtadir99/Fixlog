"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getAuthMode } from "@/lib/auth-mode";
import { isEmailConfigured, sendEmail, unsubscribeHeaders } from "@/lib/email/resend";

const hasAdminKey = () => Boolean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
const NO_ADMIN_KEY = "Email reminders need SUPABASE_SECRET_KEY on the server (see docs/DEPLOYMENT.md).";
import { testEmail } from "@/lib/email/templates";
import { getAppUrl } from "@/lib/app-url";
import { checkRateLimit } from "@/lib/rate-limit";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { formDataToObject, notificationSettingsSchema, validationError, type ActionState } from "@/lib/validation";
import { sendVerification, unsubscribeUrl, type NotificationSettings } from "@/server/notifications";
import { dbError, mutationContext, RateLimitError } from "./guard";

const DEMO_MESSAGE = "Email reminders need real accounts. Add the Clerk keys to turn off demo mode.";
const NOT_CONFIGURED = "Saved. Emails can't be sent yet because RESEND_API_KEY isn't set on the server.";

/** Emails the signed-in user has already verified with Clerk (trusted without re-verifying). */
async function clerkVerifiedEmails(): Promise<Set<string>> {
  if (getAuthMode() !== "clerk") return new Set();
  const user = await currentUser();
  return new Set(
    (user?.emailAddresses ?? [])
      .filter((e) => e.verification?.status === "verified")
      .map((e) => e.emailAddress.toLowerCase()),
  );
}

async function readSettings(userId: string): Promise<NotificationSettings | null> {
  const { data } = await getAdminSupabase()
    .from("notification_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data as NotificationSettings | null;
}

export async function saveNotificationSettings(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  if (getAuthMode() === "demo") return { ok: false, message: DEMO_MESSAGE };
  if (!hasAdminKey()) return { ok: false, message: NO_ADMIN_KEY };
  const parsed = notificationSettingsSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return validationError(parsed.error);

  const tzCookie = (await cookies()).get("tz")?.value;
  const timezone = tzCookie && /^[A-Za-z0-9_+\-/]{1,64}$/.test(tzCookie) ? tzCookie : null;
  const prefs = { ...parsed.data, timezone };

  let userId: string;
  try {
    const ctx = await mutationContext();
    userId = ctx.userId;
    // Insert-or-update without upsert: users may not write user_id on UPDATE (column grants).
    const { data: existing, error: readError } = await ctx.supabase
      .from("notification_settings")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (readError) return dbError("save your reminder settings", readError);
    const { error } = existing
      ? await ctx.supabase.from("notification_settings").update(prefs).eq("user_id", userId)
      : await ctx.supabase.from("notification_settings").insert({ ...prefs, user_id: userId });
    if (error) return dbError("save your reminder settings", error);
  } catch (e) {
    if (e instanceof RateLimitError) return { ok: false, message: e.message };
    throw e;
  }
  revalidatePath("/settings");

  const row = await readSettings(userId);
  if (!row?.email || row.email_verified_at) return { ok: true, message: "Reminder settings saved." };

  // Addresses Clerk already verified for this user need no extra confirmation.
  if ((await clerkVerifiedEmails()).has(row.email)) {
    await getAdminSupabase()
      .from("notification_settings")
      .update({ email_verified_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("email", row.email);
    revalidatePath("/settings");
    return { ok: true, message: "Reminder settings saved." };
  }

  if (!isEmailConfigured()) return { ok: true, message: NOT_CONFIGURED };
  if (!(await checkRateLimit(`email:${userId}`, "email"))) {
    return { ok: true, message: "Saved. Too many emails sent recently, so try “Resend confirmation” later." };
  }
  const sent = await sendVerification(getAdminSupabase(), userId, row.email);
  revalidatePath("/settings");
  return sent.ok
    ? { ok: true, message: `Saved. We sent a confirmation link to ${row.email}. Reminders start once you click it.` }
    : {
        ok: false,
        message: "Saved, but the confirmation email couldn't be sent. Check the Resend setup and try again.",
      };
}

export async function resendVerification(_prev: ActionState | null): Promise<ActionState> {
  if (getAuthMode() === "demo") return { ok: false, message: DEMO_MESSAGE };
  if (!hasAdminKey()) return { ok: false, message: NO_ADMIN_KEY };
  let userId: string;
  try {
    ({ userId } = await mutationContext());
  } catch (e) {
    if (e instanceof RateLimitError) return { ok: false, message: e.message };
    throw e;
  }
  const row = await readSettings(userId);
  if (!row?.email) return { ok: false, message: "Save an email address first." };
  if (row.email_verified_at) return { ok: true, message: "This address is already confirmed." };
  if (!isEmailConfigured()) return { ok: false, message: NOT_CONFIGURED };
  if (!(await checkRateLimit(`email:${userId}`, "email"))) {
    return { ok: false, message: "Too many emails sent recently. Try again in an hour." };
  }
  const sent = await sendVerification(getAdminSupabase(), userId, row.email);
  return sent.ok
    ? { ok: true, message: `Confirmation link sent to ${row.email}.` }
    : { ok: false, message: "The email couldn't be sent. Check the Resend setup." };
}

export async function sendTestEmail(_prev: ActionState | null): Promise<ActionState> {
  if (getAuthMode() === "demo") return { ok: false, message: DEMO_MESSAGE };
  if (!hasAdminKey()) return { ok: false, message: NO_ADMIN_KEY };
  let userId: string;
  try {
    ({ userId } = await mutationContext());
  } catch (e) {
    if (e instanceof RateLimitError) return { ok: false, message: e.message };
    throw e;
  }
  const row = await readSettings(userId);
  if (!row?.email || !row.email_verified_at) return { ok: false, message: "Confirm your email address first." };
  if (!isEmailConfigured()) return { ok: false, message: "Email sending isn't configured (RESEND_API_KEY)." };
  if (!(await checkRateLimit(`email:${userId}`, "email"))) {
    return { ok: false, message: "Too many emails sent recently. Try again in an hour." };
  }
  const unsub = unsubscribeUrl(row.unsubscribe_token);
  const sent = await sendEmail(row.email, testEmail({ appUrl: getAppUrl(), unsubscribeUrl: unsub }), {
    headers: unsubscribeHeaders(`${getAppUrl()}/api/notifications/unsubscribe?token=${row.unsubscribe_token}`),
  });
  return sent.ok
    ? { ok: true, message: `Test email sent to ${row.email}.` }
    : { ok: false, message: "The email couldn't be sent. Check the Resend setup (API key and sender domain)." };
}
