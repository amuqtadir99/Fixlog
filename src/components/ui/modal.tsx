"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { buttonClass } from "./button";

type Variant = Parameters<typeof buttonClass>[0];

/** Native <dialog> modal: focus-trapped, Esc to close, no portal needed. */
export function Modal({
  trigger,
  title,
  children,
  variant = "secondary",
  size = "sm",
  triggerClassName,
}: {
  trigger: ReactNode;
  title: string;
  children: (close: () => void) => ReactNode;
  variant?: Variant;
  size?: "sm" | "md";
  triggerClassName?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button type="button" className={buttonClass(variant, size, triggerClassName)} onClick={() => setOpen(true)}>
        {trigger}
      </button>
      <dialog
        ref={ref}
        onClose={close}
        onClick={(e) => e.target === ref.current && close()}
        className="border-line bg-surface text-ink m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      >
        <div className="border-line flex items-center justify-between border-b px-5 py-3">
          <h2 className="font-semibold">{title}</h2>
          <button type="button" onClick={close} className={buttonClass("ghost", "sm", "px-2")} aria-label="Close">
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-5">{open ? children(close) : null}</div>
      </dialog>
    </>
  );
}
