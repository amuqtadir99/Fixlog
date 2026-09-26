import { getCurrentUserId } from "@/lib/supabase/server";
import { toIcs } from "@/lib/ics";
import { checkRateLimit } from "@/lib/rate-limit";
import { describeInterval } from "@/lib/domain";
import { listTasks } from "@/server/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  if (!(await checkRateLimit(`export:${userId}`))) return new Response("Too many requests", { status: 429 });

  const origin = new URL(request.url).origin;
  const tasks = await listTasks();
  const ics = toIcs(
    tasks
      .filter((t) => t.status !== "done" && t.next_due_on)
      .map((t) => ({
        uid: t.id,
        date: t.next_due_on!,
        summary: `${t.title} — ${t.asset.name}`,
        description: `${describeInterval(t.interval_value, t.interval_unit)} · priority ${t.priority}`,
        url: `${origin}/tasks/${t.id}`,
      })),
  );
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="fixlog.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
