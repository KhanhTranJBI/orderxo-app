"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api";
import { toast } from "react-toastify";
import { Loader2, Search, X, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

export default function ManageUsersTemplate() {
  const { data: session } = useSession();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [optInFilter, setOptInFilter] = useState("all"); // "all" | "true" | "false"

  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc"); // "asc" | "desc"

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  /* -------------------- Debounce Search -------------------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset page when searching
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  /* -------------------- Fetch Users -------------------- */
  const jwt = session?.jwt;
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!jwt) return;

    fetchUsers();
    hasFetchedRef.current = true;
  }, [jwt, page, debouncedSearch, optInFilter, sortBy, sortOrder]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        search: debouncedSearch,
        sortBy,
        sortOrder,
      });

      if (optInFilter !== "all") {
        params.set("optIn", optInFilter);
      }

      const res = await apiFetch(
        `/api/admin/users?${params.toString()}`,
        { method: "GET" },
        session.jwt,
      );

      setUsers(res.users || []);
      setPagination(res.pagination || null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  function onPageChange(newPage) {
    if (!pagination) return;
    if (newPage < 1 || newPage > pagination.totalPages) return;

    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSort(field) {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  }

  function SortIcon({ field }) {
    if (sortBy !== field) {
      return <ArrowUpDown size={14} className="text-gray-300" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp size={14} className="text-primary" />
    ) : (
      <ArrowDown size={14} className="text-primary" />
    );
  }

  return (
    <div className="py-4 md:py-6 px-2 xl:px-16">
      <h1 className="text-2xl font-bold mb-4">Manage Users</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9 py-2 w-full border rounded-lg"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="
        absolute right-2 top-1/2 -translate-y-1/2
        p-1 rounded-full
        text-gray-400 hover:text-gray-600 hover:bg-gray-100
      "
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Opt-In Filter */}
        <select
          value={optInFilter}
          onChange={(e) => {
            setOptInFilter(e.target.value);
            setPage(1);
          }}
          className="border rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="all">All Users</option>
          <option value="true">Email Opt-In Only</option>
          <option value="false">Not Opted In</option>
        </select>
      </div>

      {loading ? (
        <div className="bg-white flex items-center justify-center py-10">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th
                  className="p-2 border cursor-pointer select-none hover:bg-gray-200"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Name <SortIcon field="name" />
                  </div>
                </th>
                <th
                  className="p-2 border cursor-pointer select-none hover:bg-gray-200"
                  onClick={() => handleSort("email")}
                >
                  <div className="flex items-center gap-1">
                    Email <SortIcon field="email" />
                  </div>
                </th>
                <th className="p-2 border">Phone</th>
                <th className="p-2 border">Role</th>
                <th
                  className="p-2 border cursor-pointer select-none hover:bg-gray-200"
                  onClick={() => handleSort("loyaltyPoints")}
                >
                  <div className="flex items-center gap-1">
                    Loyalty Points <SortIcon field="loyaltyPoints" />
                  </div>
                </th>
                <th className="p-2 border">Reserved</th>
                <th className="p-2 border">Available</th>
                <th className="p-2 border">Email Opt-In</th>
                <th className="p-2 border">Opt-In Source</th>
                <th className="p-2 border">Opt-In Date</th>
                <th className="p-2 border">Opt-Out Date</th>
                <th
                  className="p-2 border cursor-pointer select-none hover:bg-gray-200"
                  onClick={() => handleSort("createdAt")}
                >
                  <div className="flex items-center gap-1">
                    Created At <SortIcon field="createdAt" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="p-2 border">{user.name || "-"}</td>
                  <td className="p-2 border">{user.email}</td>
                  <td className="p-2 border">{user.phone || "-"}</td>
                  <td className="p-2 border">{user.role || "-"}</td>
                  <td className="p-2 border font-medium">{user.loyaltyPoints || 0}</td>
                  <td className="p-2 border text-gray-500">{user.reservedPoints || 0}</td>
                  <td className="p-2 border font-medium text-green-700">
                    {user.availablePoints ?? 0}
                  </td>
                  <td className="p-2 border text-center">
                    <input
                      type="checkbox"
                      checked={!!user.emailMarketingOptIn}
                      readOnly
                      className="accent-primary"
                    />
                  </td>
                  <td className="p-2 border capitalize">{user.emailSubscriberSource || "-"}</td>
                  <td className="p-2 border">
                    {user.emailSubscriberSubscribedAt
                      ? new Date(user.emailSubscriberSubscribedAt).toLocaleString()
                      : "-"}
                  </td>
                  <td className="p-2 border">
                    {user.emailSubscriberUnsubscribedAt
                      ? new Date(user.emailSubscriberUnsubscribedAt).toLocaleString()
                      : "-"}
                  </td>
                  <td className="p-2 border">
                    {user.createdAt ? new Date(user.createdAt).toLocaleString() : "-"}
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-6 text-center text-gray-400 italic">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {pagination && (
            <div className="flex items-center justify-between text-sm mt-4">
              <div className="text-gray-500">
                Page <span className="font-medium">{pagination.page}</span> of{" "}
                <span className="font-medium">{pagination.totalPages}</span> • {pagination.total}{" "}
                users
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className={`px-3 py-1 rounded border ${
                    pagination.hasPrev ? "hover:bg-gray-100" : "opacity-40 cursor-not-allowed"
                  }`}
                >
                  ← Previous
                </button>

                <button
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className={`px-3 py-1 rounded border ${
                    pagination.hasNext ? "hover:bg-gray-100" : "opacity-40 cursor-not-allowed"
                  }`}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
