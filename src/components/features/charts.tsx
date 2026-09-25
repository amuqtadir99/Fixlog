import { AlertTriangle, CheckCircle2, Wrench } from "lucide-react";
import { healthLabel } from "@/lib/domain";
import { cn } from "@/lib/utils";

/** Health score meter: ring on a same-ramp track, status colour + icon + label. */
export function HealthMeter({ score }: { score: number }) {
  const { label, tone } = healthLabel(score);
  const r = 52;
  const c = 2 * Math.PI * r;
  const color = tone === "good" ? "var(--good)" : tone === "warn" ? "var(--warning)" : "var(--critical)";
  const Icon = tone === "good" ? CheckCircle2 : tone === "warn" ? Wrench : AlertTriangle;
  return (
    <div className="flex items-center gap-5">
      <svg
        viewBox="0 0 120 120"
        className="size-28 shrink-0 -rotate-90"
        role="img"
        aria-label={`Health score ${score} of 100`}
      >
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * c} ${c}`}
        />
        <text
          x="60"
          y="60"
          transform="rotate(90 60 60)"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-[var(--ink)] text-[28px] font-semibold"
        >
          {score}
        </text>
      </svg>
      <div>
        <p className="text-muted text-sm">Home health score</p>
        <p className="text-ink mt-1 flex items-center gap-1.5 font-semibold">
          <Icon className="size-4" style={{ color }} aria-hidden />
          {label}
        </p>
        <p className="text-muted mt-1 text-xs">Weighted by priority and how late things are.</p>
      </div>
    </div>
  );
}

/** Horizontal bars (magnitude → one hue). Hover/focus shows the exact values. */
export function CategoryBars({ rows }: { rows: { label: string; emoji: string; open: number; overdue: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.open));
  if (rows.length === 0) return <p className="text-muted text-sm">No open tasks yet.</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li
          key={r.label}
          className="group relative"
          tabIndex={0}
          aria-label={`${r.label}: ${r.open} open, ${r.overdue} overdue`}
        >
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-ink-2">
              <span aria-hidden>{r.emoji}</span> {r.label}
            </span>
            <span className="tabular text-ink">
              {r.open}
              {r.overdue ? <span className="text-critical-ink ml-1.5 text-xs">({r.overdue} overdue)</span> : null}
            </span>
          </div>
          <div className="bg-surface-2 h-2 rounded">
            <div
              className="bg-accent group-hover:bg-accent-ink h-2 rounded transition-[width]"
              style={{ width: `${(r.open / max) * 100}%` }}
            />
          </div>
          <Tooltip>
            {r.label}: {r.open} open · {r.overdue} overdue
          </Tooltip>
        </li>
      ))}
    </ul>
  );
}

/** Monthly spend columns (single series, one axis, baseline-anchored). */
export function SpendColumns({
  months,
  currencyFormat,
}: {
  months: { label: string; cents: number }[];
  currencyFormat: (c: number) => string;
}) {
  const max = Math.max(1, ...months.map((m) => m.cents));
  const total = months.reduce((s, m) => s + m.cents, 0);
  return (
    <div>
      <div
        className="border-line-strong flex h-36 items-end gap-[2px] border-b"
        role="img"
        aria-label={`Spend by month, total ${currencyFormat(total)}`}
      >
        {months.map((m) => (
          <div
            key={m.label}
            className="group relative flex h-full flex-1 items-end"
            tabIndex={0}
            aria-label={`${m.label}: ${currencyFormat(m.cents)}`}
          >
            <div
              className={cn(
                "bg-accent group-hover:bg-accent-ink group-focus:bg-accent-ink w-full rounded-t",
                m.cents === 0 && "bg-transparent",
              )}
              style={{ height: `${(m.cents / max) * 100}%` }}
            />
            <Tooltip>
              {m.label}: {currencyFormat(m.cents)}
            </Tooltip>
          </div>
        ))}
      </div>
      <div className="text-muted mt-1 flex gap-[2px] text-[10px]">
        {months.map((m, i) => (
          <span key={m.label} className="flex-1 text-center">
            {i % 2 === 0 ? m.label.slice(0, 3) : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function Tooltip({ children }: { children: React.ReactNode }) {
  return (
    <span
      role="tooltip"
      className="border-line bg-surface text-ink pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded-md border px-2 py-1 text-xs whitespace-nowrap opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus:opacity-100"
    >
      {children}
    </span>
  );
}
