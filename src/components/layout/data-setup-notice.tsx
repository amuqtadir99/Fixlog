import { DatabaseZap, KeyRound } from "lucide-react";
import type { SetupIssue } from "@/lib/db-errors";

const CONTENT: Record<SetupIssue, { icon: typeof KeyRound; title: string; steps: React.ReactNode[] }> = {
  missing_tables: {
    icon: DatabaseZap,
    title: "The database isn't set up yet",
    steps: [
      <>
        Open your Supabase project → <strong>SQL Editor</strong> → New query.
      </>,
      <>
        Paste and run each file in <code>supabase/migrations/</code> from the repository, <strong>oldest first</strong>.
      </>,
      <>Reload this page.</>,
      <>
        To make this automatic, add the <code>SUPABASE_ACCESS_TOKEN</code>, <code>SUPABASE_PROJECT_ID</code> and{" "}
        <code>SUPABASE_DB_PASSWORD</code> GitHub secrets. Every merge then runs the migrations.
      </>,
    ],
  },
  auth_integration: {
    icon: KeyRound,
    title: "Supabase isn't accepting your sign-in yet",
    steps: [
      <>
        In Clerk, open <strong>Integrations → Supabase</strong> (dashboard.clerk.com/setup/supabase) and click{" "}
        <strong>Activate</strong>. Copy the Clerk domain it shows.
      </>,
      <>
        In Supabase, open <strong>Authentication → Sign In / Providers → Third-party auth</strong>, add{" "}
        <strong>Clerk</strong> and paste that domain.
      </>,
      <>Sign out and back in, then reload this page.</>,
    ],
  },
};

export function DataSetupNotice({ issue }: { issue: SetupIssue }) {
  const { icon: Icon, title, steps } = CONTENT[issue];
  return (
    <div className="border-line bg-surface mx-auto max-w-2xl rounded-2xl border p-6">
      <div className="flex items-center gap-3">
        <span className="bg-warning/20 text-ink grid size-10 place-items-center rounded-xl">
          <Icon className="size-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-ink text-lg font-semibold">{title}</h1>
          <p className="text-muted text-sm">FixLog can&apos;t read or save data until this is fixed.</p>
        </div>
      </div>
      <ol className="text-ink-2 mt-5 list-decimal space-y-2 pl-5 text-sm [&_code]:font-mono [&_code]:text-xs">
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
    </div>
  );
}
