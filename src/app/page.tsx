import { Show } from "@clerk/nextjs";
import { BellRing, CalendarDays, History, LayoutDashboard, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { LinkButton } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/catalog";

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Live dashboard",
    body: "See what's overdue, due this week and this month — plus a home health score — at a glance.",
  },
  {
    icon: Sparkles,
    title: "Smart suggestions",
    body: "Pick from 65+ item types and get a ready-made maintenance plan: filters, oil changes, alarm tests…",
  },
  {
    icon: CalendarDays,
    title: "Calendar view",
    body: "A month calendar of everything that's due, exportable to Google, Apple or Outlook calendar.",
  },
  {
    icon: History,
    title: "Full history",
    body: "Every fix with date, cost, who did it and notes. Answer “when did I last…?” in seconds.",
  },
  {
    icon: BellRing,
    title: "Statuses & comments",
    body: "Track in-progress jobs, waiting for parts or pro booked, and keep notes on each task.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    body: "Your data is isolated with database-level row security. Delete your account and it's gone.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <Show
            when="signed-in"
            fallback={
              <>
                <LinkButton href="/sign-in" variant="ghost" size="sm">
                  Sign in
                </LinkButton>
                <LinkButton href="/sign-up" size="sm">
                  Get started
                </LinkButton>
              </>
            }
          >
            <LinkButton href="/dashboard" size="sm">
              Open dashboard
            </LinkButton>
          </Show>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pt-12 pb-16 text-center sm:px-6 sm:pt-20">
          <p className="border-line bg-surface text-ink-2 mx-auto inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
            🔧 Maintenance memory for your home, car & stuff
          </p>
          <h1 className="text-ink mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            When did I last <span className="text-accent">fix this?</span>
          </h1>
          <p className="text-ink-2 mx-auto mt-5 max-w-2xl text-lg text-pretty">
            FixLog remembers every service, repair and filter change — and tells you what&apos;s breaking next, before
            it breaks.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton href="/sign-up" className="h-11 px-6">
              Start free
            </LinkButton>
            <LinkButton href="/sign-in" variant="secondary" className="h-11 px-6">
              I have an account
            </LinkButton>
          </div>
          <ul className="mx-auto mt-12 flex max-w-3xl flex-wrap justify-center gap-2" aria-label="Supported categories">
            {CATEGORIES.map((c) => (
              <li key={c.id} className="border-line bg-surface text-ink-2 rounded-full border px-3 py-1 text-sm">
                <span aria-hidden>{c.emoji}</span> {c.label}
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-24 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="border-line bg-surface rounded-2xl border p-6">
              <span className="bg-accent-soft text-accent-ink grid size-10 place-items-center rounded-xl">
                <Icon className="size-5" aria-hidden />
              </span>
              <h2 className="text-ink mt-4 font-semibold">{title}</h2>
              <p className="text-ink-2 mt-1 text-sm">{body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-line text-muted border-t py-6 text-center text-xs">
        © {new Date().getFullYear()} FixLog · Built with Next.js, Supabase & Clerk
      </footer>
    </div>
  );
}
