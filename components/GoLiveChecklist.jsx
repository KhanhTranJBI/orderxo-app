"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ownerFetch } from "../lib/ownerFetch";

export default function GoLiveChecklist({ organizationId, locations }) {
  const [locationId, setLocationId] = useState(String(locations[0]?._id || ""));
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function refresh(id = locationId) {
    if (!id) return;
    setError("");
    try {
      const response = await ownerFetch(
        `/api/owner/onboarding/go-live?organizationId=${encodeURIComponent(organizationId)}&locationId=${encodeURIComponent(id)}`,
        { cache: "no-store" },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load checklist");
      setData(result);
    } catch (e) {
      setError(e.message);
      setData(null);
    }
  }
  useEffect(() => {
    refresh(locationId);
  }, [locationId, organizationId]);
  async function activate() {
    setBusy(true);
    setError("");
    try {
      const response = await ownerFetch("/api/owner/onboarding/go-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, locationId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Activation failed");
      setData(result.checklist);
    } catch (e) {
      setError(e.message);
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Restaurant go-live checklist</h2>
        <p className="mt-2 text-slate-600">
          Complete the required steps to accept online orders. Progress is verified by OrderXO
          automatically.
        </p>
      </div>
      <label className="block text-sm font-semibold">Restaurant location</label>
      <select
        className="w-full rounded-lg border p-3"
        value={locationId}
        onChange={(e) => {
          setLocationId(e.target.value);
          setData(null);
        }}
      >
        {locations.map((l) => (
          <option key={l._id} value={l._id}>
            {l.name}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">
          {error}
        </p>
      )}
      {!data && !error && <p className="text-slate-500">Checking setup…</p>}
      {data && (
        <>
          <div className="flex items-center justify-between gap-3">
            <strong>
              {data.completed} of {data.total} steps completed
            </strong>
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${data.live ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
            >
              {data.live
                ? "Online ordering active"
                : data.ready
                  ? "Ready to activate"
                  : "Setup required"}
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-green-600 transition-all"
              style={{ width: `${Math.round((data.completed / data.total) * 100)}%` }}
            />
          </div>
          <div className="divide-y">
            {data.steps.map((step) => (
              <div key={step.id} className="flex items-start gap-3 py-4">
                <span
                  aria-label={step.completed ? "Completed" : "Incomplete"}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold ${step.completed ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}
                >
                  {step.completed ? "✓" : "○"}
                </span>
                <div className="flex-1">
                  <h3 className="font-semibold">{step.label}</h3>
                  <p className="text-sm text-slate-600">{step.description}</p>
                </div>
                {!step.completed && (
                  <Link
                    className="shrink-0 text-sm font-semibold text-orange-700 hover:underline"
                    href={step.href}
                  >
                    Configure →
                  </Link>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => refresh()} className="rounded-xl border px-4 py-3 font-semibold">
              Refresh progress
            </button>
            {!data.live && (
              <button
                onClick={activate}
                disabled={!data.ready || busy}
                className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? "Activating…" : "Activate online ordering"}
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Kiosk is optional. Your restaurant may still pause ordering using its store hours.
            Activation does not bypass Stripe or subscription checks.
          </p>
        </>
      )}
    </section>
  );
}
