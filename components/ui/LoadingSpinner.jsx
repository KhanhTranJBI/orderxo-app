"use client";

import { Loader2 } from "lucide-react";

/** Shared centered loader for pages, panels, and small controls. */
export default function LoadingSpinner({
  label = "Loading…",
  fullPage = false,
  compact = false,
  className = "",
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`flex w-full flex-col items-center justify-center gap-3 text-slate-500 ${fullPage ? "min-h-[70vh]" : compact ? "min-h-[96px]" : "min-h-[240px]"} ${className}`}
    >
      <Loader2 aria-hidden="true" className="h-9 w-9 animate-spin text-orange-600" />
      {label && <span className="text-sm font-medium">{label}</span>}
    </div>
  );
}
