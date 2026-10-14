"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EndSupportButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function endSupport() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/support/end", {
        method: "POST",
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Unable to end support session. Please try again.");
      router.replace("/login");
      router.refresh();
    } catch (e) {
      setError(e.message || "Unable to end support session.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={endSupport}
        disabled={busy}
        className="rounded-xl border border-orange-300 bg-orange-50 px-5 py-3 text-sm font-semibold text-orange-900 hover:bg-orange-100 disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? "Ending support…" : "End Support"}
      </button>
      {error && (
        <p role="alert" className="max-w-xs text-right text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
