import Link from "next/link";
import { CategoryChip, PriorityBadge, UrgencyBadge } from "@/components/ui/badges";
import { describeInterval, getUrgency, relativeDue } from "@/lib/domain";
import type { TaskWithAsset } from "@/lib/types";
import { CompleteTaskButton } from "./complete-task";
import { StatusSelect } from "./status-select";

export function TaskList({
  tasks,
  today,
  showAsset = true,
}: {
  tasks: (TaskWithAsset | (Omit<TaskWithAsset, "asset"> & { asset?: undefined }))[];
  today: string;
  showAsset?: boolean;
}) {
  return (
    <ul className="divide-line divide-y">
      {tasks.map((t) => {
        const urgency = getUrgency(t, today);
        return (
          <li key={t.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/tasks/${t.id}`}
                  className="text-ink hover:text-accent-ink truncate font-medium hover:underline"
                >
                  {t.title}
                </Link>
                <UrgencyBadge urgency={urgency} />
                {t.priority === "high" || t.priority === "critical" ? <PriorityBadge priority={t.priority} /> : null}
              </div>
              <div className="text-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                {showAsset && t.asset ? (
                  <>
                    <Link href={`/items/${t.asset.id}`} className="text-ink-2 font-medium hover:underline">
                      {t.asset.name}
                    </Link>
                    <CategoryChip category={t.asset.category} />
                  </>
                ) : null}
                <span className="tabular">{relativeDue(t.next_due_on, today)}</span>
                <span>{describeInterval(t.interval_value, t.interval_unit)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusSelect id={t.id} status={t.status} />
              {t.status !== "done" || t.interval_value ? (
                <CompleteTaskButton taskId={t.id} taskTitle={t.title} today={today} />
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
