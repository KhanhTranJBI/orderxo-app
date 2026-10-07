"use client";
import { useEffect, useState } from "react";
import LocationPageShell from "./LocationPageShell";
const money = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((n || 0) / 100);
export default function OrdersManager({ organizationId }) {
  return (
    <LocationPageShell
      organizationId={organizationId}
      title="Orders"
      description="Active orders for the selected location."
    >
      {({ locationId }) => <Orders organizationId={organizationId} locationId={locationId} />}
    </LocationPageShell>
  );
}
function Orders({ organizationId, locationId }) {
  const [data, setData] = useState([]),
    [err, setErr] = useState("");
  async function load() {
    if (!locationId) return;
    let r = await fetch(
        `/api/owner/manage/admin/orders?organizationId=${organizationId}&locationId=${locationId}&limit=50`,
        { cache: "no-store" },
      ),
      d = await r.json();
    if (!r.ok) setErr(d.error || "Unable to load orders");
    else {
      setErr("");
      setData(d.orders || []);
    }
  }
  useEffect(() => {
    load();
  }, [locationId]);
  return (
    <section className="mt-8 space-y-3">
      {err && <p className="rounded-xl bg-red-50 p-4 text-red-700">{err}</p>}
      {!err && data.length === 0 && (
        <p className="rounded-2xl border bg-white p-8 text-slate-500">
          No active orders at this location.
        </p>
      )}
      {data.map((o) => (
        <div key={o._id} className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <b>#{o.orderNumber || String(o._id).slice(-6)}</b>
              <p className="text-sm text-slate-500">
                {o.customer?.name || "Guest"} · {new Date(o.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <b>{money(o.totalAmountCents)}</b>
              <p className="text-sm capitalize text-orange-600">{o.status}</p>
            </div>
          </div>
          <div className="mt-3 text-sm text-slate-600">
            {(o.items || []).map((i) => `${i.quantity}× ${i.name}`).join(" · ")}
          </div>
        </div>
      ))}
    </section>
  );
}
