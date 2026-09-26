import { FlaskConical } from "lucide-react";

export function DemoBanner() {
  return (
    <div
      role="status"
      className="border-warning/40 bg-warning/15 text-ink border-b px-4 py-2 text-center text-xs sm:text-sm"
    >
      <FlaskConical className="mr-1.5 inline size-4 align-[-3px]" aria-hidden />
      <strong>Demo mode</strong> — sign-in is off and everyone with this link shares the same data. Don&apos;t enter
      anything private.
    </div>
  );
}
