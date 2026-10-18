"use client";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { ownerFetch } from "../lib/ownerFetch";
export default function StripeConnectManager({ organizationId, locations, initialLocationId }) {
  const [locationId, setLocationId] = useState(
    locations.some((l) => String(l._id || l.id) === String(initialLocationId))
      ? String(initialLocationId)
      : String(locations[0]?._id || ""),
  );
  const [status, setStatus] = useState(null);
  const [error, setErrorState] = useState("");
  const setError = (value) => {
    setErrorState(value);
    if (typeof value === "string" && value.trim()) toast.error(value);
  };
  const [busy, setBusy] = useState(false);
  const [sources, setSources] = useState([]);
  const [sourceId, setSourceId] = useState("");
  const [confirmSource, setConfirmSource] = useState(null);
  const [success, setSuccessState] = useState("");
  const setSuccess = (value) => {
    setSuccessState(value);
    if (typeof value === "string" && value.trim()) toast.success(value);
  };
  const [reload, setReload] = useState(0);
  useEffect(() => {
    if (!locationId) return;
    let active = true;
    setStatus(null);
    setError("");
    setSuccess("");
    ownerFetch(
      `/api/owner/connect/stripe/status?organizationId=${encodeURIComponent(organizationId)}&locationId=${encodeURIComponent(locationId)}`,
    )
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error || "Status unavailable");
        if (active) setStatus(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    ownerFetch(
      `/api/owner/connect/stripe/sources?organizationId=${encodeURIComponent(organizationId)}&locationId=${encodeURIComponent(locationId)}`,
    )
      .then(async (r) => {
        const d = await r.json();
        if (active) {
          const list = r.ok ? d.sources || [] : [];
          setSources(list);
          setSourceId(list[0]?.locationId || "");
        }
      })
      .catch(() => {
        if (active) setSources([]);
      });
    return () => {
      active = false;
    };
  }, [organizationId, locationId, reload]);
  async function connect() {
    setBusy(true);
    setError("");
    try {
      const r = await ownerFetch("/api/owner/connect/stripe/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, locationId }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "Unable to start Stripe Connect");
      window.location.assign(d.url);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }
  async function share() {
    if (!confirmSource) return;
    setBusy(true);
    setError("");
    try {
      const r = await ownerFetch("/api/owner/connect/stripe/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          locationId,
          sourceLocationId: confirmSource.locationId,
          confirmShare: true,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "Unable to share Stripe account");
      setConfirmSource(null);
      setSuccess("Stripe account assigned to this location. Check payment readiness below.");
      setReload((v) => v + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="rounded-2xl border bg-white p-6 space-y-4">
      <h2 className="text-xl font-bold">Stripe Connect – Restaurant Payments</h2>
      <p className="text-sm text-slate-600">
        Connect your existing Stripe Dashboard account to receive customer payments. This is
        separate from your OrderXO subscription.
      </p>
      <label className="block text-sm font-semibold">Restaurant location</label>
      <select
        className="w-full rounded-lg border p-3"
        value={locationId}
        onChange={(e) => setLocationId(e.target.value)}
      >
        {locations.map((l) => (
          <option key={l._id} value={l._id}>
            {l.name}
          </option>
        ))}
      </select>

      {status && (
        <div className="text-sm space-y-1">
          <p>
            Connection: <strong>{status.connected ? "Connected" : "Not connected"}</strong>
          </p>
          {status.connected && (
            <>
              <p>Account: {status.accountId}</p>
              <p>Card payments: {status.chargesEnabled ? "Enabled" : "Not ready"}</p>
              <p>Payouts: {status.payoutsEnabled ? "Enabled" : "Not ready"}</p>
            </>
          )}
        </div>
      )}
      {status && !status.connected && sources.length > 0 && (
        <div className="space-y-3 rounded-xl border p-4">
          <h3 className="font-semibold">Use an existing organization Stripe account</h3>
          <p className="text-sm text-slate-600">
            Share payment deposits with another location owned by this organization. Orders and
            reports remain location-specific.
          </p>
          <select
            className="w-full rounded-lg border p-3"
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
          >
            {sources.map((s) => (
              <option key={s.locationId} value={s.locationId}>
                {s.name} (account ending {s.accountLast4})
              </option>
            ))}
          </select>
          <button
            disabled={busy || !sourceId}
            onClick={() => setConfirmSource(sources.find((s) => s.locationId === sourceId))}
            className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            Use this account
          </button>
        </div>
      )}
      {status && !status.connected && (
        <button
          onClick={connect}
          disabled={busy}
          className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Redirecting…" : "Connect existing Stripe account"}
        </button>
      )}
      {confirmSource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm shared Stripe account"
        >
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold">Share Stripe payment account?</h3>
            <p className="text-sm text-slate-700">
              Payments for this location will be deposited into the same Stripe account used by{" "}
              <strong>{confirmSource.name}</strong>. Refunds and payouts will use that account too.
            </p>
            <div className="flex justify-end gap-3">
              <button
                disabled={busy}
                className="rounded-lg border px-4 py-2"
                onClick={() => setConfirmSource(null)}
              >
                Cancel
              </button>
              <button
                disabled={busy}
                className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
                onClick={share}
              >
                {busy ? "Saving…" : "Confirm sharing"}
              </button>
            </div>
          </div>
        </div>
      )}
      {status?.connected && (
        <p className="text-sm text-slate-500">
          To change the receiving account, contact OrderXO support. Existing connections are never
          overwritten automatically.
        </p>
      )}
    </section>
  );
}
