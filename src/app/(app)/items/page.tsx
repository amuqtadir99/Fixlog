import { Plus } from "lucide-react";
import Link from "next/link";
import { CategoryChip } from "@/components/ui/badges";
import { LinkButton } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/card";
import { CATEGORIES, typeLabel } from "@/lib/catalog";
import { getUrgency } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { listAssets, listTasks } from "@/server/queries";
import { getToday } from "@/server/today";

export const metadata = { title: "Items" };

export default async function ItemsPage({ searchParams }: PageProps<"/items">) {
  const sp = await searchParams;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase().slice(0, 100) : "";
  const showArchived = sp.archived === "1";

  const [assets, tasks, today] = await Promise.all([listAssets({ archived: showArchived }), listTasks(), getToday()]);
  const filtered = assets.filter(
    (a) =>
      (!category || a.category === category) &&
      (!q || a.name.toLowerCase().includes(q) || (a.location ?? "").toLowerCase().includes(q)),
  );
  const presentCategories = CATEGORIES.filter((c) => assets.some((a) => a.category === c.id));

  return (
    <>
      <PageHeader
        title={showArchived ? "Archived items" : "Items"}
        description="Everything you own and maintain."
        action={
          <LinkButton href="/items/new">
            <Plus className="size-4" aria-hidden /> Add item
          </LinkButton>
        }
      />

      <form className="mb-4 flex flex-wrap items-center gap-2" role="search">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search items…"
          aria-label="Search items"
          className="border-line bg-surface focus:border-accent h-9 w-full max-w-xs rounded-lg border px-3 text-sm focus:outline-none"
        />
        {category ? <input type="hidden" name="category" value={category} /> : null}
        {showArchived ? <input type="hidden" name="archived" value="1" /> : null}
        <div className="flex flex-wrap gap-1.5">
          <FilterLink href={showArchived ? "/items?archived=1" : "/items"} active={!category}>
            All
          </FilterLink>
          {presentCategories.map((c) => (
            <FilterLink
              key={c.id}
              href={`/items?category=${c.id}${showArchived ? "&archived=1" : ""}`}
              active={category === c.id}
            >
              {c.emoji} {c.label}
            </FilterLink>
          ))}
        </div>
        <Link
          href={showArchived ? "/items" : "/items?archived=1"}
          className="text-muted ml-auto text-sm hover:underline"
        >
          {showArchived ? "Show active" : "Show archived"}
        </Link>
      </form>

      {filtered.length === 0 ? (
        <EmptyState
          title={assets.length ? "No items match" : showArchived ? "No archived items" : "No items yet"}
          action={!assets.length && !showArchived ? <LinkButton href="/items/new">Add an item</LinkButton> : undefined}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => {
            const own = tasks.filter((t) => t.asset_id === a.id && t.status !== "done");
            const overdue = own.filter((t) => getUrgency(t, today) === "overdue").length;
            const soon = own.filter((t) => getUrgency(t, today) === "due_soon").length;
            return (
              <Link
                key={a.id}
                href={`/items/${a.id}`}
                className="border-line bg-surface hover:border-accent rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-ink truncate font-semibold">{a.name}</p>
                    <p className="text-muted truncate text-xs">
                      {typeLabel(a.category, a.item_type)}
                      {a.location ? ` · ${a.location}` : ""}
                    </p>
                  </div>
                  <CategoryChip category={a.category} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="bg-surface-2 text-ink-2 rounded-full px-2 py-0.5">{own.length} open</span>
                  {overdue ? (
                    <span className="bg-critical/12 text-critical-ink rounded-full px-2 py-0.5 font-medium">
                      ⚠ {overdue} overdue
                    </span>
                  ) : null}
                  {soon ? (
                    <span className="bg-serious/15 text-ink rounded-full px-2 py-0.5">⏰ {soon} this week</span>
                  ) : null}
                  {!overdue && !soon && own.length ? (
                    <span className="bg-good/12 text-good-ink rounded-full px-2 py-0.5">✓ On track</span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium",
        active
          ? "border-accent bg-accent-soft text-accent-ink"
          : "border-line bg-surface text-ink-2 hover:bg-surface-2",
      )}
    >
      {children}
    </Link>
  );
}
