"use client";

/** Shared display for customer-provided order instructions. */
export default function SpecialInstructions({ instructions, className = "" }) {
  const message = String(instructions ?? "").trim();
  if (!message) return null;

  return (
    <section
      aria-label="Special instructions"
      className={`border-l-[6px] border-orange-500 bg-slate-50 px-5 py-4 ${className}`}
    >
      <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        Your Special Instructions
      </h3>
      <p className="whitespace-pre-wrap break-words text-base font-normal leading-relaxed text-slate-700">
        {message}
      </p>
    </section>
  );
}
