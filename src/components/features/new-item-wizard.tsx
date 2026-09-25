"use client";

import { ArrowLeft, Check, Search } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormMessage, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { CATEGORIES, type Category, type ItemType } from "@/lib/catalog";
import { addInterval, describeInterval, PRIORITY_LABELS } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { createAsset } from "@/server/actions/assets";
import { AssetDetailFields } from "./asset-fields";

type Step = "category" | "type" | "details";

interface Selection {
  enabled: boolean;
  lastDone: string;
}

export function NewItemWizard({ today }: { today: string }) {
  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState<Category | null>(null);
  const [itemType, setItemType] = useState<ItemType | null>(null);
  const [query, setQuery] = useState("");
  const [selections, setSelections] = useState<Selection[]>([]);
  const [state, action] = useActionState(createAsset, null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return CATEGORIES.flatMap((c) =>
      c.types.filter((t) => t.label.toLowerCase().includes(q)).map((t) => ({ category: c, type: t })),
    ).slice(0, 12);
  }, [query]);

  function pickType(c: Category, t: ItemType) {
    setCategory(c);
    setItemType(t);
    setSelections(t.tasks.map(() => ({ enabled: true, lastDone: "" })));
    setStep("details");
  }

  const tasksPayload = useMemo(() => {
    if (!itemType) return "[]";
    return JSON.stringify(
      itemType.tasks.flatMap((t, i) => {
        const sel = selections[i];
        if (!sel?.enabled) return [];
        return [
          {
            title: t.title,
            interval_value: t.every,
            interval_unit: t.unit,
            priority: t.priority,
            next_due_on: sel.lastDone ? addInterval(sel.lastDone, t.every, t.unit) : today,
          },
        ];
      }),
    );
  }, [itemType, selections, today]);

  return (
    <div className="space-y-6">
      <ol className="flex items-center gap-2 text-sm" aria-label="Progress">
        {(["category", "type", "details"] as Step[]).map((s, i) => {
          const idx = ["category", "type", "details"].indexOf(step);
          return (
            <li key={s} className="flex items-center gap-2">
              <span
                className={cn(
                  "grid size-6 place-items-center rounded-full text-xs font-semibold",
                  i < idx ? "bg-good text-white" : i === idx ? "bg-accent text-white" : "bg-surface-2 text-muted",
                )}
                aria-current={i === idx ? "step" : undefined}
              >
                {i < idx ? <Check className="size-3.5" aria-hidden /> : i + 1}
              </span>
              <span className={i === idx ? "text-ink font-medium" : "text-muted"}>
                {s === "category" ? "Category" : s === "type" ? "Type" : "Details & schedule"}
              </span>
              {i < 2 ? <span className="bg-line-strong mx-1 h-px w-6" aria-hidden /> : null}
            </li>
          );
        })}
      </ol>

      {step === "category" && (
        <div className="space-y-6">
          <div className="relative max-w-md">
            <Search
              className="text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              aria-label="Search item types"
              placeholder="Search: water heater, car, smoke detector…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {matches.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map(({ category: c, type: t }) => (
                <button
                  key={`${c.id}:${t.id}`}
                  type="button"
                  onClick={() => pickType(c, t)}
                  className="border-line bg-surface hover:border-accent flex items-center gap-3 rounded-xl border p-3 text-left"
                >
                  <span className="text-xl" aria-hidden>
                    {c.emoji}
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{t.label}</span>
                    <span className="text-muted block text-xs">{c.label}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCategory(c);
                    setStep("type");
                  }}
                  className="group border-line bg-surface hover:border-accent flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="text-2xl" aria-hidden>
                    {c.emoji}
                  </span>
                  <span className="font-medium">{c.label}</span>
                  <span className="text-muted text-xs">{c.types.length} types</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === "type" && category && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setStep("category")}>
            <ArrowLeft className="size-4" aria-hidden /> All categories
          </Button>
          <h2 className="text-lg font-semibold">
            <span aria-hidden>{category.emoji}</span> {category.label}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {category.types.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => pickType(category, t)}
                className="border-line bg-surface hover:border-accent rounded-xl border p-4 text-left transition hover:shadow-md"
              >
                <span className="block font-medium">{t.label}</span>
                <span className="text-muted mt-1 block text-xs">
                  {t.tasks.length ? `${t.tasks.length} suggested tasks` : "Add your own tasks"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "details" && category && itemType && (
        <form action={action} className="space-y-6">
          <input type="hidden" name="category" value={category.id} />
          <input type="hidden" name="item_type" value={itemType.id} />
          <input type="hidden" name="tasks" value={tasksPayload} />

          <Button variant="ghost" size="sm" onClick={() => setStep(category.types.length > 1 ? "type" : "category")}>
            <ArrowLeft className="size-4" aria-hidden /> Change type
          </Button>

          <Card>
            <h2 className="mb-4 font-semibold">
              <span aria-hidden>{category.emoji}</span> {itemType.label}
            </h2>
            <AssetDetailFields
              asset={{ name: itemType.id === "custom" ? "" : itemType.label }}
              errors={state?.fieldErrors}
            />
          </Card>

          {itemType.tasks.length > 0 && (
            <Card>
              <h2 className="font-semibold">Suggested maintenance</h2>
              <p className="text-muted mt-0.5 mb-4 text-sm">
                Tick what applies. If you know when it was last done we&apos;ll schedule the next one; otherwise
                it&apos;s due today.
              </p>
              <ul className="divide-line divide-y">
                {itemType.tasks.map((t, i) => {
                  const sel = selections[i] ?? { enabled: false, lastDone: "" };
                  const nextDue = sel.lastDone ? addInterval(sel.lastDone, t.every, t.unit) : today;
                  return (
                    <li key={t.title} className="flex flex-wrap items-center gap-3 py-3">
                      <label className="flex min-w-0 flex-1 items-center gap-3">
                        <input
                          type="checkbox"
                          checked={sel.enabled}
                          onChange={(e) =>
                            setSelections((s) => s.map((x, j) => (j === i ? { ...x, enabled: e.target.checked } : x)))
                          }
                          className="size-4 accent-[var(--accent)]"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">{t.title}</span>
                          <span className="text-muted block text-xs">
                            {describeInterval(t.every, t.unit)} · {PRIORITY_LABELS[t.priority]} priority
                          </span>
                        </span>
                      </label>
                      {sel.enabled && (
                        <div className="text-muted flex items-center gap-2 text-xs">
                          <label htmlFor={`last-${i}`}>Last done</label>
                          <Input
                            id={`last-${i}`}
                            type="date"
                            max={today}
                            value={sel.lastDone}
                            onChange={(e) =>
                              setSelections((s) => s.map((x, j) => (j === i ? { ...x, lastDone: e.target.value } : x)))
                            }
                            className="h-8 w-40 text-xs"
                          />
                          <span className="tabular w-28">→ next {nextDue}</span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          <FormMessage state={state && !state.ok ? state : null} />
          <div className="flex justify-end">
            <SubmitButton pendingText="Creating…">Create item</SubmitButton>
          </div>
        </form>
      )}
    </div>
  );
}
