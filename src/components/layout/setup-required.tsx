import { Wrench } from "lucide-react";

/** Shown instead of a crash when required environment variables are missing. */
export function SetupRequired({ missing }: { missing: string[] }) {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="border-line bg-surface w-full max-w-xl rounded-2xl border p-6">
        <div className="flex items-center gap-3">
          <span className="bg-accent grid size-10 place-items-center rounded-xl text-white">
            <Wrench className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-ink text-lg font-semibold">FixLog needs a little setup</h1>
            <p className="text-muted text-sm">Add these environment variables in Vercel, then redeploy.</p>
          </div>
        </div>
        <ul className="mt-5 space-y-2">
          {missing.map((m) => (
            <li key={m} className="bg-surface-2 text-ink rounded-lg px-3 py-2 font-mono text-xs">
              {m}
            </li>
          ))}
        </ul>
        <p className="text-ink-2 mt-5 text-sm">
          Want to look around before setting up sign-in? Set <code className="font-mono">DEMO_MODE=true</code> together
          with your Supabase keys. Everyone who opens the site then shares one demo account, so don&apos;t enter
          anything private.
        </p>
      </div>
    </main>
  );
}
