import { AlertTriangle, CalendarClock, Clock, Package, Wallet } from "lucide-react";
import Link from "next/link";
import { CategoryBars, HealthMeter, SpendColumns } from "@/components/features/charts";
import { ServiceLogButton } from "@/components/features/service-log-form";
import { StatTile } from "@/components/features/stat-tile";
import { TaskList } from "@/components/features/task-list";
import { LinkButton } from "@/components/ui/button";
import { Card, CardHeader, PageHeader } from "@/components/ui/card";
import { GettingStartedSteps, SectionGuide } from "@/components/features/guide";
import { SampleDataButton } from "@/components/features/sample-data-button";
import { CATEGORIES } from "@/lib/catalog";
import { compareTasks, formatDate, formatMoney, getUrgency, healthScore } from "@/lib/domain";
import { listAssets, listServiceLogs, listTasks } from "@/server/queries";
import { getToday } from "@/server/today";
import { format, parseISO, subMonths } from "date-fns";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const today = await getToday();
  const yearStart = `${today.slice(0, 4)}-01-01`;
  const twelveMonthsAgo = format(subMonths(parseISO(today), 11), "yyyy-MM-01");
  const since = yearStart < twelveMonthsAgo ? yearStart : twelveMonthsAgo;

  const [assets, tasks, logs] = await Promise.all([listAssets(), listTasks(), listServiceLogs({ since, limit: 2000 })]);

  if (assets.length === 0) {
    return (
      <>
        <PageHeader
          title="Welcome to FixLog 👋"
          description="FixLog remembers when you last serviced or fixed things, and tells you what's due next."
        />
        <Card className="mb-6">
          <CardHeader
            title="Get started in 4 steps"
            description="Most people start by adding their car or home systems."
          />
          <GettingStartedSteps />
          <div className="border-line mt-5 flex flex-wrap items-start gap-3 border-t pt-5">
            <LinkButton href="/items/new">Add your first item</LinkButton>
            <SampleDataButton />
            <p className="text-muted basis-full text-xs">
              Sample data adds a car, a fridge, a smoke alarm and an AC unit with realistic schedules, so you can see
              how the dashboard works. Delete them any time from each item&apos;s page.
            </p>
          </div>
        </Card>
        <h2 className="text-ink mb-3 text-base font-semibold">Where things are</h2>
        <SectionGuide />
      </>
    );
  }

  const open = tasks.filter((t) => t.status !== "done");
  const byUrgency = (u: string) => open.filter((t) => getUrgency(t, today) === u);
  const overdue = byUrgency("overdue");
  const dueSoon = byUrgency("due_soon");
  const upcoming = byUrgency("upcoming");
  const score = healthScore(tasks, today);

  const attention = [...overdue, ...dueSoon].sort(compareTasks(today)).slice(0, 8);

  // Spend: this year (headline) and last 12 months (chart). Mixed currencies are
  // summed only for the dominant currency to avoid misleading totals.
  const currency = mostCommon(logs.map((l) => l.currency)) ?? "USD";
  const spendThisYear = logs
    .filter((l) => l.currency === currency && l.performed_on >= yearStart)
    .reduce((s, l) => s + (l.cost_cents ?? 0), 0);
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(parseISO(today), 11 - i);
    const key = format(d, "yyyy-MM");
    return {
      label: format(d, "MMM yyyy"),
      cents: logs
        .filter((l) => l.currency === currency && l.performed_on.startsWith(key))
        .reduce((s, l) => s + (l.cost_cents ?? 0), 0),
    };
  });

  const categoryRows = CATEGORIES.map((c) => {
    const inCat = open.filter((t) => t.asset.category === c.id);
    return {
      label: c.label,
      emoji: c.emoji,
      open: inCat.length,
      overdue: inCat.filter((t) => getUrgency(t, today) === "overdue").length,
    };
  })
    .filter((r) => r.open > 0)
    .sort((a, b) => b.open - a.open);

  const recent = logs.slice(0, 6);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Today is ${formatDate(today)}. Here's what needs your attention.`}
        action={<ServiceLogButton assets={assets} today={today} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile
          label="Overdue"
          value={overdue.length}
          icon={AlertTriangle}
          tone={overdue.length ? "critical" : "good"}
          href="/tasks?urgency=overdue"
          hint={overdue.length ? "Fix these first" : "All caught up"}
        />
        <StatTile
          label="Due this week"
          value={dueSoon.length}
          icon={Clock}
          tone={dueSoon.length ? "serious" : "neutral"}
          href="/tasks?urgency=due_soon"
        />
        <StatTile
          label="Due this month"
          value={upcoming.length}
          icon={CalendarClock}
          tone={upcoming.length ? "warning" : "neutral"}
          href="/tasks?urgency=upcoming"
        />
        <StatTile
          label="Items tracked"
          value={assets.length}
          icon={Package}
          href="/items"
          hint={`${open.length} open tasks`}
        />
        <StatTile
          label={`Spent in ${today.slice(0, 4)}`}
          value={formatMoney(spendThisYear, currency)}
          icon={Wallet}
          href="/history"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Needs attention"
            description="Overdue and due within 7 days"
            action={
              <Link href="/tasks" className="text-accent-ink text-sm font-medium hover:underline">
                All tasks →
              </Link>
            }
          />
          {attention.length ? (
            <TaskList tasks={attention} today={today} />
          ) : (
            <p className="text-muted py-6 text-center text-sm">🎉 Nothing urgent. Enjoy the peace and quiet.</p>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <HealthMeter score={score} />
          </Card>
          <Card>
            <CardHeader title="Open tasks by category" />
            <CategoryBars rows={categoryRows} />
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader title="Maintenance spend" description={`Last 12 months · ${currency}`} />
          <SpendColumns months={months} currencyFormat={(c) => formatMoney(c, currency)} />
        </Card>

        <Card>
          <CardHeader
            title="Recent activity"
            action={
              <Link href="/history" className="text-accent-ink text-sm font-medium hover:underline">
                History →
              </Link>
            }
          />
          {recent.length ? (
            <ul className="space-y-3">
              {recent.map((l) => (
                <li key={l.id} className="text-sm">
                  <p className="text-ink font-medium">{l.title}</p>
                  <p className="text-muted text-xs">
                    <Link href={`/items/${l.asset.id}`} className="hover:underline">
                      {l.asset.name}
                    </Link>{" "}
                    · {formatDate(l.performed_on)}
                    {l.cost_cents != null ? ` · ${formatMoney(l.cost_cents, l.currency)}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted text-sm">No service recorded yet.</p>
          )}
        </Card>
      </div>
    </>
  );
}

function mostCommon(values: string[]): string | undefined {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}
