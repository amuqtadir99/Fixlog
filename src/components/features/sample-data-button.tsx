"use client";

import { Sparkles } from "lucide-react";
import { useActionState } from "react";
import { FormMessage } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { loadSampleData } from "@/server/actions/onboarding";

export function SampleDataButton() {
  const [state, action] = useActionState(loadSampleData, null);
  return (
    <form action={action} className="space-y-2">
      <SubmitButton variant="secondary" pendingText="Adding sample items…">
        <Sparkles className="size-4" aria-hidden /> Load sample data
      </SubmitButton>
      <FormMessage state={state && !state.ok ? state : null} />
    </form>
  );
}
