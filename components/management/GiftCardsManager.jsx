"use client";
import { ownerFetch } from "../../lib/ownerFetch";
import { useEffect, useState } from "react";
import { Gift, History, X } from "lucide-react";
import LocationPageShell from "./LocationPageShell";
const money = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((n || 0) / 100);
export default function GiftCardsManager({ organizationId }) {
  return (
    <LocationPageShell
      organizationId={organizationId}
      title="Gift Cards"
      description="Look up and manage gift cards for the selected location."
    >
      {({ locationId }) => <Cards organizationId={organizationId} locationId={locationId} />}
    </LocationPageShell>
  );
}
function Cards({ organizationId, locationId }) {
  const [tab, setTab] = useState("active"),
    [items, setItems] = useState([]),
    [page, setPage] = useState(1),
    [meta, setMeta] = useState({}),
    [code, setCode] = useState(""),
    [found, setFound] = useState(null),
    [err, setErr] = useState(""),
    [loading, setLoading] = useState(false);
  const load = async () => {
    if (!locationId) return;
    setLoading(true);
    const path = tab === "active" ? "gift-cards" : "gift-cards/history";
    const r = await ownerFetch(
        `/api/owner/manage/admin/${path}?organizationId=${organizationId}&locationId=${locationId}&page=${page}&limit=12`,
        { cache: "no-store" },
      ),
      d = await r.json();
    r.ok
      ? (setItems(d.giftCards || []), setMeta(d.pagination || {}), setErr(""))
      : setErr(d.error || "Unable to load gift cards");
    setLoading(false);
  };
  useEffect(() => {
    setPage(1);
  }, [tab, locationId]);
  useEffect(() => {
    load();
  }, [tab, locationId, page]);
  async function check() {
    if (!code.trim()) return;
    setErr("");
    const r = await ownerFetch(
        `/api/owner/manage/admin/gift-cards/check?organizationId=${organizationId}&locationId=${locationId}&code=${encodeURIComponent(code.trim().toUpperCase())}`,
        { cache: "no-store" },
      ),
      d = await r.json();
    r.ok ? setFound(d.giftCard) : setErr(d.error || "Gift card not found");
  }
  return (
    <section className="mt-8">
      <div className="overflow-hidden rounded-2xl bg-white shadow-md">
        <nav className="flex gap-8 px-6">
          {[
            [
              "active",
              Gift,
              `Active Gift Cards${tab === "active" && !loading ? ` (${meta.total || 0})` : ""}`,
            ],
            [
              "history",
              History,
              `Gift Cards History${tab === "history" && !loading ? ` (${meta.total || 0})` : ""}`,
            ],
          ].map(([id, Icon, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative flex items-center gap-2 py-5 text-lg font-semibold ${tab === id ? "text-orange-600" : "text-slate-500"} after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-full after:bg-orange-500 ${tab === id ? "after:scale-x-100" : "after:scale-x-0"}`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mx-auto mt-8 max-w-xl rounded-2xl bg-white p-7 shadow">
        <h2 className="flex items-center gap-2 text-xl font-bold text-orange-600">
          🎟️ Gift Card Lookup
        </h2>
        <p className="mt-5 text-slate-500">
          Enter the gift card code <b>after</b> your restaurant gift card prefix.
        </p>
        <div className="mt-5 flex gap-3">
          <div className="relative flex-1">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="w-full rounded-xl border px-4 py-3 font-mono tracking-wider"
            />
            {code && (
              <button
                onClick={() => {
                  setCode("");
                  setFound(null);
                }}
                className="absolute right-3 top-3 text-slate-400"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <button
            disabled={!code}
            onClick={check}
            className="rounded-xl bg-orange-500 px-6 py-3 font-bold text-white disabled:opacity-40"
          >
            Check
          </button>
        </div>
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        {found && (
          <div className="mt-5 rounded-xl border bg-slate-50 p-4">
            <div className="flex justify-between">
              <b>{found.recipientName}</b>
              <span className="capitalize">{found.status}</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{found.recipientEmail}</p>
            <p className="mt-3 text-xl font-bold">Balance: {money(found.balanceCents)}</p>
          </div>
        )}
      </div>
      <div className="mt-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : items.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {items.map((g) => (
              <div key={g._id || g.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex justify-between">
                  <span>Status</span>
                  <b className="capitalize">{g.status}</b>
                </div>
                <div className="mt-4 border-t pt-4">
                  <p className="font-bold">{g.recipientName}</p>
                  <p className="text-sm text-slate-500">{g.recipientEmail}</p>
                </div>
                <div className="mt-4 flex justify-between">
                  <span>Original</span>
                  <b>{money(g.amountCents)}</b>
                </div>
                <div className="mt-2 flex justify-between">
                  <span>Balance</span>
                  <b className="text-orange-600">{money(g.balanceCents)}</b>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-lg text-slate-500">No gift cards found</p>
        )}
      </div>
      <div className="mt-8 flex items-center justify-between text-slate-500">
        <span>
          Page {meta.page || 1} of {meta.totalPages || 0} • {meta.total || 0} gift cards
        </span>
        <div className="flex gap-3">
          <button
            disabled={!meta.hasPrev}
            onClick={() => setPage((x) => x - 1)}
            className="rounded-lg border bg-white px-4 py-2 disabled:opacity-40"
          >
            ← Previous
          </button>
          <button
            disabled={!meta.hasNext}
            onClick={() => setPage((x) => x + 1)}
            className="rounded-lg border bg-white px-4 py-2 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </section>
  );
}
