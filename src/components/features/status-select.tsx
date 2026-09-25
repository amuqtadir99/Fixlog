"use client";

import { useOptimistic, useTransition } from "react";
import { STATUS_LABELS, TASK_STATUSES, type TaskStatus } from "@/lib/domain";
import { setTaskStatus } from "@/server/actions/tasks";
import { cn } from "@/lib/utils";

export function StatusSelect({ id, status, className }: { id: string; status: TaskStatus; className?: string }) {
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [pending, start] = useTransition();
  return (
    <select
      aria-label="Task status"
      value={optimistic}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as TaskStatus;
        start(async () => {
          setOptimistic(next);
          const fd = new FormData();
          fd.set("id", id);
          fd.set("status", next);
          await setTaskStatus(fd);
        });
      }}
      className={cn(
        "border-line bg-surface text-ink focus:border-accent h-8 rounded-lg border px-2 text-xs font-medium focus:outline-none",
        pending && "opacity-60",
        className,
      )}
    >
      {TASK_STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
