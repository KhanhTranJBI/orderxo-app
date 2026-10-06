"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useRestaurantLocation from "./useRestaurantLocation";
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const defaultHours = () =>
  DAYS.map((day) => ({ day, open: "11:00", close: "19:00", isClosed: false }));
async function req(path, org, loc, method = "GET", body) {
  const q = new URLSearchParams({ organizationId: org, locationId: loc });
  const r = await fetch(`/api/owner/manage/${path}?${q}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify({ ...body, locationId: loc }) : undefined,
    cache: "no-store",
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Request failed");
  return d;
}
export default function StoreSettingsManager({ organizationId }) {
  const loc = useRestaurantLocation(organizationId),
    [manual, setManual] = useState(true),
    [hours, setHours] = useState(defaultHours),
    [interval, setInterval] = useState(60),
    [loading, setLoading] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const load = useCallback(async () => {
    if (!loc.locationId) return;
    setLoading(true);
    setError("");
    try {
      const [a, b] = await Promise.all([
        req("store-config", organizationId, loc.locationId),
        req("locations/settings", organizationId, loc.locationId),
      ]);
      const c = a.config || {};
      setManual(c.isOpenManual !== false);
      if (Array.isArray(c.hours) && c.hours.length) {
        const map = new Map(c.hours.map((h) => [h.day, h]));
        setHours(
          DAYS.map((day) => map.get(day) || { day, open: "11:00", close: "19:00", isClosed: true }),
        );
      }
      setInterval(b.settings?.ordering?.abandonedCartIntervalMinutes ?? 60);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [organizationId, loc.locationId]);
  useEffect(() => {
    load();
  }, [load]);
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await Promise.all([
        req("store-config", organizationId, loc.locationId, "PATCH", {
          isOpenManual: manual,
          hours,
        }),
        req("locations/settings", organizationId, loc.locationId, "PATCH", {
          ordering: { abandonedCartIntervalMinutes: Number(interval) },
        }),
      ]);
      setMessage("Store settings saved");
      setTimeout(() => setMessage(""), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  const change = (i, k, v) => setHours((h) => h.map((x, n) => (n === i ? { ...x, [k]: v } : x)));
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/dashboard/restaurants/${organizationId}`}
          className="text-sm font-semibold text-orange-600"
        >
          ← Restaurant workspace
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-orange-600">
          OrderXO Manager
        </p>
        <h1 className="mt-1 text-3xl font-bold">Store settings</h1>
        <p className="mt-2 text-slate-600">
          Control whether ordering is open and maintain weekly business hours.
        </p>
        {loc.locations.length > 1 && (
          <select
            className="field mt-5 max-w-sm"
            value={loc.locationId}
            onChange={(e) => loc.setLocationId(e.target.value)}
          >
            {loc.locations.map((l) => (
              <option key={l._id} value={l._id}>
                {l.name}
              </option>
            ))}
          </select>
        )}
        {(loc.error || error) && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{loc.error || error}</p>
        )}
        {message && (
          <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p>
        )}
        {loading || loc.loading ? (
          <p className="mt-6">Loading settings…</p>
        ) : (
          loc.locationId && (
            <>
              <section className="mt-6 rounded-2xl border bg-white p-6">
                <div className="flex items-center justify-between gap-5">
                  <div>
                    <h2 className="text-xl font-bold">Manual ordering status</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Turn this off to immediately stop accepting online orders.
                    </p>
                  </div>
                  <button
                    onClick={() => setManual((v) => !v)}
                    className={`rounded-full px-5 py-2 font-semibold ${manual ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-700"}`}
                  >
                    {manual ? "Open" : "Closed"}
                  </button>
                </div>
              </section>
              <section className="mt-4 rounded-2xl border bg-white p-6">
                <h2 className="text-xl font-bold">Weekly hours</h2>
                <div className="mt-5 space-y-3">
                  {hours.map((h, i) => (
                    <div
                      key={h.day}
                      className="grid items-center gap-3 border-b pb-3 last:border-0 md:grid-cols-[130px_110px_1fr_1fr]"
                    >
                      <strong>{h.day}</strong>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={h.isClosed}
                          onChange={(e) => change(i, "isClosed", e.target.checked)}
                        />{" "}
                        Closed
                      </label>
                      <input
                        type="time"
                        disabled={h.isClosed}
                        className="field"
                        value={h.open}
                        onChange={(e) => change(i, "open", e.target.value)}
                      />
                      <input
                        type="time"
                        disabled={h.isClosed}
                        className="field"
                        value={h.close}
                        onChange={(e) => change(i, "close", e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </section>
              <section className="mt-4 rounded-2xl border bg-white p-6">
                <h2 className="text-xl font-bold">Ordering configuration</h2>
                <label className="mt-4 block text-sm font-semibold">
                  Abandoned cart interval (minutes)
                </label>
                <input
                  className="field mt-2 max-w-xs"
                  type="number"
                  min="1"
                  max="10080"
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                />
              </section>
              <button disabled={saving} onClick={save} className="primary mt-5">
                {saving ? "Saving…" : "Save store settings"}
              </button>
            </>
          )
        )}
      </div>
    </main>
  );
}
