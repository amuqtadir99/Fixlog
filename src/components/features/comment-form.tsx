"use client";

import { useActionState, useEffect, useRef } from "react";
import { FormMessage, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { addComment } from "@/server/actions/tasks";

export function CommentForm({ taskId }: { taskId: string }) {
  const [state, action] = useActionState(addComment, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-2">
      <input type="hidden" name="task_id" value={taskId} />
      <label htmlFor="comment-body" className="sr-only">
        Add a comment
      </label>
      <Textarea
        id="comment-body"
        name="body"
        required
        maxLength={2000}
        placeholder="Add a note — quotes, part numbers, who you called…"
        className="min-h-20"
      />
      <FormMessage state={state && !state.ok ? state : null} />
      <div className="flex justify-end">
        <SubmitButton pendingText="Posting…">Comment</SubmitButton>
      </div>
    </form>
  );
}
