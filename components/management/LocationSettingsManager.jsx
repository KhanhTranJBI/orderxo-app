"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ownerFetch } from "../../lib/ownerFetch";
import useRestaurantLocation from "./useRestaurantLocation";
import useRestaurantPermissions from "./useRestaurantPermissions";

const empty = {
  printing: {
    enabled: false,
    provider: "none",
    kitchen: { enabled: false, printerId: "", printerName: "", autoPrint: true },
    receipt: { enabled: false, printerId: "", printerName: "", autoPrint: false },
  },
};
async function request(org, locationId, method = "GET", body) {
  const q = new URLSearchParams({ organizationId: org, locationId });
  const r = await ownerFetch(`/api/owner/locations/settings?${q}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify({ ...body, organizationId: org, locationId }) : undefined,
    cache: "no-store",
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Request failed");
  return d;
}
export default function LocationSettingsManager({ organizationId }) {
  const loc = useRestaurantLocation(organizationId);
  const perm = useRestaurantPermissions(organizationId);
  const [locationId, setLocationId] = useState("");
  const [settings, setSettings] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!locationId && loc.locations[0])
      setLocationId(String(loc.locations[0]._id || loc.locations[0].id));
  }, [loc.locations, locationId]);
  useEffect(() => {
    if (!locationId) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const d = await request(organizationId, locationId);
        setSettings({
          ...empty,
          ...d.settings,
          printing: {
            ...empty.printing,
            ...d.settings?.printing,
            kitchen: { ...empty.printing.kitchen, ...d.settings?.printing?.kitchen },
            receipt: { ...empty.printing.receipt, ...d.settings?.printing?.receipt },
          },
        });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [organizationId, locationId]);
  const canManage = perm.can("store.manage");
  const setPrinting = (key, value) =>
    setSettings((s) => ({ ...s, printing: { ...s.printing, [key]: value } }));
  const setPrinter = (target, key, value) =>
    setSettings((s) => ({
      ...s,
      printing: { ...s.printing, [target]: { ...s.printing[target], [key]: value } },
    }));
  async function save() {
    if (!canManage) return;
    setSaving(true);
    setError("");
    try {
      const d = await request(organizationId, locationId, "PATCH", {
        printing: settings.printing,
      });
      setSettings(d.settings);
      setMessage("Location settings saved.");
      setTimeout(() => setMessage(""), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/dashboard/restaurants/${organizationId}`}
          className="text-sm font-semibold text-orange-600"
        >
          ← Restaurant workspace
        </Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
              Location settings
            </p>
            <h1 className="mt-1 text-3xl font-bold">Location configuration</h1>
            <p className="mt-2 text-slate-600">
              Physical printer configuration is stored separately for each location.
            </p>
          </div>
          <div className="min-w-[240px]">
            <label className="mb-2 block text-sm font-semibold">Location</label>
            <select
              className="field"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
            >
              {loc.locations.map((l) => (
                <option key={l._id || l.id} value={l._id || l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {!canManage && !perm.loading && (
          <div className="mt-5 rounded-xl border bg-white p-4 text-sm">
            <strong>Read only.</strong> You can view these settings, but only a manager with Manage
            store settings permission or an Admin can change them.
          </div>
        )}
        {(error || loc.error) && (
          <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error || loc.error}</p>
        )}
        {message && (
          <p className="mt-5 rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>
        )}
        {loading || loc.loading ? (
          <p className="mt-8">Loading…</p>
        ) : (
          locationId && (
            <div className="mt-7 space-y-6">
              <section className="rounded-2xl border bg-white p-6">
                <h2 className="text-xl font-bold">Printing</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Printer IDs are location-specific. API credentials remain server-side.
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="flex items-center gap-3">
                    <input
                      disabled={!canManage}
                      type="checkbox"
                      checked={!!settings.printing?.enabled}
                      onChange={(e) => setPrinting("enabled", e.target.checked)}
                    />{" "}
                    Enable printing
                  </label>
                  <select
                    disabled={!canManage}
                    className="field"
                    value={settings.printing?.provider || "none"}
                    onChange={(e) => setPrinting("provider", e.target.value)}
                  >
                    <option value="none">None</option>
                    <option value="printnode">PrintNode</option>
                    <option value="orderxo_agent">OrderXO Agent</option>
                  </select>
                </div>
                {["kitchen", "receipt"].map((target) => (
                  <div key={target} className="mt-6 rounded-xl border p-5">
                    <h3 className="font-bold capitalize">{target} printer</h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <input
                        disabled={!canManage}
                        className="field"
                        placeholder="Printer ID"
                        value={settings.printing?.[target]?.printerId || ""}
                        onChange={(e) => setPrinter(target, "printerId", e.target.value)}
                      />
                      <input
                        disabled={!canManage}
                        className="field"
                        placeholder="Printer name"
                        value={settings.printing?.[target]?.printerName || ""}
                        onChange={(e) => setPrinter(target, "printerName", e.target.value)}
                      />
                      <label className="flex items-center gap-2">
                        <input
                          disabled={!canManage}
                          type="checkbox"
                          checked={!!settings.printing?.[target]?.enabled}
                          onChange={(e) => setPrinter(target, "enabled", e.target.checked)}
                        />{" "}
                        Enabled
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          disabled={!canManage}
                          type="checkbox"
                          checked={!!settings.printing?.[target]?.autoPrint}
                          onChange={(e) => setPrinter(target, "autoPrint", e.target.checked)}
                        />{" "}
                        Auto print
                      </label>
                    </div>
                  </div>
                ))}
              </section>
              {canManage && (
                <button disabled={saving} onClick={save} className="primary">
                  {saving ? "Saving…" : "Save location settings"}
                </button>
              )}
            </div>
          )
        )}
      </div>
    </main>
  );
}
