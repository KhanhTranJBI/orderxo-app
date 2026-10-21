"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { ownerFetch } from "../../lib/ownerFetch";
import useRestaurantLocation from "./useRestaurantLocation";
export default function KioskManager({ organizationId }) {
  const loc = useRestaurantLocation(organizationId);
  const [locationId, setLocationId] = useState(""),
    [devices, setDevices] = useState([]),
    [name, setName] = useState("Front Counter"),
    [busy, setBusy] = useState(false),
    [pair, setPair] = useState(null),
    [revokeId, setRevokeId] = useState(null);
  useEffect(() => {
    if (!locationId && loc.locations?.length)
      setLocationId(String(loc.locations[0]._id || loc.locations[0].id));
  }, [loc.locations, locationId]);
  const request = async (method, body) => {
    const q = new URLSearchParams({ organizationId, locationId });
    const r = await ownerFetch(`/api/owner/kiosk/installations?${q}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify({ organizationId, locationId, ...body }) : undefined,
      cache: "no-store",
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw Error(d.error || "Request failed");
    return d;
  };
  async function refresh() {
    if (!locationId) return;
    try {
      const d = await request("GET");
      setDevices(d.installations || []);
    } catch (e) {
      toast.error(e.message);
    }
  }
  useEffect(() => {
    refresh();
  }, [locationId, organizationId]);
  async function create(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await request("POST", { name });
      setPair(d);
      toast.success("Pairing code created");
      await refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function revoke() {
    if (!revokeId) return;
    setBusy(true);
    try {
      await request("DELETE", { installationId: revokeId });
      setRevokeId(null);
      toast.success("Kiosk revoked");
      await refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <Link
          href={`/dashboard/restaurants/${organizationId}/location-settings`}
          className="text-sm text-blue-600"
        >
          ← Location Settings
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Kiosk Devices</h1>
        <p className="text-gray-600">
          Pair each iPad with one location. Revoke individual devices at any time.
        </p>
      </div>
      <label className="block font-medium">
        Location
        <select
          className="mt-2 block w-full rounded-lg border p-3"
          value={locationId}
          onChange={(e) => {
            setLocationId(e.target.value);
            setPair(null);
          }}
        >
          {(loc.locations || []).map((x) => (
            <option key={x._id || x.id} value={x._id || x.id}>
              {x.name}
            </option>
          ))}
        </select>
      </label>
      <form onSubmit={create} className="flex flex-wrap items-end gap-3 rounded-xl border p-4">
        <label className="flex-1">
          Device name
          <input
            className="mt-1 block w-full rounded-lg border p-3"
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <button
          className="rounded-lg bg-black px-5 py-3 font-semibold text-white disabled:opacity-50"
          disabled={busy || !locationId}
        >
          Add Kiosk
        </button>
      </form>
      {pair && (
        <div className="rounded-xl border-2 border-green-500 bg-green-50 p-5">
          <h2 className="font-bold">One-time pairing code</h2>
          <p className="my-4 break-all font-mono text-2xl tracking-wider">{pair.pairingCode}</p>
          <p>
            Enter this code at kiosk.orderxo.com. Expires{" "}
            {new Date(pair.pairingExpiresAt).toLocaleString()}.
          </p>
          <button
            onClick={() => navigator.clipboard.writeText(pair.pairingCode)}
            className="mt-3 rounded-lg border px-4 py-2"
          >
            Copy code
          </button>
        </div>
      )}
      <div className="space-y-3">
        {devices.map((d) => (
          <div key={d.id} className="flex items-center justify-between rounded-xl border p-4">
            <div>
              <strong>{d.name}</strong>
              <p className="text-sm text-gray-600">
                {d.revokedAt ? "Revoked" : d.pairedAt ? "Paired" : "Awaiting pairing"}
              </p>
            </div>
            {!d.revokedAt && (
              <button
                onClick={() => setRevokeId(d.id)}
                className="rounded-lg border border-red-300 px-4 py-2 text-red-700"
              >
                Revoke
              </button>
            )}
          </div>
        ))}
      </div>
      {revokeId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6">
            <h2 className="text-xl font-bold">Revoke this kiosk?</h2>
            <p className="my-4">The device will no longer be authorized.</p>
            <div className="flex gap-3">
              <button className="rounded-lg border px-4 py-2" onClick={() => setRevokeId(null)}>
                Cancel
              </button>
              <button
                disabled={busy}
                className="rounded-lg bg-red-600 px-4 py-2 text-white"
                onClick={revoke}
              >
                Revoke device
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
