"use client";

import { Plus } from "lucide-react";
import { useActionState, useEffect } from "react";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/ui/submit-button";
import { INTERVAL_UNITS, PRIORITIES, PRIORITY_LABELS } from "@/lib/domain";
import type { Task } from "@/lib/types";
import type { ActionState } from "@/lib/validation";
import { createTask, updateTask } from "@/server/actions/tasks";

export function TaskFields({ task, errors = {} }: { task?: Partial<Task>; errors?: ActionState["fieldErrors"] }) {
  const e = errors ?? {};
  return (
    <>
      <Field label="Title" htmlFor="title" errors={e.title}>
        <Input
          id="title"
          name="title"
          required
          maxLength={160}
          defaultValue={task?.title}
          placeholder="e.g. Replace air filter"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Repeat every" htmlFor="interval_value" errors={e.interval_value} hint="Leave empty for one-off">
          <Input
            id="interval_value"
            name="interval_value"
            type="number"
            min={1}
            max={1000}
            defaultValue={task?.interval_value ?? ""}
            placeholder="6"
          />
        </Field>
        <Field label="Unit" htmlFor="interval_unit" errors={e.interval_unit}>
          <Select id="interval_unit" name="interval_unit" defaultValue={task?.interval_unit ?? "none"}>
            <option value="none">— one-off —</option>
            {INTERVAL_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}s
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Next due" htmlFor="next_due_on" errors={e.next_due_on}>
          <Input id="next_due_on" name="next_due_on" type="date" defaultValue={task?.next_due_on ?? ""} />
        </Field>
        <Field label="Priority" htmlFor="priority" errors={e.priority}>
          <Select id="priority" name="priority" defaultValue={task?.priority ?? "medium"}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Description" htmlFor="description" errors={e.description}>
        <Textarea id="description" name="description" maxLength={4000} defaultValue={task?.description ?? ""} />
      </Field>
    </>
  );
}

function NewTaskForm({ assetId, defaultDue, close }: { assetId: string; defaultDue: string; close: () => void }) {
  const [state, action] = useActionState(createTask, null);
  useEffect(() => {
    if (state?.ok) close();
  }, [state, close]);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="asset_id" value={assetId} />
      <TaskFields task={{ next_due_on: defaultDue }} errors={state?.fieldErrors} />
      <FormMessage state={state && !state.ok ? state : null} />
      <div className="flex justify-end">
        <SubmitButton>Add task</SubmitButton>
      </div>
    </form>
  );
}

export function NewTaskButton({ assetId, defaultDue }: { assetId: string; defaultDue: string }) {
  return (
    <Modal
      title="New maintenance task"
      variant="primary"
      trigger={
        <>
          <Plus className="size-4" aria-hidden /> Add task
        </>
      }
    >
      {(close) => <NewTaskForm assetId={assetId} defaultDue={defaultDue} close={close} />}
    </Modal>
  );
}

function EditTaskForm({ task, close }: { task: Task; close: () => void }) {
  const [state, action] = useActionState(updateTask.bind(null, task.id), null);
  useEffect(() => {
    if (state?.ok) close();
  }, [state, close]);
  return (
    <form action={action} className="space-y-4">
      <TaskFields task={task} errors={state?.fieldErrors} />
      <FormMessage state={state && !state.ok ? state : null} />
      <div className="flex justify-end">
        <SubmitButton>Save task</SubmitButton>
      </div>
    </form>
  );
}

export function EditTaskButton({ task }: { task: Task }) {
  return (
    <Modal title="Edit task" trigger="Edit">
      {(close) => <EditTaskForm task={task} close={close} />}
    </Modal>
  );
}
