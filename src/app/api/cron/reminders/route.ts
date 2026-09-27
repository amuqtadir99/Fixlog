import { timingSafeEqual } from "node:crypto";
import { isEmailConfigured } from "@/lib/email/resend";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { runReminders } from "@/server/notifications";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Vercel Cron (vercel.json) calls this daily with `Authorization: Bearer $CRON_SECRET`. */
export async function GET(request: Request) {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  if (!isEmailConfigured()) return Response.json({ skipped: "RESEND_API_KEY not set" });
  const result = await runReminders(getAdminSupabase());
  console.info("[reminders]", JSON.stringify(result));
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
