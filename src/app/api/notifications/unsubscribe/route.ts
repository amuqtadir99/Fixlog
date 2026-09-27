import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST-only (RFC 8058 one-click, or the button on /unsubscribe) so link
 * scanners that prefetch GET URLs can't unsubscribe people by accident.
 * Always answers the same way, whether or not the token matched.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  if (/^[0-9a-f]{64}$/.test(token)) {
    const { error } = await getAdminSupabase()
      .from("notification_settings")
      .update({ enabled: false })
      .eq("unsubscribe_token", token);
    if (error) console.error("[unsubscribe]", error.code, error.message);
  }
  // Mail providers' one-click POST carries this body; our own form doesn't.
  const oneClick = (await request.text()).includes("List-Unsubscribe=One-Click");
  return oneClick
    ? new Response("Unsubscribed", { status: 200 })
    : NextResponse.redirect(new URL("/unsubscribe?done=1", url), 303);
}
