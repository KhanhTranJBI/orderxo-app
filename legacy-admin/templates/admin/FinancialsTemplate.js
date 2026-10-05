"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { DollarSign, FileText, Loader2, Search, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useSession } from "next-auth/react";
import TransactionsTable from "@/components/admin/TransactionsTable";
import StatementsTable from "../../components/admin/StatementsTable";
import OrderDetailsModal from "@/components/admin/OrderDetailsModal";
import { formatTime, statusColors } from "@/lib/utils";

const VALID_TABS = ["statements", "transactions"];

export default function AdminFinancialsTemplate() {
  const { data: session, status } = useSession();

  const getTabFromHash = () => {
    if (typeof window === "undefined") return "statements";

    const params = new URLSearchParams(window.location.hash.replace("#", ""));

    const tab = params.get("tab");

    return VALID_TABS.includes(tab) ? tab : "statements";
  };

  const [activeTab, setActiveTab] = useState(getTabFromHash);

  const [transactions, setTransactions] = useState([]);

  const [statements, setStatements] = useState([]);

  const [transactionsPagination, setTransactionsPagination] = useState(null);

  const [statementsPagination, setStatementsPagination] = useState(null);

  const [summary, setSummary] = useState(null);

  const [annualStatements, setAnnualStatements] = useState([]);

  const [year, setYear] = useState(String(new Date().getFullYear()));

  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [orderLoading, setOrderLoading] = useState(false);

  const [search, setSearch] = useState("");

  const tabs = [
    {
      id: "statements",
      label: "Statements",
      icon: FileText,
    },
    {
      id: "transactions",
      label: "Transactions",
      icon: DollarSign,
    },
  ];

  const currentData = activeTab === "transactions" ? transactions : statements;

  const openOrderModal = async (orderId) => {
    if (!session?.jwt) return;

    try {
      setOrderLoading(true);

      const res = await apiFetch(
        `/api/admin/orders/${orderId}`,
        { method: "GET" },
        session.jwt,
      );

      setSelectedOrder(res.order);
    } catch (err) {
      console.error("Failed to load order", err);
    } finally {
      setOrderLoading(false);
    }
  };

  const fetchData = async (tab, pageNumber = 1, selectedYear = year) => {
    if (status !== "authenticated") return;

    setLoading(true);

    const endpointMap = {
      transactions: "/api/admin/financials/transactions",
      statements: "/api/admin/financials/statements",
    };

    try {
      const params = new URLSearchParams({
        page: pageNumber,
        limit: 20,
      });

      if (tab === "statements") {
        params.append("year", selectedYear);
      }

      if (search && tab === "transactions") {
        params.append("search", search);
      }

      const res = await apiFetch(
        `${endpointMap[tab]}?${params.toString()}`,
        { method: "GET" },
        session.jwt,
      );

      if (tab === "transactions") {
        setTransactions(res?.transactions || []);

        setTransactionsPagination(res?.pagination || null);
      } else {
        setStatements(res?.statements || []);

        setStatementsPagination(res?.pagination || null);

        setSummary(res?.summary || null);

        setAnnualStatements(res?.annualStatements || []);
      }
    } catch (err) {
      console.error("Failed to fetch financial data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== "authenticated") return;

    fetchData(activeTab, page, year);
  }, [activeTab, page, year, status]);

  const handleTabClick = (id) => {
    setActiveTab(id);
    setPage(1);

    window.location.hash = `tab=${id}`;
  };

  const handleYearChange = (value) => {
    setYear(value);
    setPage(1);
  };

  useEffect(() => {
    if (activeTab !== "transactions") {
      return;
    }

    const delay = setTimeout(() => {
      fetchData("transactions", 1, year);
    }, 400);

    return () => clearTimeout(delay);
  }, [search]);

  return (
    <div className="px-4 py-6 xl:px-16">
      <div>
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow mb-6">
          <nav className="flex overflow-x-auto no-scrollbar px-4 gap-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={clsx(
                    "flex items-center gap-2 py-4 font-semibold relative",
                    isActive
                      ? "text-primary after:scale-x-100"
                      : "text-gray-500 hover:text-gray-700",
                    "after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-full after:bg-primary after:origin-left after:scale-x-0 after:transition-transform",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Year selector */}
        {activeTab === "statements" && (
          <div className="mb-6 flex items-center gap-3">
            <label className="font-semibold text-gray-700">Year</label>

            <select
              value={year}
              onChange={(e) => handleYearChange(e.target.value)}
              className="border rounded-lg px-3 py-2 bg-white shadow-sm"
            >
              <option value="all">All Years</option>

              {Array.from(
                {
                  length: new Date().getFullYear() - 2024 + 1,
                },
                (_, index) => new Date().getFullYear() - index,
              ).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Transaction Search */}
        {activeTab === "transactions" && (
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order #, customer name or email"
              className="pl-9 pr-9 py-2 w-full border rounded-lg"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-xl shadow p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : currentData.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No records found</p>
          ) : (
            <>
              {activeTab === "transactions" && (
                <TransactionsTable
                  data={transactions}
                  pagination={transactionsPagination}
                  onPageChange={(newPage) => setPage(newPage)}
                  onRowClick={(orderId) => openOrderModal(orderId)}
                />
              )}

              {activeTab === "statements" && (
                <StatementsTable
                  data={statements}
                  pagination={statementsPagination}
                  onPageChange={(newPage) => setPage(newPage)}
                  token={session.jwt}
                  summary={summary}
                  annualStatements={annualStatements}
                  year={year}
                />
              )}
            </>
          )}
        </div>
      </div>

      {orderLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Loader2 className="animate-spin text-white" size={40} />
        </div>
      )}

      {selectedOrder && (
        <OrderDetailsModal
          selectedOrder={selectedOrder}
          setSelectedOrder={setSelectedOrder}
          statusColors={statusColors}
          formatTime={formatTime}
        />
      )}
    </div>
  );
}
