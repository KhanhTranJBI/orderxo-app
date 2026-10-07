"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Search, X } from "lucide-react";

async function jsonFetch(url) {
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to load users");
  return data;
}

export default function ManageUsersManager({ organizationId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  const columns = [
    ["Name", "name"],
    ["Email", "email"],
    ["Phone", "phone"],
    ["Role", "role"],
    ["Loyalty", "loyaltyPoints"],
    ["Available", "availablePoints"],
    ["Email opt-in", null],
    ["Source", "emailSubscriberSource"],
    ["Joined", "createdAt"],
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href={`/dashboard/restaurants/${organizationId}`}
          className="text-sm font-semibold text-orange-600 hover:text-orange-700"
        >
          ← Restaurant workspace
        </Link>
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

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
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
                        {user.name || "-"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">{user.email || "-"}</td>
                      <td className="whitespace-nowrap px-3 py-3">{user.phone || "-"}</td>
                      <td className="whitespace-nowrap px-3 py-3 capitalize">
                        {user.role || "customer"}
                      </td>
                      <td className="px-3 py-3">{user.loyaltyPoints || 0}</td>
                      <td className="px-3 py-3 font-medium">
                        {user.availablePoints ??
                          Math.max(0, (user.loyaltyPoints || 0) - (user.reservedPoints || 0))}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {user.emailMarketingOptIn ? "✓" : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 capitalize">
                        {user.emailSubscriberSource || "-"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                      </td>
                    </tr>
                  ))}
                  {!users.length && (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
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
    </main>
  );
}
