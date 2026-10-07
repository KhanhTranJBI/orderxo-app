"use client";
import { useEffect, useState } from "react";
import LocationPageShell from "./LocationPageShell";
const money = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((n || 0) / 100);
export default function GiftCardsManager({ organizationId }) {
  return (
    <LocationPageShell
      organizationId={organizationId}
      title="Gift cards"
      description="Gift cards issued at the selected location."
    >
      {({ locationId }) => <Cards organizationId={organizationId} locationId={locationId} />}
    </LocationPageShell>
  );
}
function Cards({ organizationId, locationId }) {
  const [items, setItems] = useState([]),
    [page, setPage] = useState(1),
    [meta, setMeta] = useState({}),
    [err, setErr] = useState("");
  useEffect(() => {
    if (!locationId) return;
    (async () => {
      let r = await fetch(
          `/api/owner/manage/admin/gift-cards?organizationId=${organizationId}&locationId=${locationId}&page=${page}&limit=25`,
          { cache: "no-store" },
        ),
        d = await r.json();
      if (r.ok) {
        setItems(d.giftCards || []);
        setMeta(d.pagination || {});
        setErr("");
      } else setErr(d.error || "Unable to load gift cards");
    })();
  }, [locationId, page]);
  return (
    <section className="mt-8">
      <div className="overflow-hidden rounded-2xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4">Recipient</th>
              <th className="p-4">Original</th>
              <th className="p-4">Balance</th>
              <th className="p-4">Status</th>
              <th className="p-4">Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((g) => (
              <tr key={g._id} className="border-t">
                <td className="p-4">
                  <b>{g.recipientName}</b>
                  <div className="text-slate-500">{g.recipientEmail}</div>
                </td>
                <td className="p-4">{money(g.amountCents)}</td>
                <td className="p-4 font-semibold">{money(g.balanceCents)}</td>
                <td className="p-4 capitalize">{g.status}</td>
                <td className="p-4">{new Date(g.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!err && !items.length && (
          <p className="p-8 text-center text-slate-500">No gift cards for this location.</p>
        )}
      </div>
      {err && <p className="mt-4 text-red-600">{err}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <button
          disabled={!meta.hasPrev}
          onClick={() => setPage((x) => x - 1)}
          className="rounded-lg border px-3 py-2 disabled:opacity-40"
        >
          Previous
        </button>
        <button
          disabled={!meta.hasNext}
          onClick={() => setPage((x) => x + 1)}
          className="rounded-lg border px-3 py-2 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </section>
  );
}
