import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import Link from "next/link";
import { EditAssetButton } from "@/components/features/edit-asset";
import { HistoryList } from "@/components/features/history-list";
import { ServiceLogButton } from "@/components/features/service-log-form";
import { NewTaskButton } from "@/components/features/task-form";
import { TaskList } from "@/components/features/task-list";
import { CategoryChip } from "@/components/ui/badges";
import { Card, CardHeader, PageHeader } from "@/components/ui/card";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { typeLabel } from "@/lib/catalog";
import { compareTasks, formatDate, formatMoney } from "@/lib/domain";
import { deleteAsset, setAssetArchived } from "@/server/actions/assets";
import { getAssetDetail } from "@/server/queries";
import { getToday } from "@/server/today";

export default async function ItemPage({ params }: PageProps<"/items/[id]">) {
  const { id } = await params;
  const [{ asset, tasks, logs }, today] = await Promise.all([getAssetDetail(id), getToday()]);
  const sorted = [...tasks].sort(compareTasks(today));
  const spend = logs.reduce<Record<string, number>>((acc, l) => {
    if (l.cost_cents != null) acc[l.currency] = (acc[l.currency] ?? 0) + l.cost_cents;
    return acc;
  }, {});
  const warrantyActive = asset.warranty_until && asset.warranty_until >= today;

  const details: [string, string | null][] = [
    ["Type", typeLabel(asset.category, asset.item_type)],
    ["Location", asset.location],
    ["Brand", asset.brand],
    ["Model", asset.model],
    ["Serial", asset.serial_number],
    ["Purchased", asset.purchased_on ? formatDate(asset.purchased_on) : null],
    [
      "Warranty",
      asset.warranty_until ? `${formatDate(asset.warranty_until)}${warrantyActive ? " (active)" : " (expired)"}` : null,
    ],
    ["Last serviced", logs[0] ? formatDate(logs[0].performed_on) : "Never"],
    [
      "Total spent",
      Object.entries(spend)
        .map(([c, v]) => formatMoney(v, c))
        .join(" + ") || null,
    ],
  ];

  return (
    <>
      <nav className="text-muted mb-2 text-sm">
        <Link href="/items" className="hover:underline">
          Items
        </Link>{" "}
        / {asset.name}
      </nav>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {asset.name} <CategoryChip category={asset.category} />
            {asset.archived ? (
              <span className="bg-surface-2 text-muted rounded-full px-2 py-0.5 text-xs">Archived</span>
            ) : null}
          </span>
        }
        action={
          <>
            <ServiceLogButton assetId={asset.id} today={today} />
            <NewTaskButton assetId={asset.id} defaultDue={today} />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title="Maintenance schedule"
              description={`${tasks.length} task${tasks.length === 1 ? "" : "s"}`}
            />
            {sorted.length ? (
              <TaskList tasks={sorted} today={today} showAsset={false} />
            ) : (
              <p className="text-muted text-sm">No tasks yet — add one to start tracking.</p>
            )}
          </Card>
          <Card>
            <CardHeader title="Service history" description="When did I last fix this? Right here." />
            <HistoryList logs={logs} />
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader title="Details" action={<EditAssetButton asset={asset} />} />
          <dl className="space-y-2 text-sm">
            {details
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-ink text-right">{v}</dd>
                </div>
              ))}
          </dl>
          {asset.notes ? <p className="text-ink-2 mt-4 text-sm whitespace-pre-wrap">{asset.notes}</p> : null}
          <div className="border-line mt-6 flex flex-wrap gap-2 border-t pt-4">
            <ConfirmButton
              variant="secondary"
              action={setAssetArchived.bind(null, asset.id, !asset.archived)}
              confirmText={
                asset.archived
                  ? "Restore this item?"
                  : "Archive this item? Its tasks will be hidden from the dashboard."
              }
            >
              {asset.archived ? (
                <ArchiveRestore className="size-4" aria-hidden />
              ) : (
                <Archive className="size-4" aria-hidden />
              )}
              {asset.archived ? "Restore" : "Archive"}
            </ConfirmButton>
            <ConfirmButton
              action={deleteAsset.bind(null, asset.id)}
              confirmText="Delete this item and ALL its tasks, history and comments? This cannot be undone."
            >
              <Trash2 className="size-4" aria-hidden /> Delete
            </ConfirmButton>
          </div>
        </Card>
      </div>
    </>
  );
}
