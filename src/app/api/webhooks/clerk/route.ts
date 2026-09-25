import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Clerk → FixLog webhook (svix-signed; secret in CLERK_WEBHOOK_SIGNING_SECRET).
 * user.deleted: erase all of the user's data (right to erasure).
 */
export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (evt.type === "user.deleted" && evt.data.id) {
    const userId = evt.data.id;
    const supabase = getAdminSupabase();
    // Assets cascade to tasks, logs and comments; delete leftovers defensively.
    for (const table of ["task_comments", "service_logs", "maintenance_tasks", "assets"] as const) {
      const { error } = await supabase.from(table).delete().eq("user_id", userId);
      if (error) {
        console.error(`[webhook] erase ${table} failed:`, error.code, error.message);
        return new Response("Erase failed", { status: 500 }); // Clerk/svix will retry
      }
    }
    console.info(`[webhook] erased data for deleted user`);
  }

  return new Response(null, { status: 204 });
}
