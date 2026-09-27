import {
  BellRing,
  CalendarDays,
  CheckCircle2,
  History,
  LayoutDashboard,
  ListChecks,
  Package,
  PlusCircle,
  Settings,
} from "lucide-react";
import Link from "next/link";

export const GETTING_STARTED = [
  {
    icon: PlusCircle,
    title: "Add something you own",
    body: "Pick a category and type (a car, the water heater, a smoke alarm…). We suggest a maintenance plan you can tick.",
    href: "/items/new",
    cta: "Add an item",
  },
  {
    icon: CheckCircle2,
    title: "Mark jobs done as you do them",
    body: "Hit “Mark done” on a task to log the date, cost and who did it. Recurring tasks reschedule themselves.",
    href: "/tasks",
    cta: "See tasks",
  },
  {
    icon: LayoutDashboard,
    title: "Check the dashboard",
    body: "It shows what's overdue, what's due this week and this month, and a health score for your home.",
    href: "/dashboard",
    cta: "Open dashboard",
  },
  {
    icon: BellRing,
    title: "Get email reminders",
    body: "Choose an email address and how often you want a summary of what's coming up.",
    href: "/settings",
    cta: "Set up reminders",
  },
] as const;

export const SECTIONS = [
  {
    icon: LayoutDashboard,
    href: "/dashboard",
    label: "Dashboard",
    body: "Overview: overdue work, what's due soon, spend.",
  },
  {
    icon: Package,
    href: "/items",
    label: "Items",
    body: "Everything you track. Open one to see its schedule and history.",
  },
  {
    icon: ListChecks,
    href: "/tasks",
    label: "Tasks",
    body: "Every job across all items. Filter, change status, mark done.",
  },
  {
    icon: CalendarDays,
    href: "/calendar",
    label: "Calendar",
    body: "Month view of due dates. Export to your own calendar.",
  },
  { icon: History, href: "/history", label: "History", body: "Every service or fix you've logged. Export to CSV." },
  { icon: Settings, href: "/settings", label: "Settings", body: "Email reminders: address, how often, how far ahead." },
] as const;

export function GettingStartedSteps() {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {GETTING_STARTED.map(({ icon: Icon, title, body, href, cta }, i) => (
        <li key={title} className="border-line bg-surface flex flex-col rounded-2xl border p-4">
          <div className="flex items-center gap-2">
            <span className="bg-accent-soft text-accent-ink grid size-8 place-items-center rounded-lg">
              <Icon className="size-4" aria-hidden />
            </span>
            <span className="text-muted text-xs font-medium">Step {i + 1}</span>
          </div>
          <h3 className="text-ink mt-3 font-semibold">{title}</h3>
          <p className="text-ink-2 mt-1 flex-1 text-sm">{body}</p>
          <Link href={href} className="text-accent-ink mt-3 text-sm font-medium hover:underline">
            {cta} →
          </Link>
        </li>
      ))}
    </ol>
  );
}

export function SectionGuide() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {SECTIONS.map(({ icon: Icon, href, label, body }) => (
        <li key={href}>
          <Link
            href={href}
            className="border-line bg-surface hover:border-accent flex gap-3 rounded-xl border p-3 transition-colors"
          >
            <Icon className="text-accent-ink mt-0.5 size-5 shrink-0" aria-hidden />
            <span>
              <span className="text-ink block text-sm font-medium">{label}</span>
              <span className="text-muted block text-xs">{body}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
