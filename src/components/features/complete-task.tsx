"use client";

import { CheckCircle2 } from "lucide-react";
import { useActionState, useEffect } from "react";
import { Field, FormMessage, Input, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/ui/submit-button";
import { completeTask } from "@/server/actions/tasks";

function CompleteForm({ taskId, today, close }: { taskId: string; today: string; close: () => void }) {
  const [state, action] = useActionState(completeTask, null);
  useEffect(() => {
    if (state?.ok) close();
  }, [state, close]);
  const e = state?.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="task_id" value={taskId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date done" htmlFor="performed_on" errors={e.performed_on}>
          <Input id="performed_on" name="performed_on" type="date" defaultValue={today} max={today} required />
        </Field>
        <Field label="Done by" htmlFor="performed_by" hint="You, or a pro's name" errors={e.performed_by}>
          <Input id="performed_by" name="performed_by" maxLength={120} placeholder="Me" />
        </Field>
        <Field label="Cost" htmlFor="cost" errors={e.cost}>
          <Input id="cost" name="cost" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0.00" />
        </Field>
        <Field label="Currency" htmlFor="currency" errors={e.currency}>
          <Input id="currency" name="currency" defaultValue="USD" maxLength={3} className="uppercase" />
        </Field>
      </div>
      <Field label="Reading" htmlFor="reading" hint="Odometer, hours, etc. (optional)" errors={e.reading}>
        <Input id="reading" name="reading" maxLength={60} placeholder="e.g. 52,300 km" />
      </Field>
      <Field label="Notes" htmlFor="notes" errors={e.notes}>
        <Textarea id="notes" name="notes" maxLength={4000} placeholder="Parts used, observations…" />
      </Field>
      <FormMessage state={state && !state.ok ? state : null} />
      <div className="flex justify-end">
        <SubmitButton pendingText="Logging…">Log & reschedule</SubmitButton>
      </div>
    </form>
  );
}

export function CompleteTaskButton({
  taskId,
  taskTitle,
  today,
  label = "Mark done",
  variant = "secondary",
}: {
  taskId: string;
  taskTitle: string;
  today: string;
  label?: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <Modal
      title={`Done: ${taskTitle}`}
      variant={variant}
      trigger={
        <>
          <CheckCircle2 className="size-4" aria-hidden />
          {label}
        </>
      }
    >
      {(close) => <CompleteForm taskId={taskId} today={today} close={close} />}
    </Modal>
  );
}
