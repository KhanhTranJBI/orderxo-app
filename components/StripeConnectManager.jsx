"use client";
import { useEffect, useState } from "react";
import { ownerFetch } from "../lib/ownerFetch";
export default function StripeConnectManager({ organizationId, locations }) {
  const [locationId, setLocationId] = useState(locations[0]?._id || "");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!locationId) return;
    let active = true;
    setStatus(null);
    setError("");
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
    return () => {
      active = false;
    };
  }, [organizationId, locationId]);
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
      {error && (
        <p className="text-red-700" role="alert">
          {error}
        </p>
      )}
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
      {status && !status.connected && (
        <button
          onClick={connect}
          disabled={busy}
          className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Redirecting…" : "Connect existing Stripe account"}
        </button>
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
