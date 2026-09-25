import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { urgencyDotClass } from "@/components/ui/badges";
import { buttonClass } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { getUrgency, toISODate, URGENCY_LABELS, type Urgency } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { listTasks } from "@/server/queries";
import { getToday } from "@/server/today";

export const metadata = { title: "Calendar" };

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const sp = await searchParams;
  const [tasks, today] = await Promise.all([listTasks(), getToday()]);
  const monthParam =
    typeof sp.month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.month) ? sp.month : today.slice(0, 7);
  const month = parseISO(`${monthParam}-01`);
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)) });

  const open = tasks.filter((t) => t.status !== "done" && t.next_due_on);
  const byDay = new Map<string, typeof open>();
  for (const t of open) {
    // Overdue tasks are pinned to today so nothing slips off the calendar.
    const key = t.next_due_on! < today ? today : t.next_due_on!;
    byDay.set(key, [...(byDay.get(key) ?? []), t]);
  }

  const prev = format(subMonths(month, 1), "yyyy-MM");
  const next = format(addMonths(month, 1), "yyyy-MM");
  const legend: Urgency[] = ["overdue", "due_soon", "upcoming", "later"];

  return (
    <>
      <PageHeader
        title="Calendar"
        description="What's due when. Overdue items are shown on today."
        action={
          <a href="/api/export/calendar" className={buttonClass("secondary")} download>
            <Download className="size-4" aria-hidden /> Export .ics
          </a>
        }
      />
      <Card className="p-0">
        <div className="border-line flex items-center justify-between border-b px-4 py-3">
          <Link href={`/calendar?month=${prev}`} className={buttonClass("ghost", "sm")} aria-label="Previous month">
            <ChevronLeft className="size-4" aria-hidden />
          </Link>
          <div className="text-center">
            <h2 className="font-semibold">{format(month, "MMMM yyyy")}</h2>
            {monthParam !== today.slice(0, 7) ? (
              <Link href="/calendar" className="text-accent-ink text-xs hover:underline">
                Back to today
              </Link>
            ) : null}
          </div>
          <Link href={`/calendar?month=${next}`} className={buttonClass("ghost", "sm")} aria-label="Next month">
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="border-line text-muted grid grid-cols-7 border-b text-center text-xs font-medium">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const key = toISODate(d);
            const items = byDay.get(key) ?? [];
            const inMonth = isSameMonth(d, month);
            const isToday = key === today;
            return (
              <div
                key={key}
                className={cn(
                  "border-line min-h-20 border-r border-b p-1 sm:min-h-28 sm:p-2 [&:nth-child(7n)]:border-r-0",
                  !inMonth && "bg-surface-2/60",
                )}
              >
                <div
                  className={cn(
                    "mb-1 grid size-6 place-items-center rounded-full text-xs",
                    isToday ? "bg-accent font-semibold text-white" : inMonth ? "text-ink" : "text-muted",
                  )}
                >
                  {d.getDate()}
                </div>
                <ul className="space-y-1">
                  {items.slice(0, 3).map((t) => {
                    const u = getUrgency(t, today);
                    return (
                      <li key={t.id}>
                        <Link
                          href={`/tasks/${t.id}`}
                          title={`${t.title} — ${t.asset.name} (${URGENCY_LABELS[u]})`}
                          className="text-ink hover:bg-surface-2 flex items-center gap-1 truncate rounded px-1 py-0.5 text-[11px]"
                        >
                          <span className={cn("size-1.5 shrink-0 rounded-full", urgencyDotClass(u))} aria-hidden />
                          <span className="truncate">{t.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                  {items.length > 3 ? <li className="text-muted px-1 text-[11px]">+{items.length - 3} more</li> : null}
                </ul>
              </div>
            );
          })}
        </div>
      </Card>
      <ul className="text-ink-2 mt-3 flex flex-wrap gap-4 text-xs" aria-label="Legend">
        {legend.map((u) => (
          <li key={u} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", urgencyDotClass(u))} aria-hidden />
            {URGENCY_LABELS[u]}
          </li>
        ))}
      </ul>
    </>
  );
}
