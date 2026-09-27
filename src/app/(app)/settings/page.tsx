import { currentUser } from "@clerk/nextjs/server";
import { NotificationSettingsForm } from "@/components/features/notification-settings-form";
import { Card, CardHeader, PageHeader } from "@/components/ui/card";
import { getAuthMode } from "@/lib/auth-mode";
import { missingEmailConfig } from "@/lib/email/resend";
import { getNotificationSettings } from "@/server/queries";

export const metadata = { title: "Settings" };

const VERIFY_MESSAGES: Record<string, { ok: boolean; text: string }> = {
  ok: { ok: true, text: "Email confirmed. Reminders are on their way." },
  invalid: { ok: false, text: "That confirmation link is invalid or has expired. Use “Resend confirmation”." },
  error: { ok: false, text: "We couldn't confirm your email. Please try again." },
};

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const sp = await searchParams;
  const mode = getAuthMode();
  const settings = await getNotificationSettings();
  const clerkEmail = mode === "clerk" ? ((await currentUser())?.primaryEmailAddress?.emailAddress ?? "") : "";
  const missing = missingEmailConfig();
  const verify = typeof sp.verify === "string" ? VERIFY_MESSAGES[sp.verify] : undefined;

  return (
    <>
      <PageHeader title="Settings" />
      <div className="max-w-2xl space-y-6">
        {verify ? (
          <p
            role="status"
            className={
              verify.ok
                ? "bg-good/10 text-good-ink rounded-lg px-3 py-2 text-sm"
                : "bg-critical/10 text-critical-ink rounded-lg px-3 py-2 text-sm"
            }
          >
            {verify.text}
          </p>
        ) : null}
        <Card>
          <CardHeader
            title="Email reminders"
            description="A summary of overdue maintenance and what's coming up, sent to the address you choose."
          />
          {mode === "demo" ? (
            <p className="bg-warning/15 text-ink mb-4 rounded-lg px-3 py-2 text-sm">
              Email reminders are off in demo mode because everyone shares one account. Add the Clerk keys to enable
              sign-in, then come back here.
            </p>
          ) : missing.length ? (
            <p className="bg-warning/15 text-ink mb-4 rounded-lg px-3 py-2 text-sm">
              Emails can&apos;t be sent until these are set in Vercel:{" "}
              <code className="font-mono text-xs">{missing.join(", ")}</code> (see docs/DEPLOYMENT.md).
            </p>
          ) : null}
          <NotificationSettingsForm
            disabled={mode === "demo"}
            values={{
              email: settings?.email ?? clerkEmail,
              enabled: settings?.enabled ?? true,
              frequency: settings?.frequency ?? "weekly",
              lead_days: settings?.lead_days ?? 7,
              verified: Boolean(settings?.email_verified_at),
              savedEmail: settings?.email ?? null,
            }}
          />
        </Card>
      </div>
    </>
  );
}
