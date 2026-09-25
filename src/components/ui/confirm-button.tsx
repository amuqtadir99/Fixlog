"use client";

import { useTransition, type ReactNode } from "react";
import { buttonClass } from "./button";

/** Runs a server action after a confirm() prompt. */
export function ConfirmButton({
  action,
  confirmText,
  children,
  variant = "danger",
  className,
}: {
  action: () => Promise<void>;
  confirmText: string;
  children: ReactNode;
  variant?: Parameters<typeof buttonClass>[0];
  className?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={buttonClass(variant, "sm", className)}
      onClick={() => {
        if (window.confirm(confirmText)) start(() => action());
      }}
    >
      {pending ? "Working…" : children}
    </button>
  );
}
