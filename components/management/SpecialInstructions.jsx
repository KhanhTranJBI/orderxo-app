"use client";

/** Shared display for customer-provided order instructions. */
export default function SpecialInstructions({ instructions, className = "" }) {
  const message = String(instructions ?? "").trim();
  if (!message) return null;

  return (
    <section
      aria-label="Special instructions"
      className={`border-l-[6px] border-orange-500 bg-orange-50 px-5 py-4 ${className}`}
    >
      <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-orange-700">
        Special Instructions
      </h3>
      <p className="whitespace-pre-wrap break-words text-base font-normal leading-relaxed text-orange-900">
        {message}
      </p>
    </section>
  );
}
