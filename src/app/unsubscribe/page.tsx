import { MailX } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { buttonClass } from "@/components/ui/button";

export const metadata = { title: "Unsubscribe", robots: { index: false } };

export default async function UnsubscribePage({ searchParams }: PageProps<"/unsubscribe">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" && /^[0-9a-f]{64}$/.test(sp.token) ? sp.token : null;
  const done = sp.done === "1";
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="border-line bg-surface w-full max-w-md rounded-2xl border p-6 text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <MailX className="text-muted mx-auto mt-6 size-8" aria-hidden />
        {done ? (
          <>
            <h1 className="text-ink mt-3 text-lg font-semibold">You&apos;re unsubscribed</h1>
            <p className="text-muted mt-1 text-sm">
              You won&apos;t get reminder emails any more. Turn them back on in Settings.
            </p>
          </>
        ) : token ? (
          <>
            <h1 className="text-ink mt-3 text-lg font-semibold">Stop reminder emails?</h1>
            <p className="text-muted mt-1 text-sm">You can turn them back on any time in Settings.</p>
            <form method="post" action={`/api/notifications/unsubscribe?token=${token}`} className="mt-5">
              <button type="submit" className={buttonClass("primary")}>
                Unsubscribe
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-ink mt-3 text-lg font-semibold">Link not valid</h1>
            <p className="text-muted mt-1 text-sm">
              Use the unsubscribe link from a FixLog email, or change reminders in Settings.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
