"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Flame,
  History,
  Loader2,
  Search,
  ShoppingCart,
  X,
  BellRing,
} from "lucide-react";
import LocationPageShell from "./LocationPageShell";
const usd = (c) => `$${((Number(c) || 0) / 100).toFixed(2)}`,
  usdD = (n) => `$${Number(n || 0).toFixed(2)}`;
async function get(path, organizationId, locationId, params = {}) {
  const q = new URLSearchParams({ organizationId, locationId });
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) q.set(key, String(value));
  });
  const r = await fetch(`/api/owner/manage/admin/${path}?${q.toString()}`, { cache: "no-store" });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Request failed");
  return d;
}
export default function OrdersManager({ organizationId }) {
  return (
    <LocationPageShell
      organizationId={organizationId}
      title="Orders"
      description="Manage carts, active orders, order history and reports for each location."
    >
      {({ locationId, loading }) => (
        <Orders organizationId={organizationId} locationId={locationId} locationLoading={loading} />
      )}
    </LocationPageShell>
  );
}
function Orders({ organizationId, locationId, locationLoading }) {
  const [tab, setTab] = useState("active-orders"),
    [active, setActive] = useState([]),
    [carts, setCarts] = useState([]),
    [history, setHistory] = useState([]),
    [report, setReport] = useState(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [debounced, setDebounced] = useState(""),
    [page, setPage] = useState(1),
    [pagination, setPagination] = useState(null);
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = new URLSearchParams(window.location.hash.slice(1)).get("tab");
      if (["active-carts", "active-orders", "orders-history", "report"].includes(t)) setTab(t);
    }
  }, []);
  const selectTab = (id) => {
    setTab(id);
    setPage(1);
    if (typeof window !== "undefined") window.location.hash = `tab=${id}`;
  };
  const load = useCallback(async () => {
    if (!locationId) return;
    setLoading(true);
    setError("");
    try {
      let d;
      if (tab === "active-carts") {
        d = await get("carts", organizationId, locationId);
        setCarts(d.carts || []);
        setPagination(d.pagination);
      } else if (tab === "active-orders") {
        d = await get("orders", organizationId, locationId);
        setActive(d.orders || []);
        setPagination(d.pagination);
      } else if (tab === "orders-history") {
        d = await get("orders/history", organizationId, locationId, {
          page,
          search: debounced,
        });
        setHistory(d.orders || []);
        setPagination(d.pagination);
      } else {
        d = await get("reports", organizationId, locationId);
        setReport(d);
        setPagination(null);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [organizationId, locationId, tab, page, debounced]);
  useEffect(() => {
    load();
  }, [load]);

  // Keep operational data fresh even when the owner is viewing another Orders tab.
  // These background requests intentionally do not touch the page-level loading state,
  // so History/Report never flash a loading screen every time polling runs.
  const fetchActiveOrders = useCallback(async () => {
    if (!locationId) return;
    try {
      const d = await get("orders", organizationId, locationId);
      setActive(d.orders || []);
    } catch (e) {
      console.error("Unable to refresh active orders", e);
    }
  }, [organizationId, locationId]);
  const fetchActiveCarts = useCallback(async () => {
    if (!locationId) return;
    try {
      const d = await get("carts", organizationId, locationId);
      setCarts(d.carts || []);
    } catch (e) {
      console.error("Unable to refresh active carts", e);
    }
  }, [organizationId, locationId]);
  useEffect(() => {
    if (!locationId) return;
    fetchActiveOrders();
    const id = setInterval(fetchActiveOrders, 15000);
    return () => clearInterval(id);
  }, [locationId, fetchActiveOrders]);
  // Active carts are only relevant while the owner is viewing the Active Carts tab.
  // `load()` fetches them immediately when the tab becomes active; this interval only
  // keeps that visible tab fresh every 30 seconds. No carts API calls run on other tabs.
  useEffect(() => {
    if (!locationId || tab !== "active-carts") return;
    const id = setInterval(fetchActiveCarts, 30000);
    return () => clearInterval(id);
  }, [locationId, tab, fetchActiveCarts]);
  const reportCount = (report?.dailyReports || []).reduce(
    (s, d) => s + Number(d.orderCount || 0),
    0,
  );
  const tabs = [
    { id: "active-carts", label: "Active Carts", Icon: ShoppingCart, count: carts.length },
    { id: "active-orders", label: "Active Orders", Icon: Flame, count: active.length },
    {
      id: "orders-history",
      label: "Orders History",
      Icon: History,
      count: pagination?.total ?? history.length,
    },
    { id: "report", label: "Report", Icon: BarChart3, count: reportCount },
  ];
  if (locationLoading && !locationId) return <Skeleton />;
  return (
    <div className="mt-8">
      <div className="overflow-x-auto rounded-2xl bg-white shadow-md">
        <div className="flex min-w-max">
          {tabs.map(({ id, label, Icon, count }) => (
            <button
              key={id}
              onClick={() => selectTab(id)}
              className={`flex items-center gap-2 border-b-4 px-6 py-5 text-base font-semibold transition ${tab === id ? "border-orange-500 text-orange-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              <Icon size={20} />
              {label}
              {(id === "orders-history" || id === "report") && <span>({count || 0})</span>}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}
      {tab === "orders-history" && (
        <div className="relative mt-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
          <input
            className="w-full rounded-xl border bg-white py-3 pl-10 pr-10 outline-none focus:ring-2 focus:ring-orange-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or order number..."
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <X size={18} />
            </button>
          )}
        </div>
      )}
      <div className="mt-6">
        {loading ? (
          <Loading />
        ) : tab === "active-carts" ? (
          <ActiveCarts carts={carts} />
        ) : tab === "active-orders" ? (
          <ActiveOrders orders={active} />
        ) : tab === "orders-history" ? (
          <HistoryTable orders={history} pagination={pagination} page={page} setPage={setPage} />
        ) : (
          <ReportTable report={report} />
        )}
      </div>
      {tab !== "active-orders" && active.length > 0 && (
        <ActiveOrderAlert count={active.length} onView={() => selectTab("active-orders")} />
      )}
    </div>
  );
}
function ActiveOrderAlert({ count, onView }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <BellRing size={28} />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-900">
            Active {count === 1 ? "Order" : "Orders"}
          </h2>
          <p className="mt-2 text-slate-500">
            {count === 1
              ? "There is an active order waiting for your attention."
              : `There are ${count} active orders waiting for your attention.`}
          </p>
          <button
            onClick={onView}
            className="mt-6 w-full rounded-xl bg-orange-500 px-5 py-3 font-bold text-white transition hover:bg-orange-600"
          >
            View Active Orders
          </button>
        </div>
      </div>
    </div>
  );
}
function Loading() {
  return (
    <div className="flex justify-center rounded-2xl border bg-white py-16">
      <Loader2 className="animate-spin text-orange-500" size={34} />
    </div>
  );
}
function Skeleton() {
  return (
    <div className="mt-8 animate-pulse">
      <div className="h-20 rounded-2xl bg-white shadow-sm" />
      <div className="mt-6 h-72 rounded-2xl bg-white" />
    </div>
  );
}
function Empty({ children }) {
  return (
    <div className="rounded-2xl border bg-white p-12 text-center text-slate-500">{children}</div>
  );
}
function ActiveCarts({ carts }) {
  if (!carts.length) return <Empty>No active carts at this location.</Empty>;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {carts.map((c) => (
        <div key={c._id} className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex justify-between gap-4">
            <div>
              <div className="font-bold">{c.customer?.name || "Guest"}</div>
              <div className="text-sm text-slate-500">
                {c.customer?.email || "No email"} · {c.source || "online"}
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold">{usd(c.subtotalCents)}</div>
              <div className="text-xs text-slate-400">
                {new Date(c.lastActivityAt || c.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="mt-4 border-t pt-3 text-sm text-slate-600">
            {(c.items || []).map((i, n) => (
              <div key={n}>
                {i.quantity || 1}× {i.name}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
function ActiveOrders({ orders }) {
  if (!orders.length) return <Empty>No active orders at this location.</Empty>;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {orders.map((o) => (
        <div key={o._id} className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex justify-between gap-4">
            <div>
              <div className="text-lg font-bold">#{o.orderNumber || String(o._id).slice(-6)}</div>
              <div className="text-sm text-slate-500">
                {o.customer?.name || "Guest"} · {new Date(o.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold">{usd(o.totalAmountCents)}</div>
              <span className="mt-1 inline-block rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold capitalize text-orange-700">
                {o.status}
              </span>
            </div>
          </div>
          <div className="mt-4 border-t pt-3 text-sm text-slate-600">
            {(o.items || []).map((i, n) => (
              <div key={n}>
                {i.quantity || 1}× {i.name}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
const type = (o) => (o.orderType || "to_go").replace("_", " ");
function HistoryTable({ orders, pagination, page, setPage }) {
  if (!orders.length) return <Empty>No orders found.</Empty>;
  return (
    <>
      <div className="overflow-x-auto rounded-2xl bg-white shadow">
        <table className="min-w-[1500px] w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              {[
                "Order",
                "Date",
                "Customer",
                "Type",
                "Channel",
                "Status",
                "Items",
                "Subtotal",
                "Tax",
                "Tip",
                "Order Service Fee",
                "Gross Sales",
                "Rewards Redeemed",
                "Promotion",
                "Refunded",
                "Transaction Fee",
                "Net",
              ].map((h) => (
                <th key={h} className="px-4 py-4 font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const promo = Number(o.promoDiscountCents || 0) / 100;
              return (
                <tr key={o._id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold">#{o.orderNumber}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div>{o.customer?.name || "Guest"}</div>
                    <div className="text-xs text-slate-400">{o.customer?.email}</div>
                  </td>
                  <td className="px-4 py-3 capitalize">{type(o)}</td>
                  <td className="px-4 py-3 capitalize">{o.paymentChannel || "online"}</td>
                  <td className="px-4 py-3 capitalize">{o.status}</td>
                  <td className="px-4 py-3">
                    {(o.items || []).reduce((s, i) => s + (i.quantity || 1), 0)}
                  </td>
                  <td className="px-4 py-3">{usd(o.subtotalCents)}</td>
                  <td className="px-4 py-3 text-blue-600">{usd(o.taxCents)}</td>
                  <td className="px-4 py-3 text-blue-600">{usd(o.tipCents)}</td>
                  <td className="px-4 py-3 text-blue-600">{usd(o.onlineServiceFeeCents)}</td>
                  <td className="px-4 py-3 font-semibold">{usd(o.totalAmountCents)}</td>
                  <td className="px-4 py-3 text-red-600">-{usdD(o.rewardsRedeemed)}</td>
                  <td className="px-4 py-3">
                    {o.promoCode && promo > 0 ? (
                      <>
                        <div className="font-semibold text-green-700">{o.promoCode}</div>
                        <div className="text-red-600">-{usdD(promo)}</div>
                      </>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-red-600">-{usdD(o.refunded)}</td>
                  <td className="px-4 py-3 text-red-600">-{usdD(o.stripeFee)}</td>
                  <td className="px-4 py-3 font-bold text-green-600">{usdD(o.net)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pagination?.totalPages > 1 && (
        <div className="mt-4 flex justify-end gap-2">
          <button
            className="rounded-lg border bg-white px-4 py-2 disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="px-3 py-2 text-sm text-slate-500">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            className="rounded-lg border bg-white px-4 py-2 disabled:opacity-40"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
function ReportTable({ report }) {
  const rows = report?.dailyReports || [];
  if (!rows.length) return <Empty>No report data for this month.</Empty>;
  const totals = rows.reduce((a, d) => {
    for (const k of [
      "orderCount",
      "subtotal",
      "tax",
      "tip",
      "onlineOrderingFee",
      "grossSales",
      "rewardsRedeemed",
      "promoDiscount",
      "refunded",
      "transactionFee",
      "netTotal",
    ])
      a[k] = (a[k] || 0) + Number(d[k] || 0);
    return a;
  }, {});
  const cells = (d) => [
    d.orderCount,
    usdD(d.subtotal),
    usdD(d.tax),
    usdD(d.tip),
    usdD(d.onlineOrderingFee),
    usdD(d.grossSales),
    `-${usdD(d.rewardsRedeemed)}`,
    d.promoDiscount ? `-${usdD(d.promoDiscount)}` : "—",
    `-${usdD(d.refunded)}`,
    `-${usdD(d.transactionFee)}`,
    usdD(d.netTotal),
  ];
  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow">
      <table className="min-w-[1450px] w-full text-sm">
        <thead className="bg-slate-100 text-left text-slate-600">
          <tr>
            {[
              "Date",
              "Orders",
              "Subtotal",
              "Tax",
              "Tip",
              "Order Service Fee",
              "Gross Sales",
              "Rewards Redeemed",
              "Promotion Discount",
              "Refunded Amount",
              "Transaction Fee",
              "Net Total",
            ].map((h) => (
              <th key={h} className="px-4 py-4 font-bold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...rows].reverse().map((d, i) => (
            <tr
              key={d.date}
              className={
                i === 0 ? "bg-black font-semibold text-white" : "border-t hover:bg-slate-50"
              }
            >
              <td className="px-4 py-3">{d.date}</td>
              {cells(d).map((v, j) => (
                <td
                  key={j}
                  className={`px-4 py-3 whitespace-nowrap ${[2, 3, 4].includes(j) ? (i === 0 ? "text-blue-300" : "text-blue-600") : [6, 7, 8, 9].includes(j) ? (i === 0 ? "text-red-400" : "text-red-600") : j === 10 ? (i === 0 ? "text-green-400" : "text-green-600") : ""}`}
                >
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-900 font-bold text-white">
            <td className="px-4 py-4">Month Total</td>
            {cells(totals).map((v, j) => (
              <td
                key={j}
                className={`px-4 py-4 whitespace-nowrap ${[2, 3, 4].includes(j) ? "text-blue-300" : [6, 7, 8, 9].includes(j) ? "text-red-400" : j === 10 ? "text-green-400" : ""}`}
              >
                {v}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
