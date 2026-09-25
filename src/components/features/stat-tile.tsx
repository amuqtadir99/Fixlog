import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "neutral" | "critical" | "serious" | "warning" | "good";
  href?: string;
}) {
  const iconTone = {
    neutral: "bg-accent-soft text-accent-ink",
    critical: "bg-critical/12 text-critical-ink",
    serious: "bg-serious/15 text-ink",
    warning: "bg-warning/20 text-ink",
    good: "bg-good/12 text-good-ink",
  }[tone];
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-muted text-sm">{label}</span>
        <span className={cn("grid size-8 place-items-center rounded-lg", iconTone)}>
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="text-ink mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="text-muted mt-1 text-xs">{hint}</p> : null}
    </>
  );
  const cls = "block rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_2px_var(--ring)]";
  return href ? (
    <Link href={href} className={cn(cls, "hover:border-accent transition")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
