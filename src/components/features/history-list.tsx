import { Trash2 } from "lucide-react";
import Link from "next/link";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { formatDate, formatMoney } from "@/lib/domain";
import type { ServiceLog, AssetRef } from "@/lib/types";
import { deleteServiceLog } from "@/server/actions/logs";

export function HistoryList({ logs }: { logs: (ServiceLog & { asset?: AssetRef })[] }) {
  if (!logs.length) return <p className="text-muted text-sm">No service recorded yet.</p>;
  return (
    <ol className="border-line relative space-y-5 border-l pl-5">
      {logs.map((l) => (
        <li key={l.id} className="relative">
          <span
            className="bg-accent ring-surface absolute top-1.5 -left-[25px] size-2.5 rounded-full ring-4"
            aria-hidden
          />
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-ink font-medium">
                {l.task_id ? (
                  <Link href={`/tasks/${l.task_id}`} className="hover:underline">
                    {l.title}
                  </Link>
                ) : (
                  l.title
                )}
              </p>
              <p className="text-muted text-xs">
                <time dateTime={l.performed_on}>{formatDate(l.performed_on)}</time>
                {l.asset ? (
                  <>
                    {" · "}
                    <Link href={`/items/${l.asset.id}`} className="hover:underline">
                      {l.asset.name}
                    </Link>
                  </>
                ) : null}
                {l.performed_by ? ` · by ${l.performed_by}` : ""}
                {l.reading ? ` · ${l.reading}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {l.cost_cents != null ? (
                <span className="tabular text-ink text-sm font-medium">{formatMoney(l.cost_cents, l.currency)}</span>
              ) : null}
              <ConfirmButton
                variant="ghost"
                className="px-2"
                action={deleteServiceLog.bind(null, l.id)}
                confirmText="Delete this service record?"
              >
                <Trash2 className="size-4" aria-label="Delete record" />
              </ConfirmButton>
            </div>
          </div>
          {l.notes ? <p className="text-ink-2 mt-1 text-sm whitespace-pre-wrap">{l.notes}</p> : null}
        </li>
      ))}
    </ol>
  );
}
