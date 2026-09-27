import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { hashToken, VERIFY_TTL_MS } from "@/server/notifications";

export const dynamic = "force-dynamic";

/** Confirmation link from the verification email. Single use, expires after 24h. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const back = (status: string) => NextResponse.redirect(new URL(`/settings?verify=${status}`, url), 303);
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return back("invalid");

  const admin = getAdminSupabase();
  const { data, error } = await admin
    .from("notification_settings")
    .update({ email_verified_at: new Date().toISOString(), verify_token_hash: null })
    .eq("verify_token_hash", hashToken(token))
    .gt("verify_sent_at", new Date(Date.now() - VERIFY_TTL_MS).toISOString())
    .select("user_id");
  if (error) {
    console.error("[verify]", error.code, error.message);
    return back("error");
  }
  return back(data.length ? "ok" : "invalid");
}
