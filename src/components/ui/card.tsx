import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn("border-line bg-surface rounded-2xl border p-5 shadow-[0_1px_2px_var(--ring)]", className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-ink text-base font-semibold">{title}</h2>
        {description ? <p className="text-muted mt-0.5 text-sm">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-ink text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-ink-2 mt-1 text-sm">{description}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="border-line-strong bg-surface rounded-2xl border border-dashed px-6 py-12 text-center">
      <p className="text-ink font-medium">{title}</p>
      {body ? <p className="text-muted mx-auto mt-1 max-w-md text-sm">{body}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
