"use client";
import { useState } from "react";
export default function SupportAccess({ restaurants }) {
  const [organizationId, setOrganizationId] = useState(restaurants[0]?._id || "");
  const [reason, setReason] = useState("Initial restaurant onboarding setup");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function create() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/internal/support/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, mode: "setup", reason }),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error || "Unable to create session");
      const base = process.env.NEXT_PUBLIC_ORDERXO_APP_URL;
      if (!base) throw Error("NEXT_PUBLIC_ORDERXO_APP_URL is not configured");
      window.open(
        `${base.replace(/\/$/, "")}/support#${data.token}`,
        "_blank",
        "noopener,noreferrer",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="rounded-xl border bg-white p-5 space-y-3">
      <h2 className="text-xl font-bold">Restaurant Setup Access</h2>
      <p className="text-sm text-slate-600">
        Internal admins can open Setup Mode for any restaurant. Staff can open it only for restaurants assigned to them. Sessions expire after 30 minutes and actions are audited.
      </p>
      <select
        className="w-full rounded border p-2"
        value={organizationId}
        onChange={(e) => setOrganizationId(e.target.value)}
      >
        {restaurants.map((r) => (
          <option key={r._id} value={r._id}>
            {r.name}
          </option>
        ))}
      </select>
      <label className="block text-sm">Reason for access</label>
      <textarea
        className="w-full rounded border p-2"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      {error && <p className="text-red-600">{error}</p>}
      <button
        disabled={busy || !organizationId || reason.trim().length < 8}
        onClick={create}
        className="rounded bg-orange-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {busy ? "Creating…" : "Open Setup Mode"}
      </button>
    </div>
  );
}
