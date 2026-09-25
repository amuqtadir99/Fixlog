"use client";

import { NotebookPen } from "lucide-react";
import { useActionState, useEffect } from "react";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/ui/submit-button";
import type { AssetRef } from "@/lib/types";
import { addServiceLog } from "@/server/actions/logs";

function LogForm({
  assets,
  assetId,
  today,
  close,
}: {
  assets?: AssetRef[];
  assetId?: string;
  today: string;
  close: () => void;
}) {
  const [state, action] = useActionState(addServiceLog, null);
  useEffect(() => {
    if (state?.ok) close();
  }, [state, close]);
  const e = state?.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4">
      {assetId ? (
        <input type="hidden" name="asset_id" value={assetId} />
      ) : (
        <Field label="Item" htmlFor="asset_id" errors={e.asset_id}>
          <Select id="asset_id" name="asset_id" required defaultValue="">
            <option value="" disabled>
              Choose an item…
            </option>
            {assets?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="What was done?" htmlFor="title" errors={e.title}>
        <Input id="title" name="title" required maxLength={160} placeholder="e.g. Replaced fan belt" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date" htmlFor="performed_on" errors={e.performed_on}>
          <Input id="performed_on" name="performed_on" type="date" defaultValue={today} max={today} required />
        </Field>
        <Field label="Done by" htmlFor="performed_by" errors={e.performed_by}>
          <Input id="performed_by" name="performed_by" maxLength={120} placeholder="Me / provider" />
        </Field>
        <Field label="Cost" htmlFor="cost" errors={e.cost}>
          <Input id="cost" name="cost" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0.00" />
        </Field>
        <Field label="Currency" htmlFor="currency" errors={e.currency}>
          <Input id="currency" name="currency" defaultValue="USD" maxLength={3} className="uppercase" />
        </Field>
      </div>
      <Field label="Reading" htmlFor="reading" hint="Odometer, hours… (optional)" errors={e.reading}>
        <Input id="reading" name="reading" maxLength={60} />
      </Field>
      <Field label="Notes" htmlFor="notes" errors={e.notes}>
        <Textarea id="notes" name="notes" maxLength={4000} />
      </Field>
      <FormMessage state={state && !state.ok ? state : null} />
      <div className="flex justify-end">
        <SubmitButton>Save record</SubmitButton>
      </div>
    </form>
  );
}

export function ServiceLogButton(props: { assets?: AssetRef[]; assetId?: string; today: string }) {
  return (
    <Modal
      title="Record a service or fix"
      trigger={
        <>
          <NotebookPen className="size-4" aria-hidden /> Log service
        </>
      }
    >
      {(close) => <LogForm {...props} close={close} />}
    </Modal>
  );
}
