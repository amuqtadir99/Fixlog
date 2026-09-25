import { Download } from "lucide-react";
import { HistoryList } from "@/components/features/history-list";
import { ServiceLogButton } from "@/components/features/service-log-form";
import { buttonClass } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { formatMoney } from "@/lib/domain";
import { listAssets, listServiceLogs } from "@/server/queries";
import { getToday } from "@/server/today";

export const metadata = { title: "History" };

export default async function HistoryPage() {
  const [logs, assets, today] = await Promise.all([listServiceLogs({ limit: 500 }), listAssets(), getToday()]);
  const totals = logs.reduce<Record<string, number>>((acc, l) => {
    if (l.cost_cents != null) acc[l.currency] = (acc[l.currency] ?? 0) + l.cost_cents;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Service history"
        description={`${logs.length} record${logs.length === 1 ? "" : "s"}${
          Object.keys(totals).length
            ? ` · ${Object.entries(totals)
                .map(([c, v]) => formatMoney(v, c))
                .join(" + ")} total`
            : ""
        }`}
        action={
          <>
            {assets.length ? <ServiceLogButton assets={assets} today={today} /> : null}
            <a href="/api/export/history" className={buttonClass("secondary")} download>
              <Download className="size-4" aria-hidden /> Export CSV
            </a>
          </>
        }
      />
      {logs.length ? (
        <Card>
          <HistoryList logs={logs} />
        </Card>
      ) : (
        <EmptyState title="No history yet" body="Mark a task done or log a service to start your record." />
      )}
    </>
  );
}
