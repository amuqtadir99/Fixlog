import Link from "next/link";
import { TaskList } from "@/components/features/task-list";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/catalog";
import {
  compareTasks,
  getUrgency,
  PRIORITIES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_STATUSES,
  URGENCY_LABELS,
  type Urgency,
} from "@/lib/domain";
import { listTasks } from "@/server/queries";
import { getToday } from "@/server/today";

export const metadata = { title: "Tasks" };

const URGENCIES: Urgency[] = ["overdue", "due_soon", "upcoming", "later", "unscheduled", "done"];

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

export default async function TasksPage({ searchParams }: PageProps<"/tasks">) {
  const sp = await searchParams;
  const urgency = pick(sp.urgency, URGENCIES);
  const status = pick(sp.status, TASK_STATUSES);
  const priority = pick(sp.priority, PRIORITIES);
  const category = pick(
    sp.category,
    CATEGORIES.map((c) => c.id),
  );

  const [tasks, today] = await Promise.all([listTasks(), getToday()]);
  const filtered = tasks
    // Default view hides finished one-off tasks unless a status/urgency is chosen.
    .filter((t) => (urgency ? getUrgency(t, today) === urgency : status ? true : t.status !== "done"))
    .filter((t) => !status || t.status === status)
    .filter((t) => !priority || t.priority === priority)
    .filter((t) => !category || t.asset.category === category)
    .sort(compareTasks(today));

  const counts = Object.fromEntries(URGENCIES.map((u) => [u, tasks.filter((t) => getUrgency(t, today) === u).length]));

  return (
    <>
      <PageHeader title="Tasks" description="Every scheduled job across your items." />

      <div className="mb-4 flex flex-wrap gap-1.5" aria-label="Filter by urgency">
        <Chip href="/tasks" active={!urgency && !status}>
          Open
        </Chip>
        {URGENCIES.map((u) => (
          <Chip key={u} href={`/tasks?urgency=${u}`} active={urgency === u}>
            {URGENCY_LABELS[u]} <span className="tabular text-muted">{counts[u]}</span>
          </Chip>
        ))}
      </div>

      <form className="mb-4 flex flex-wrap gap-2 text-sm">
        {urgency ? <input type="hidden" name="urgency" value={urgency} /> : null}
        <FilterSelect
          name="status"
          label="Status"
          value={status}
          options={TASK_STATUSES.map((s) => [s, STATUS_LABELS[s]])}
        />
        <FilterSelect
          name="priority"
          label="Priority"
          value={priority}
          options={PRIORITIES.map((p) => [p, PRIORITY_LABELS[p]])}
        />
        <FilterSelect
          name="category"
          label="Category"
          value={category}
          options={CATEGORIES.map((c) => [c.id, c.label])}
        />
        <button
          type="submit"
          className="border-line bg-surface hover:bg-surface-2 h-9 rounded-lg border px-3 font-medium"
        >
          Apply
        </button>
        {status || priority || category ? (
          <Link
            href={urgency ? `/tasks?urgency=${urgency}` : "/tasks"}
            className="text-muted self-center hover:underline"
          >
            Clear
          </Link>
        ) : null}
      </form>

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          body="Add an item and pick suggested maintenance to get started."
          action={<LinkButton href="/items/new">Add item</LinkButton>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="Nothing here" body="No tasks match these filters." />
      ) : (
        <Card>
          <TaskList tasks={filtered} today={today} />
        </Card>
      )}
    </>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "border-accent bg-accent-soft text-accent-ink rounded-full border px-3 py-1 text-xs font-medium"
          : "border-line bg-surface text-ink-2 hover:bg-surface-2 rounded-full border px-3 py-1 text-xs font-medium"
      }
    >
      {children}
    </Link>
  );
}

function FilterSelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value?: string;
  options: [string, string][];
}) {
  return (
    <select
      name={name}
      aria-label={label}
      defaultValue={value ?? ""}
      className="border-line bg-surface text-ink focus:border-accent h-9 rounded-lg border px-2 text-sm focus:outline-none"
    >
      <option value="">{label}: any</option>
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}
