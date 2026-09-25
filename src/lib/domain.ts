/**
 * Pure domain logic (no I/O). Dates are ISO `YYYY-MM-DD` strings in the
 * user's local calendar, so no timezone math is needed beyond "today".
 */
import { addDays, addMonths, addWeeks, addYears, differenceInCalendarDays, format, parseISO } from "date-fns";
import type { IntervalUnit, Priority } from "./catalog";

export const TASK_STATUSES = ["pending", "in_progress", "waiting_parts", "scheduled_pro", "on_hold", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  waiting_parts: "Waiting for parts",
  scheduled_pro: "Pro booked",
  on_hold: "On hold",
  done: "Done",
};

export const PRIORITIES = ["low", "medium", "high", "critical"] as const;
export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const INTERVAL_UNITS = ["day", "week", "month", "year"] as const;

export type Urgency = "overdue" | "due_soon" | "upcoming" | "later" | "unscheduled" | "done";

export const URGENCY_LABELS: Record<Urgency, string> = {
  overdue: "Overdue",
  due_soon: "Due this week",
  upcoming: "Due this month",
  later: "Later",
  unscheduled: "No date",
  done: "Done",
};

export const DUE_SOON_DAYS = 7;
export const UPCOMING_DAYS = 30;

export function toISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** Today's date in the given IANA timezone (falls back to UTC). */
export function todayInTimeZone(timeZone: string | undefined, now: Date = new Date()): string {
  try {
    // en-CA formats as YYYY-MM-DD.
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

export function daysUntil(dueOn: string, today: string): number {
  return differenceInCalendarDays(parseISO(dueOn), parseISO(today));
}

export function getUrgency(task: { next_due_on: string | null; status: TaskStatus | string }, today: string): Urgency {
  if (task.status === "done") return "done";
  if (!task.next_due_on) return "unscheduled";
  const days = daysUntil(task.next_due_on, today);
  if (days < 0) return "overdue";
  if (days <= DUE_SOON_DAYS) return "due_soon";
  if (days <= UPCOMING_DAYS) return "upcoming";
  return "later";
}

export function addInterval(fromISO: string, every: number, unit: IntervalUnit): string {
  const d = parseISO(fromISO);
  const next =
    unit === "day"
      ? addDays(d, every)
      : unit === "week"
        ? addWeeks(d, every)
        : unit === "month"
          ? addMonths(d, every)
          : addYears(d, every);
  return toISODate(next);
}

export function describeInterval(every: number | null, unit: IntervalUnit | string | null): string {
  if (!every || !unit) return "One-off";
  if (every === 1) return `Every ${unit}`;
  return `Every ${every} ${unit}s`;
}

export function relativeDue(dueOn: string | null, today: string): string {
  if (!dueOn) return "No due date";
  const days = daysUntil(dueOn, today);
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days === -1) return "1 day overdue";
  if (days < 0) return `${-days} days overdue`;
  if (days < 60) return `In ${days} days`;
  return `In ${Math.round(days / 30)} months`;
}

/**
 * 0–100 score. Starts at 100; overdue tasks cost more the more critical and
 * later they are, due-soon tasks cost a little. Empty portfolio = 100.
 */
export function healthScore(
  tasks: { next_due_on: string | null; status: string; priority: string }[],
  today: string,
): number {
  const open = tasks.filter((t) => t.status !== "done");
  if (open.length === 0) return 100;
  const weight: Record<string, number> = { low: 0.5, medium: 1, high: 1.5, critical: 2.5 };
  let penalty = 0;
  let max = 0;
  for (const t of open) {
    const w = weight[t.priority] ?? 1;
    max += w * 3;
    const u = getUrgency(t as { next_due_on: string | null; status: TaskStatus }, today);
    if (u === "overdue") {
      const late = -daysUntil(t.next_due_on!, today);
      penalty += w * (late > 30 ? 3 : late > 7 ? 2.5 : 2);
    } else if (u === "due_soon") {
      penalty += w * 0.5;
    }
  }
  return Math.max(0, Math.min(100, Math.round(100 - (penalty / max) * 100)));
}

export function healthLabel(score: number): { label: string; tone: "good" | "warn" | "bad" } {
  if (score >= 85) return { label: "Excellent", tone: "good" };
  if (score >= 65) return { label: "Needs a little love", tone: "warn" };
  return { label: "Needs attention", tone: "bad" };
}

export function formatMoney(cents: number | null | undefined, currency = "USD"): string {
  if (cents == null) return "—";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return format(parseISO(iso), "MMM d, yyyy");
}

const URGENCY_ORDER: Record<Urgency, number> = {
  overdue: 0,
  due_soon: 1,
  upcoming: 2,
  later: 3,
  unscheduled: 4,
  done: 5,
};
const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

/** Sort by urgency, then due date, then priority. */
export function compareTasks<T extends { next_due_on: string | null; status: string; priority: string }>(
  today: string,
) {
  return (a: T, b: T): number => {
    const ua = URGENCY_ORDER[getUrgency(a, today)];
    const ub = URGENCY_ORDER[getUrgency(b, today)];
    if (ua !== ub) return ua - ub;
    if (a.next_due_on && b.next_due_on && a.next_due_on !== b.next_due_on) {
      return a.next_due_on < b.next_due_on ? -1 : 1;
    }
    return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
  };
}
