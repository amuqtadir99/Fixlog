import { Wrench } from "lucide-react";
import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="text-ink flex items-center gap-2 font-semibold tracking-tight">
      <span className="bg-accent grid size-8 place-items-center rounded-lg text-white">
        <Wrench className="size-4" aria-hidden />
      </span>
      FixLog
    </Link>
  );
}
