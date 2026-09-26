import { getCurrentUserId } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";
import { checkRateLimit } from "@/lib/rate-limit";
import { typeLabel, categoryLabel } from "@/lib/catalog";
import { listServiceLogs } from "@/server/queries";
import { getToday } from "@/server/today";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  if (!(await checkRateLimit(`export:${userId}`))) return new Response("Too many requests", { status: 429 });

  const logs = await listServiceLogs({ limit: 2000 });
  const csv = toCsv(
    ["Date", "Item", "Category", "Type", "Work done", "Done by", "Cost", "Currency", "Reading", "Notes"],
    logs.map((l) => [
      l.performed_on,
      l.asset.name,
      categoryLabel(l.asset.category),
      typeLabel(l.asset.category, l.asset.item_type),
      l.title,
      l.performed_by,
      l.cost_cents == null ? "" : (l.cost_cents / 100).toFixed(2),
      l.currency,
      l.reading,
      l.notes,
    ]),
  );
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fixlog-history-${await getToday()}.csv"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
