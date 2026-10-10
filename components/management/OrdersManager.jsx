"use client";
import { ownerFetch } from "../../lib/ownerFetch";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Flame,
  History,
  Loader2,
  Search,
  ShoppingCart,
  X,
  BellRing,
  Check,
  Printer,
  RotateCcw,
  Ban,
  CreditCard,
  Monitor,
} from "lucide-react";
import LocationPageShell from "./LocationPageShell";
const usd = (c) => `$${((Number(c) || 0) / 100).toFixed(2)}`,
  usdD = (n) => `$${Number(n || 0).toFixed(2)}`;
async function get(path, organizationId, locationId, params = {}) {
  const q = new URLSearchParams({ organizationId, locationId });
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) q.set(key, String(value));
  });
  const r = await ownerFetch(`/api/owner/manage/admin/${path}?${q.toString()}`, {
    cache: "no-store",
  });
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
      {({ locationId, loading, access }) => (
        <Orders
          organizationId={organizationId}
          locationId={locationId}
          locationLoading={loading}
          canManage={access.can("orders.manage")}
        />
      )}
    </LocationPageShell>
  );
}
function Orders({ organizationId, locationId, locationLoading, canManage }) {
  const [alertOrderIds, setAlertOrderIds] = useState([]);
  const seenOrdersRef = useRef(new Set());
  const initializedLocationRef = useRef(null);
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
    if (id === "active-orders") setAlertOrderIds([]);
    setTab(id);
    setPage(1);
    if (typeof window !== "undefined") window.location.hash = `tab=${id}`;
  };
  // Only notify for newly arriving, paid-but-unconfirmed orders. The first
  // snapshot establishes a baseline and never interrupts an owner on tab change.
  // Confirmed/preparing orders are not eligible for alerts.
  const observeActiveOrders = useCallback(
    (orders) => {
      const eligible = orders.filter(
        (order) => order?.status === "paid" && order?.paymentStatus === "paid" && order?._id,
      );
      const ids = eligible.map((order) => String(order._id));
      if (initializedLocationRef.current !== locationId) {
        initializedLocationRef.current = locationId;
        seenOrdersRef.current = new Set(ids);
        setAlertOrderIds([]);
        return;
      }
      const fresh = ids.filter((id) => !seenOrdersRef.current.has(id));
      ids.forEach((id) => seenOrdersRef.current.add(id));
      if (fresh.length) {
        setAlertOrderIds((previous) => [...new Set([...previous, ...fresh])]);
      }
      // Clear alerts once another staff member confirms or completes an order.
      setAlertOrderIds((previous) => previous.filter((id) => ids.includes(id)));
    },
    [locationId],
  );
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
        observeActiveOrders(d.orders || []);
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
  }, [organizationId, locationId, tab, page, debounced, observeActiveOrders]);
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
      observeActiveOrders(d.orders || []);
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
      {!canManage && (
        <div className="mb-5 rounded-xl border bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
          Read only — you can view orders, carts, history and reports, but order-management actions
          are disabled.
        </div>
      )}
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
              {tab === id && <span>({count ?? 0})</span>}
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
          <ActiveOrders
            orders={active}
            canManage={canManage}
            organizationId={organizationId}
            locationId={locationId}
            onChanged={load}
          />
        ) : tab === "orders-history" ? (
          <HistoryTable orders={history} pagination={pagination} page={page} setPage={setPage} />
        ) : (
          <ReportTable report={report} />
        )}
      </div>
      {tab !== "active-orders" && alertOrderIds.length > 0 && (
        <ActiveOrderAlert count={alertOrderIds.length} onView={() => selectTab("active-orders")} />
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
function ModifierSelections({ item }) {
  const entries = Object.entries(item.selectedModifiers || {});
  if (!entries.length) return null;
  return (
    <div className="mt-1 space-y-1 text-xs text-slate-500">
      {entries.map(([id, group]) => (
        <div key={id}>
          <span className="font-bold uppercase text-slate-600">
            {group?.title || "Modifiers"}:{" "}
          </span>
          {(group?.selections || []).map((selection) => selection.name).join(", ") || "—"}
        </div>
      ))}
    </div>
  );
}
function OrderItems({ items }) {
  return (
    <div className="mt-4 space-y-3 border-t pt-4">
      {(items || []).map((item, index) => (
        <div key={index} className="flex items-start gap-3">
          {item.image ? (
            <img src={item.image} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
          ) : (
            <div className="h-16 w-16 shrink-0 rounded-lg bg-slate-100" />
          )}
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-900">
              {item.quantity || 1}× {item.name || `Item ${index + 1}`}
            </div>
            <ModifierSelections item={item} />
          </div>
          {Number.isFinite(Number(item.totalPriceCents)) && (
            <div className="font-semibold text-orange-600">{usd(item.totalPriceCents)}</div>
          )}
        </div>
      ))}
    </div>
  );
}
function ActiveCarts({ carts }) {
  if (!carts.length) return <Empty>No active carts at this location.</Empty>;
  return (
    <div className="space-y-4">
      {carts.map((cart) => (
        <div key={cart._id} className="rounded-2xl border border-green-400 bg-white p-5 shadow-sm">
          <div className="flex justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-lg">{cart.customer?.name || "Guest"}</strong>
                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-bold uppercase text-blue-700">
                  {cart.source || "online"}
                </span>
              </div>
              <div className="text-sm text-slate-500">{cart.customer?.email || "No email"}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">
                {usd(
                  cart.subtotalCents ??
                    (cart.items || []).reduce(
                      (sum, item) => sum + (Number(item.totalPriceCents) || 0),
                      0,
                    ),
                )}
              </div>
              <div className="text-xs text-slate-500">
                {new Date(cart.lastActivityAt || cart.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
          <OrderItems items={cart.items} />
        </div>
      ))}
    </div>
  );
}
function OrderChannel({ channel }) {
  const kiosk = channel === "terminal" || channel === "kiosk";
  const Icon = kiosk ? Monitor : CreditCard;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${kiosk ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"}`}
    >
      <Icon size={13} />
      {kiosk ? "KIOSK" : "ONLINE"}
    </span>
  );
}
function ActiveOrders({ orders, canManage, organizationId, locationId, onChanged }) {
  const [dialog, setDialog] = useState(null);
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [directBusyId, setDirectBusyId] = useState(null);
  const [inlineError, setInlineError] = useState("");
  const [refundMode, setRefundMode] = useState("amount");
  const [selectedItems, setSelectedItems] = useState({});
  const [actionError, setActionError] = useState("");
  const post = async (path, body) => {
    const query = new URLSearchParams({ organizationId, locationId });
    const response = await ownerFetch(`/api/owner/manage/admin/orders/${path}?${query}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, organizationId, locationId }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Action failed");
    return data;
  };
  const updateStatusImmediately = async (order, status) => {
    if (directBusyId) return;
    setDirectBusyId(String(order._id));
    setInlineError("");
    try {
      await post("update-status", { orderId: order._id, status });
      await onChanged();
    } catch (err) {
      setInlineError(`Order #${order.orderNumber || order._id}: ${err.message}`);
    } finally {
      setDirectBusyId(null);
    }
  };
  const itemRefundCents = (order) =>
    (order.items || []).reduce((sum, item, index) => {
      if (!selectedItems[index]) return sum;
      const cents =
        item.totalPriceCents != null
          ? Number(item.totalPriceCents)
          : Math.round(Number(item.totalPrice || 0) * 100);
      return sum + (Number.isFinite(cents) ? cents : 0);
    }, 0);
  const act = async () => {
    if (!dialog || busy) return;
    setBusy(true);
    setActionError("");
    try {
      const { order, action } = dialog;
      if (action === "refund" || action === "cancel") {
        const cents =
          action === "refund" && refundMode === "items"
            ? itemRefundCents(order)
            : Math.round(Number(amount) * 100);
        if (!Number.isSafeInteger(cents) || cents <= 0)
          throw new Error("Enter a valid refund amount");
        await post(action, {
          orderId: order._id,
          amountCents: cents,
          reason: reason.trim() || (action === "cancel" ? "Order cancelled" : "Admin refund"),
        });
      } else if (action === "print") {
        await post("print", { orderId: order._id });
      } else {
        await post("update-status", { orderId: order._id, status: action });
      }
      setDialog(null);
      await onChanged();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const open = (order, action) => {
    setActionError("");
    setReason("");
    setRefundMode("amount");
    setSelectedItems({});
    setAmount(
      (
        (Number(order.amountPaidCents || order.totalAmountCents || 0) -
          Number(order.refundedAmountCents || 0) -
          Number(order.onlineServiceFeeCents || 0)) /
        100
      ).toFixed(2),
    );
    setDialog({ order, action });
  };
  if (!orders.length) return <Empty>No active paid orders at this location.</Empty>;
  return (
    <div className="space-y-4">
      {inlineError && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
          {inlineError}
        </p>
      )}
      {orders.map((order) => (
        <div key={order._id} className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-lg">
                  #{order.orderNumber || String(order._id).slice(-6)}
                </strong>
                <OrderChannel channel={order.paymentChannel} />
              </div>
              <div className="text-sm text-slate-600">
                {order.customer?.name || "Guest"} · {order.customer?.email || "No email"}
              </div>
              <div className="text-xs text-slate-400">
                {new Date(order.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{usd(order.totalAmountCents)}</div>
              <span className="inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold capitalize text-orange-700">
                {order.status}
              </span>
            </div>
          </div>
          <OrderItems items={order.items} />
          {canManage && (
            <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
              {order.status === "paid" && (
                <button
                  onClick={() => updateStatusImmediately(order, "preparing")}
                  disabled={Boolean(directBusyId)}
                  className="rounded-xl bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
                >
                  <Check size={16} className="mr-1 inline" />
                  {directBusyId === String(order._id) ? "Confirming..." : "Confirm"}
                </button>
              )}
              {order.status === "preparing" && (
                <button
                  onClick={() => updateStatusImmediately(order, "ready")}
                  disabled={Boolean(directBusyId)}
                  className="rounded-xl bg-green-600 px-4 py-2 font-semibold text-white"
                >
                  {directBusyId === String(order._id) ? "Updating..." : "Mark Ready"}
                </button>
              )}
              {order.status === "ready" && (
                <button
                  onClick={() => updateStatusImmediately(order, "completed")}
                  disabled={Boolean(directBusyId)}
                  className="rounded-xl bg-green-600 px-4 py-2 font-semibold text-white"
                >
                  {directBusyId === String(order._id) ? "Updating..." : "Ready Pickup"}
                </button>
              )}
              <button
                onClick={() => open(order, "print")}
                className="rounded-xl border px-4 py-2 font-semibold text-slate-700"
              >
                <Printer size={16} className="mr-1 inline" />
                Print
              </button>
              <button
                onClick={() => open(order, "refund")}
                className="rounded-xl border px-4 py-2 font-semibold text-slate-700"
              >
                <RotateCcw size={16} className="mr-1 inline" />
                Refund
              </button>
              <button
                onClick={() => open(order, "cancel")}
                className="rounded-xl border border-red-200 px-4 py-2 font-semibold text-red-600"
              >
                <Ban size={16} className="mr-1 inline" />
                Cancel
              </button>
            </div>
          )}
        </div>
      ))}
      {dialog && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !busy) setDialog(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Order action confirmation"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-xl font-bold capitalize">
              {dialog.action === "preparing"
                ? "Confirm order"
                : dialog.action === "ready"
                  ? "Mark order ready"
                  : dialog.action === "completed"
                    ? "Complete order"
                    : `${dialog.action} order`}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Order #{dialog.order.orderNumber}. This action will update the order immediately.
            </p>
            {(dialog.action === "refund" || dialog.action === "cancel") && (
              <div className="mt-4 space-y-3">
                {dialog.action === "refund" && (
                  <div className="space-y-3">
                    <div className="flex gap-4 text-sm">
                      <label>
                        <input
                          type="radio"
                          checked={refundMode === "amount"}
                          onChange={() => setRefundMode("amount")}
                        />{" "}
                        Custom amount
                      </label>
                      <label>
                        <input
                          type="radio"
                          checked={refundMode === "items"}
                          onChange={() => setRefundMode("items")}
                        />{" "}
                        Select items
                      </label>
                    </div>
                    {refundMode === "items" && (
                      <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
                        {(dialog.order.items || []).map((item, index) => (
                          <label
                            key={index}
                            className="flex items-center justify-between gap-3 text-sm"
                          >
                            <span>
                              <input
                                type="checkbox"
                                checked={Boolean(selectedItems[index])}
                                onChange={(e) =>
                                  setSelectedItems((p) => ({ ...p, [index]: e.target.checked }))
                                }
                              />{" "}
                              {item.quantity || 1}× {item.name}
                            </span>
                            <span>
                              {usd(
                                item.totalPriceCents ??
                                  Math.round(Number(item.totalPrice || 0) * 100),
                              )}
                            </span>
                          </label>
                        ))}
                        <p className="font-semibold">
                          Selected subtotal: {usd(itemRefundCents(dialog.order))}
                        </p>
                        <p className="text-xs text-amber-700">
                          Item selection calculates a subtotal-based refund amount. Tax, tips,
                          discounts and previously refunded items are not automatically allocated;
                          review before submitting.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {(dialog.action !== "refund" || refundMode === "amount") && (
                  <label className="block text-sm font-medium">
                    Refund amount ($)
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="mt-1 w-full rounded-lg border p-3"
                    />
                  </label>
                )}
                <label className="block text-sm font-medium">
                  Reason
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for refund or cancellation"
                    className="mt-1 w-full rounded-lg border p-3"
                  />
                </label>
                <p className="text-xs text-amber-700">
                  Cancellation also requests a refund through the existing API. Review the amount
                  before proceeding.
                </p>
              </div>
            )}
            {actionError && (
              <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {actionError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                disabled={busy}
                onClick={() => setDialog(null)}
                className="rounded-xl border px-4 py-2"
              >
                Back
              </button>
              <button
                disabled={busy}
                onClick={act}
                className="rounded-xl bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const type = (o) => (o.orderType || "to_go").replace(/_/g, " ");
const historyDate = (value, options) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-US", options);
};
const historyType = (order) => {
  const value = type(order).toLowerCase();
  return value === "to go" || value === "pickup" ? "To Go" : value.replace(/\b\w/g, (c) => c.toUpperCase());
};
const HistoryPill = ({ children, tone = "green" }) => {
  const tones = {
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    teal: "border-teal-200 bg-teal-50 text-teal-700",
    green: "border-green-200 bg-green-50 text-green-700",
    red: "border-red-200 bg-red-50 text-red-700",
    gray: "border-slate-200 bg-slate-100 text-slate-600",
  };
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
};
function HistoryTable({ orders, pagination, page, setPage }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  useEffect(() => {
    if (!selectedOrder) return;
    const onKeyDown = (event) => { if (event.key === "Escape") setSelectedOrder(null); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedOrder]);
  const headers = ["Order", "Date", "Customer", "Type", "Channel", "Status", "Items", "Subtotal", "Tax", "Tip", "Order Service Fee", "Gross Sales", "Rewards Redeemed", "Promotion", "Refunded", "Transaction Fee", "Net"];
  return (
    <>
      {!orders.length ? <Empty>No orders found.</Empty> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full min-w-[1700px] text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>{headers.map((h) => <th key={h} className="px-4 py-5 text-sm font-bold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {orders.map((o, index) => {
                const promo = Number(o.promoDiscountCents || 0) / 100;
                const status = String(o.status || "pending").toLowerCase();
                return (
                  <tr key={o._id || index} className={`border-t border-slate-100 transition hover:bg-orange-50/40 ${index % 2 === 0 ? "bg-slate-50/40" : "bg-white"}`}>
                    <td className="px-4 py-5"><button type="button" onClick={() => setSelectedOrder(o)} className="whitespace-nowrap font-bold text-orange-600 hover:text-orange-700 hover:underline focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500" aria-label={`View details for order ${o.orderNumber}`}>#{o.orderNumber || String(o._id || "").slice(-8)}</button></td>
                    <td className="px-4 py-5 text-slate-500"><span className="block whitespace-nowrap">{historyDate(o.createdAt, {year:"numeric",month:"numeric",day:"numeric"})}</span><span className="block whitespace-nowrap">{historyDate(o.createdAt, {hour:"numeric",minute:"2-digit",second:"2-digit"})}</span></td>
                    <td className="max-w-[180px] px-4 py-5 font-medium text-slate-900">{o.customer?.name || "Guest"}</td>
                    <td className="px-4 py-5"><HistoryPill tone="orange">{historyType(o)}</HistoryPill></td>
                    <td className="px-4 py-5"><HistoryPill tone="teal">{String(o.paymentChannel || "online").replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</HistoryPill></td>
                    <td className="px-4 py-5"><HistoryPill tone={status === "cancelled" || status === "deleted" ? "red" : status === "completed" || status === "ready" ? "green" : "gray"}>{status}</HistoryPill></td>
                    <td className="px-4 py-5 font-semibold">{(o.items || []).reduce((sum,item)=>sum+Number(item.quantity || 1),0)}</td>
                    <td className="px-4 py-5 font-medium">{usd(o.subtotalCents)}</td>
                    <td className="px-4 py-5 font-medium text-blue-600">{usd(o.taxCents)}</td>
                    <td className="px-4 py-5 font-medium text-blue-600">{usd(o.tipCents)}</td>
                    <td className="px-4 py-5 font-medium text-blue-600">{usd(o.onlineServiceFeeCents)}</td>
                    <td className="px-4 py-5 font-bold">{usd(o.totalAmountCents)}</td>
                    <td className="px-4 py-5 text-red-600">-{usdD(o.rewardsRedeemed)}</td>
                    <td className="px-4 py-5">{o.promoCode && promo > 0 ? <><span className="font-semibold text-green-700">{o.promoCode}</span><div className="text-red-600">-{usdD(promo)}</div></> : <span className="text-slate-400">—</span>}</td>
                    <td className="px-4 py-5 text-red-600">-{usdD(o.refunded)}</td>
                    <td className="px-4 py-5 text-red-600">-{usdD(o.stripeFee)}</td>
                    <td className="px-4 py-5 font-bold text-green-600">{usdD(o.net)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {selectedOrder && <OrderHistoryDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
      {pagination?.totalPages > 1 && <div className="mt-4 flex items-center justify-end gap-3"><button className="rounded-lg border bg-white px-4 py-2 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(p=>p-1)}>Previous</button><span className="text-sm text-slate-500">Page {page} of {pagination.totalPages}</span><button className="rounded-lg border bg-white px-4 py-2 disabled:opacity-40" disabled={page >= pagination.totalPages} onClick={() => setPage(p=>p+1)}>Next</button></div>}
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

function OrderHistoryDetails({ order, onClose }) {
  const count = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  const status = String(order.status || "pending").toLowerCase();
  const timeline = [
    ["🧾", "Ordered", order.createdAt],
    ["👍", "Confirmed", order.confirmedAt || order.preparedAt],
    ["✅", "Ready for Pickup", order.readyAt],
    ["🥡", "Picked up", order.pickedAt || order.completedAt],
    ["✖", "Cancelled", order.cancelledAt],
  ].filter(([, , value]) => Boolean(value));
  const cents = (value) => Number(value || 0);
  const line = (label, value, style = "") => (
    <div className={`flex items-center justify-between gap-4 border-b border-slate-200 py-3 text-sm sm:text-base ${style}`}>
      <span>{label}</span><span className="whitespace-nowrap font-medium">{usd(value)}</span>
    </div>
  );
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-2 sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="history-order-title" className="flex max-h-[96dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 justify-end border-b border-slate-200 px-4 py-3"><button type="button" onClick={onClose} aria-label="Close order details" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={26}/></button></div>
        <div className="overflow-y-auto px-5 py-6 sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3"><h2 id="history-order-title" className="text-2xl font-extrabold text-slate-950 sm:text-3xl">Order #{order.orderNumber || String(order._id || "").slice(-8)}</h2><HistoryPill tone="orange">{historyType(order)}</HistoryPill><HistoryPill tone="teal">{String(order.paymentChannel || "online").replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</HistoryPill></div>
              <p className="mt-1 text-sm text-slate-500 sm:text-base">{historyDate(order.createdAt, {year:"numeric",month:"numeric",day:"numeric"})} · {order.pickupTime || "ASAP"}</p>
            </div>
            <span className={`rounded-full px-4 py-1 text-sm font-extrabold uppercase ${status === "cancelled" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{status}</span>
          </div>
          <div className="mt-7 flex items-center justify-between text-lg font-semibold text-blue-600"><span>Total Items</span><span className="rounded-full bg-blue-600 px-3 py-1 text-sm text-white">{count}</span></div>
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm sm:text-base">
            <h3 className="mb-3 font-bold text-blue-700">👤 Customer</h3>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-blue-700"><span>Name</span><span className="min-w-0 text-right font-semibold text-blue-900">{order.customer?.name || "Guest"}</span><span>Email</span><span className="min-w-0 break-all text-right font-semibold text-blue-900">{order.customer?.email ? <a className="underline" href={`mailto:${order.customer.email}`}>{order.customer.email}</a> : "—"}</span><span>Phone</span><span className="text-right font-semibold text-blue-900">{order.customer?.phone ? <a className="underline" href={`tel:${order.customer.phone}`}>{order.customer.phone}</a> : "—"}</span></div>
          </div>
          <div className="mt-6 rounded-2xl bg-slate-50 p-5"><h3 className="mb-2 font-bold text-slate-700">Order Timeline</h3>{timeline.length ? timeline.map(([emoji,label,value]) => <div key={label} className="flex items-center justify-between gap-4 border-t border-slate-200 py-3 text-sm sm:text-base"><span className="text-slate-500">{emoji} {label}</span><span className="font-medium text-slate-900">{historyDate(value,{hour:"numeric",minute:"2-digit"})}</span></div>) : <p className="text-slate-500">No timeline available.</p>}</div>
          <div className="mt-7 divide-y divide-slate-200">
            {(order.items || []).map((item,index) => (
              <div key={index} className="flex items-start gap-4 py-5">
                {item.image ? <img src={item.image} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover sm:h-20 sm:w-20"/> : <div className="h-16 w-16 shrink-0 rounded-lg bg-slate-100 sm:h-20 sm:w-20"/>}
                <div className="min-w-0 flex-1"><p className="font-bold text-slate-900">{item.quantity || 1}× {item.name || `Item ${index+1}`}</p><ModifierSelections item={item}/></div>
                <span className="shrink-0 font-bold text-orange-600">{usd(item.totalPriceCents ?? Math.round(Number(item.totalPrice || 0)*100))}</span>
              </div>
            ))}
          </div>
          {order.specialInstructions && <div className="mt-5 rounded-xl bg-amber-50 p-4"><h3 className="font-bold">Special instructions</h3><p>{order.specialInstructions}</p></div>}
          <div className="mt-7">
            {line("Subtotal", order.subtotalCents)}
            {cents(order.promoDiscountCents)>0 && line("Promotion Discount", -cents(order.promoDiscountCents), "text-red-600")}
            {line("Tax", order.taxCents)}
            {line("Order Service Fee", order.onlineServiceFeeCents)}
            {line("Tip", order.tipCents)}
            {line("Total", order.totalAmountCents, "font-bold text-orange-600")}
            <div className="flex items-center justify-between border-b border-slate-200 py-3 text-sm sm:text-base"><span>Payment Method</span><span className="font-semibold capitalize">{order.paymentMethod || "Card"}</span></div>
            {line("Amount Charged", order.amountChargedCents ?? order.totalAmountCents, "text-orange-600")}
            {(cents(order.refundedAmountCents)>0 || Number(order.refunded || 0)>0) && line("Refunded", cents(order.refundedAmountCents) ? -cents(order.refundedAmountCents) : -Math.round(Number(order.refunded)*100), "text-red-600")}
            {Number(order.pointsEarned || order.loyaltyPointsEarned || 0)>0 && <div className="flex justify-between py-3 text-sm sm:text-base"><span className="text-slate-500">Loyalty Points Earned</span><span className="font-bold text-green-700">+{order.pointsEarned || order.loyaltyPointsEarned} pts</span></div>}
          </div>
        </div>
      </section>
    </div>
  );
}
