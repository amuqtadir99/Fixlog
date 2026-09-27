"use client";

import { BadgeCheck, MailWarning, Send } from "lucide-react";
import { useActionState } from "react";
import { Field, FormMessage, Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { resendVerification, saveNotificationSettings, sendTestEmail } from "@/server/actions/notifications";

export interface SettingsFormValues {
  email: string;
  enabled: boolean;
  frequency: "daily" | "weekly";
  lead_days: number;
  verified: boolean;
  savedEmail: string | null;
}

export function NotificationSettingsForm({ values, disabled }: { values: SettingsFormValues; disabled?: boolean }) {
  const [state, action] = useActionState(saveNotificationSettings, null);
  const [resendState, resendAction] = useActionState(resendVerification, null);
  const [testState, testAction] = useActionState(sendTestEmail, null);
  const e = state?.fieldErrors ?? {};

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-4">
        <fieldset disabled={disabled} className="space-y-4 disabled:opacity-60">
          <Field label="Send reminders to" htmlFor="email" errors={e.email}>
            <Input
              id="email"
              name="email"
              type="email"
              required
              maxLength={254}
              defaultValue={values.email}
              autoComplete="email"
            />
          </Field>
          {values.savedEmail ? (
            values.verified ? (
              <p className="text-good-ink flex items-center gap-1.5 text-sm">
                <BadgeCheck className="size-4" aria-hidden /> {values.savedEmail} is confirmed
              </p>
            ) : (
              <p className="text-ink flex items-center gap-1.5 text-sm">
                <MailWarning className="text-serious size-4" aria-hidden /> {values.savedEmail} isn&apos;t confirmed
                yet. Click the link we emailed you.
              </p>
            )
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="How often" htmlFor="frequency" errors={e.frequency}>
              <Select id="frequency" name="frequency" defaultValue={values.frequency}>
                <option value="daily">Daily summary</option>
                <option value="weekly">Weekly summary</option>
              </Select>
            </Field>
            <Field
              label="Include tasks due within"
              htmlFor="lead_days"
              errors={e.lead_days}
              hint="Overdue tasks are always included."
            >
              <Select id="lead_days" name="lead_days" defaultValue={String(values.lead_days)}>
                {[0, 3, 7, 14, 30, 60].map((d) => (
                  <option key={d} value={d}>
                    {d === 0 ? "Only overdue" : `${d} days`}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={values.enabled}
              className="size-4 accent-[var(--accent)]"
            />
            <span className="text-ink">Email me reminders</span>
          </label>
          <FormMessage state={state} />
          <SubmitButton>Save reminder settings</SubmitButton>
        </fieldset>
      </form>

      {!disabled && values.savedEmail ? (
        <div className="border-line flex flex-wrap gap-2 border-t pt-4">
          {values.verified ? (
            <form action={testAction}>
              <SubmitButton variant="secondary" pendingText="Sending…">
                <Send className="size-4" aria-hidden /> Send a test email
              </SubmitButton>
            </form>
          ) : (
            <form action={resendAction}>
              <SubmitButton variant="secondary" pendingText="Sending…">
                Resend confirmation
              </SubmitButton>
            </form>
          )}
          <div className="basis-full">
            <FormMessage state={testState ?? resendState} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
