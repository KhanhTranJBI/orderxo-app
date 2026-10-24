"use client";
import { ownerFetch } from "../../lib/ownerFetch";

import Link from "next/link";
import { toast } from "react-toastify";
import { OrderHistoryDetails } from "./OrdersManager";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Search, X } from "lucide-react";

async function jsonFetch(url) {
  const res = await ownerFetch(url, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to load users");
  return data;
}

export default function ManageUsersManager({ organizationId }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setErrorState] = useState("");
  const setError = (value) => {
    setErrorState(value);
    if (typeof value === "string" && value.trim()) toast.error(value);
  };
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [optInFilter, setOptInFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const params = new URLSearchParams({
          organizationId,
          page: String(page),
          search: debouncedSearch,
          sortBy,
          sortOrder,
        });
        if (optInFilter !== "all") params.set("optIn", optInFilter);
        const data = await jsonFetch(`/api/owner/manage/admin/users?${params.toString()}`);
        if (cancelled) return;
        setUsers(Array.isArray(data.users) ? data.users : []);
        setPagination(data.pagination || null);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organizationId, page, debouncedSearch, optInFilter, sortBy, sortOrder]);

  function handleSort(field) {
    if (sortBy === field) setSortOrder((v) => (v === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  }

  function SortIcon({ field }) {
    if (sortBy !== field) return <ArrowUpDown size={14} className="text-slate-300" />;
    return sortOrder === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  }

  const formatDateTime = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" });
  };

  const formatBirthday = (value) => {
    if (!value) return "—";
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
    if (!match) return "—";
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return "—";
    return `${match[2]}/${match[3]}`;
  };

  const columns = [
    ["Name", "name"],
    ["Email", "email"],
    ["Phone", "phone"],
    ["Birthday", "birthday"],
    ["Role", "role"],
    ["Loyalty Points", "loyaltyPoints"],
    ["Reserved", "reservedPoints"],
    ["Available", "availablePoints"],
    ["Email Opt-In", null],
    ["Opt-In Source", null],
    ["Opt-In Date", null],
    ["Opt-Out Date", null],
    ["Created At", "createdAt"],
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-8xl">
        <div className="mt-5">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
            OrderXO Manager
          </p>
          <h1 className="mt-1 text-3xl font-bold">Manage Users</h1>
          <p className="mt-2 text-slate-600">
            Search customers, review loyalty balances and email marketing status.
          </p>
        </div>

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative max-w-xl flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-10 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <select
              value={optInFilter}
              onChange={(e) => {
                setOptInFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="all">All users</option>
              <option value="true">Email opt-in only</option>
              <option value="false">Not opted in</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-orange-600" size={30} />
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {columns.map(([label, field]) => (
                      <th
                        key={label}
                        onClick={() => field && handleSort(field)}
                        className={`whitespace-nowrap border-b px-3 py-3 text-left font-semibold text-slate-700 ${field ? "cursor-pointer hover:bg-slate-100" : ""}`}
                      >
                        <span className="flex items-center gap-1.5">
                          {label}
                          {field && <SortIcon field={field} />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr
                      key={String(user._id || user.id || user.email)}
                      className="hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-3 py-3 font-medium">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          className="font-semibold text-orange-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500"
                          aria-label={`View orders for ${user.name || user.email}`}
                        >
                          {user.name || user.email || "-"}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">{user.email || "-"}</td>
                      <td className="whitespace-nowrap px-3 py-3">{user.phone || "-"}</td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {formatBirthday(user.birthday)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 capitalize">
                        {user.role || "customer"}
                      </td>
                      <td className="px-3 py-3">{user.loyaltyPoints || 0}</td>
                      <td className="px-3 py-3 text-slate-600">{user.reservedPoints ?? 0}</td>
                      <td className="px-3 py-3 font-medium">
                        {user.availablePoints ??
                          Math.max(0, (user.loyaltyPoints || 0) - (user.reservedPoints || 0))}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(user.emailMarketingOptIn)}
                          readOnly
                          aria-label={user.emailMarketingOptIn ? "Opted in" : "Not opted in"}
                          className="pointer-events-none accent-orange-600"
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 capitalize">
                        {user.emailSubscriberSource || "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-500">
                        {formatDateTime(user.emailSubscriberSubscribedAt)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-500">
                        {formatDateTime(user.emailSubscriberUnsubscribedAt)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-500">
                        {formatDateTime(user.createdAt)}
                      </td>
                    </tr>
                  ))}
                  {!users.length && (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-4 py-12 text-center text-slate-500"
                      >
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-500">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} users
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border px-3 py-2 font-semibold disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border px-3 py-2 font-semibold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
      {selectedUser && (
        <CustomerOrdersModal
          key={String(selectedUser._id)}
          user={selectedUser}
          organizationId={organizationId}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </main>
  );
}

function CustomerOrdersModal({ user, organizationId, onClose }) {
  const [orders, setOrders] = useState([]);
  const [locations, setLocations] = useState([]);
  const [locationId, setLocationId] = useState("");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") {
        if (selectedOrder) setSelectedOrder(null);
        else onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedOrder, onClose]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          organizationId,
          userId: String(user._id),
          page: String(page),
          status,
          search,
        });
        if (locationId) params.set("locationId", locationId);
        const data = await jsonFetch(`/api/owner/manage/admin/users/orders?${params}`);
        if (!cancelled) {
          setOrders(data.orders || []);
          setLocations(data.locations || []);
          setPagination(data.pagination || null);
        }
      } catch (error) {
        if (!cancelled) toast.error(error.message || "Could not load customer orders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organizationId, user._id, page, status, search, locationId]);
  const usd = (value) => `$${(Number(value || 0) / 100).toFixed(2)}`;
  const locationName = (id) =>
    locations.find((l) => String(l._id) === String(id))?.name || "Location";
  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="customer-orders-title"
          className="flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b p-5 sm:p-6">
            <div>
              <h2 id="customer-orders-title" className="text-xl font-bold sm:text-2xl">
                Customer Order History
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {user.name || "Customer"} · {user.email}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close customer order history"
              className="rounded-lg p-2 hover:bg-slate-100"
            >
              <X size={24} />
            </button>
          </div>
          <div className="min-h-0 overflow-y-auto p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap gap-3">
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search order number"
                className="min-w-[180px] flex-1 rounded-xl border px-3 py-2"
              />
              <select
                aria-label="Filter location"
                value={locationId}
                onChange={(e) => {
                  setLocationId(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border px-3 py-2"
              >
                <option value="">All locations</option>
                {locations.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Filter order status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border px-3 py-2"
              >
                <option value="all">All statuses</option>
                {["completed", "cancelled", "paid", "preparing", "ready", "pending", "deleted"].map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ),
                )}
              </select>
            </div>
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin text-orange-600" size={32} />
              </div>
            ) : orders.length ? (
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {["Order", "Date", "Location", "Status", "Items", "Total"].map((h) => (
                        <th key={h} className="px-4 py-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {orders.map((o) => (
                      <tr key={o._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className="font-semibold text-orange-600 hover:underline"
                            onClick={() => setSelectedOrder(o)}
                          >
                            #{o.orderNumber || String(o._id).slice(-8)}
                          </button>
                        </td>
                        <td className="px-4 py-3">{new Date(o.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-3">{locationName(o.locationId)}</td>
                        <td className="px-4 py-3 capitalize">{o.status}</td>
                        <td className="px-4 py-3">
                          {(o.items || []).reduce((sum, i) => sum + Number(i.quantity || 1), 0)}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {usd(o.totalCents ?? o.amountPaidCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-12 text-center text-slate-500">No orders found for this customer.</p>
            )}
            {pagination?.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Page {page} of {pagination.totalPages} · {pagination.total} orders
                </span>
                <div className="flex gap-2">
                  <button
                    className="rounded-lg border px-3 py-2 disabled:opacity-40"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="rounded-lg border px-3 py-2 disabled:opacity-40"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
      {selectedOrder && (
        <OrderHistoryDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </>
  );
}
