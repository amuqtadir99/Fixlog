import { AlertTriangle, CalendarClock, CheckCircle2, CircleDashed, Clock, Flame } from "lucide-react";
import { categoryLabel, getCategory } from "@/lib/catalog";
import { PRIORITY_LABELS, STATUS_LABELS, URGENCY_LABELS, type TaskStatus, type Urgency } from "@/lib/domain";
import { cn } from "@/lib/utils";

const pill = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap";

/** Status colours always ship with an icon + label (never colour alone). */
export function UrgencyBadge({ urgency, className }: { urgency: Urgency; className?: string }) {
  const map: Record<Urgency, { icon: typeof Clock; cls: string }> = {
    overdue: { icon: AlertTriangle, cls: "bg-critical/12 text-critical-ink ring-1 ring-critical/30" },
    due_soon: { icon: Clock, cls: "bg-serious/15 text-ink ring-1 ring-serious/40" },
    upcoming: { icon: CalendarClock, cls: "bg-warning/15 text-ink ring-1 ring-warning/40" },
    later: { icon: CalendarClock, cls: "bg-surface-2 text-ink-2 ring-1 ring-line" },
    unscheduled: { icon: CircleDashed, cls: "bg-surface-2 text-muted ring-1 ring-line" },
    done: { icon: CheckCircle2, cls: "bg-good/12 text-good-ink ring-1 ring-good/30" },
  };
  const { icon: Icon, cls } = map[urgency];
  return (
    <span className={cn(pill, cls, className)}>
      <Icon className="size-3.5" aria-hidden />
      {URGENCY_LABELS[urgency]}
    </span>
  );
}

export function urgencyDotClass(u: Urgency): string {
  return {
    overdue: "bg-critical",
    due_soon: "bg-serious",
    upcoming: "bg-warning",
    later: "bg-accent",
    unscheduled: "bg-line-strong",
    done: "bg-good",
  }[u];
}

export function PriorityBadge({ priority }: { priority: string }) {
  const label = PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS] ?? priority;
  return (
    <span
      className={cn(
        pill,
        "ring-line ring-1",
        priority === "critical" ? "text-critical-ink" : priority === "high" ? "text-ink" : "text-ink-2",
      )}
    >
      {priority === "critical" || priority === "high" ? <Flame className="size-3.5" aria-hidden /> : null}
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(pill, "bg-accent-soft text-accent-ink")}>{STATUS_LABELS[status as TaskStatus] ?? status}</span>
  );
}

export function CategoryChip({ category }: { category: string }) {
  const c = getCategory(category);
  return (
    <span className={cn(pill, "bg-surface-2 text-ink-2")}>
      <span aria-hidden>{c?.emoji ?? "📦"}</span>
      {categoryLabel(category)}
    </span>
  );
}
