"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { ownerFetch } from "../../lib/ownerFetch";
import useRestaurantLocation from "./useRestaurantLocation";
export default function KioskManager({
  organizationId,
  selectedLocationId,
  embedded = false,
  canManage = true,
}) {
  const loc = useRestaurantLocation(organizationId);
  const [planLoading, setPlanLoading] = useState(true);
  const [proEnabled, setProEnabled] = useState(false);
  useEffect(() => {
    let active = true;
    setPlanLoading(true);
    ownerFetch(
      `/api/owner/subscriptions/current?organizationId=${encodeURIComponent(organizationId)}`,
      { cache: "no-store" },
    )
      .then(async (r) => {
        if (!r.ok) throw new Error("Subscription unavailable");
        return r.json();
      })
      .then((d) => {
        if (active)
          setProEnabled(d.features?.kioskDevices === true && d.subscription?.plan === "pro");
      })
      .catch(() => {
        if (active) setProEnabled(false);
      })
      .finally(() => {
        if (active) setPlanLoading(false);
      });
    return () => {
      active = false;
    };
  }, [organizationId]);
  const [locationId, setLocationId] = useState(""),
    [devices, setDevices] = useState([]),
    [name, setName] = useState("Front Counter"),
    [busy, setBusy] = useState(false),
    [pair, setPair] = useState(null),
    [revokeId, setRevokeId] = useState(null),
    [editingReader, setEditingReader] = useState(null),
    [readerLocation, setReaderLocation] = useState(""),
    [readerId, setReaderId] = useState("");
  useEffect(() => {
    if (embedded) {
      setLocationId(selectedLocationId || "");
      setPair(null);
    } else if (!locationId && loc.locations?.length) {
      setLocationId(String(loc.locations[0]._id || loc.locations[0].id));
    }
  }, [embedded, selectedLocationId, loc.locations, locationId]);
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
    if (!locationId || !proEnabled) return;
    try {
      const d = await request("GET");
      setDevices(d.installations || []);
    } catch (e) {
      toast.error(e.message);
    }
  }
  useEffect(() => {
    refresh();
  }, [locationId, organizationId, proEnabled]);
  async function create(e) {
    e.preventDefault();
    if (!canManage || !proEnabled) return;
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
  async function saveReader() {
    if (!editingReader || busy) return;
    setBusy(true);
    try {
      await request("PATCH", {
        installationId: editingReader.id,
        terminalLocationId: readerLocation,
        terminalReaderId: readerId,
      });
      setEditingReader(null);
      toast.success("Reader assignment saved. Payment processing is not yet enabled.");
      await refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function revoke() {
    if (!revokeId || !canManage || !proEnabled) return;
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
    <div
      className={
        embedded
          ? "mt-5 space-y-6 rounded-2xl border bg-white p-5 md:p-6"
          : "mx-auto max-w-5xl space-y-6 p-6"
      }
    >
      <div>
        {!embedded && (
          <Link
            href={`/dashboard/restaurants/${organizationId}/store#tab=kiosk-devices`}
            className="text-sm text-blue-600"
          >
            ← Store Settings
          </Link>
        )}
        <h1 className="mt-2 text-3xl font-bold">Kiosk Devices</h1>
        <p className="text-gray-600">
          Pair each iPad with one location. Revoke individual devices at any time.
        </p>
      </div>
      {!embedded && (
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
      )}
      {embedded && (
        <p className="text-sm text-slate-600">
          Location:{" "}
          <strong>
            {loc.locations?.find((x) => String(x._id || x.id) === locationId)?.name ||
              "Selected location"}
          </strong>
        </p>
      )}
      {planLoading ? (
        <p className="rounded-xl border p-4 text-slate-600">Checking subscription…</p>
      ) : !proEnabled ? (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-6">
          <h2 className="text-xl font-bold text-slate-900">Kiosk Devices is a Pro feature</h2>
          <p className="mt-2 text-slate-700">
            Upgrade to Pro to pair and manage self-service kiosks for this location.
          </p>
          <Link
            className="mt-4 inline-block rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white"
            href={`/dashboard/settings/billing?organizationId=${encodeURIComponent(organizationId)}`}
          >
            View plans & upgrade
          </Link>
        </div>
      ) : null}
      {proEnabled && canManage && (
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
      )}
      {proEnabled && pair && (
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
      {proEnabled && (
        <div className="space-y-3">
          {devices.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <strong>{d.name}</strong>
                <p className="text-sm text-gray-600">
                  {d.revokedAt ? "Revoked" : d.pairedAt ? "Paired" : "Awaiting pairing"}
                </p>
              </div>
              {canManage && !d.revokedAt && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingReader(d);
                    setReaderLocation(d.terminalLocationId || "");
                    setReaderId(d.terminalReaderId || "");
                  }}
                  className="ml-auto mr-3 rounded-lg border px-4 py-2 text-sm"
                >
                  {d.terminalReaderId ? "Edit reader" : "Assign S710"}
                </button>
              )}
              {canManage && !d.revokedAt && (
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
      )}
      {proEnabled && editingReader && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
        >
          <div className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6">
            <h2 className="text-xl font-bold">Assign Stripe S710 · {editingReader.name}</h2>
            <p className="text-sm text-slate-600">
              Save the IDs from Stripe Dashboard → Terminal. This records the assignment only; it
              does not activate payments.
            </p>
            <label className="block">
              Terminal location ID
              <input
                className="mt-1 w-full rounded-lg border p-3"
                placeholder="tml_..."
                value={readerLocation}
                onChange={(e) => setReaderLocation(e.target.value)}
              />
            </label>
            <label className="block">
              Reader ID
              <input
                className="mt-1 w-full rounded-lg border p-3"
                placeholder="tmr_..."
                value={readerId}
                onChange={(e) => setReaderId(e.target.value)}
              />
            </label>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border px-4 py-2"
                onClick={() => setEditingReader(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || Boolean(readerLocation) !== Boolean(readerId)}
                className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
                onClick={saveReader}
              >
                Save assignment
              </button>
            </div>
          </div>
        </div>
      )}
      {proEnabled && revokeId && (
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
