"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { apiFetch } from "@/lib/api";
import { useSession } from "next-auth/react";
import { Gift, History, Loader2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

const statusColorMap = {
  active: "text-green-600",
  redeemed: "text-red-600",
  expired: "text-gray-500",
  suspended: "text-yellow-600",
};

export default function AdminGiftCardsDashboardTemplate() {
  const { data: session, status } = useSession();
  const dispatch = useDispatch();

  const getTabFromHash = () => {
    if (typeof window === "undefined") return "active-orders";

    const params = new URLSearchParams(window.location.hash.replace("#", ""));

    const tab = params.get("tab");

    if (["active-gift-cards", "gift-cards-history"].includes(tab)) {
      return tab;
    }

    return "active-gift-cards";
  };

  const [activeTab, setActiveTab] = useState(getTabFromHash); // active | history
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const [giftCards, setGiftCards] = useState([]);
  const [giftCardCheckLoading, setGiftCardCheckLoading] = useState(false);

  const [isSearching, setIsSearching] = useState(false);

  const tabs = [
    { id: "active-gift-cards", label: "Active Gift Cards", icon: Gift },
    {
      id: "gift-cards-history",
      label: "Gift Cards History",
      icon: History,
    },
  ];

  const handleTabClick = (id) => {
    if (id === activeTab) return;

    setActiveTab(id);

    window.location.hash = `tab=${id}`;
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.location.hash = `tab=${activeTab}`;
  }, [activeTab]);

  useEffect(() => {
    const onHashChange = () => {
      setActiveTab(getTabFromHash());
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  /* ---------------------------------- */
  /* 🔁 EFFECT */
  /* ---------------------------------- */
  const jwt = session?.jwt;

  useEffect(() => {
    if (status !== "authenticated" || !jwt) return;

    if (activeTab === "active-gift-cards") {
      fetchGiftCards(page);
    } else {
      fetchGiftCardHistory(page);
    }
  }, [activeTab, page, jwt]);

  const fetchGiftCards = async (pageNum = 1) => {
    try {
      setLoading(true);

      const res = await apiFetch(
        `/api/admin/gift-cards?page=${pageNum}&limit=12`,
        { method: "GET" },
        session.jwt,
      );

      setGiftCards(res?.giftCards || []);
      setPagination(res?.pagination || null);
    } finally {
      setLoading(false);
    }
  };

  const fetchGiftCardHistory = async (pageNum = 1) => {
    try {
      setLoading(true);

      const res = await apiFetch(
        `/api/admin/gift-cards/history?page=${pageNum}&limit=12`,
        { method: "GET" },
        session.jwt,
      );

      setGiftCards(res?.giftCards || []);
      setPagination(res?.pagination || null);
    } finally {
      setLoading(false);
    }
  };

  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const checkGiftCard = async () => {
    if (!code.trim()) return;

    setGiftCardCheckLoading(true);
    setError("");
    setIsSearching(true);

    try {
      const res = await apiFetch(
        `/api/admin/gift-cards/check?code=${code.trim().toUpperCase()}`,
        { method: "GET" },
        session.jwt,
      );

      if (res?.giftCard) {
        setGiftCards([res.giftCard]); // ✅ Show inside normal table
        setPagination(null); // hide pagination while searching
      } else {
        setGiftCards([]);
        setError("Gift card not found");
      }
    } catch (err) {
      setError("Gift card not found");
      setGiftCards([]);
    } finally {
      setGiftCardCheckLoading(false);
    }
  };

  const clearSearch = async () => {
    setCode("");
    setError("");
    setIsSearching(false);

    if (activeTab === "active-gift-cards") {
      fetchGiftCards(1); // reload full list
    } else {
      fetchGiftCardHistory(1);
    }
  };

  const [newBalance, setNewBalance] = useState(0);
  const [updating, setUpdating] = useState(false);

  async function updateBalance(id) {
    try {
      setUpdating(true);

      const res = await apiFetch(
        "/api/admin/gift-cards/update-balance",
        {
          method: "PUT",
          body: JSON.stringify({
            giftCardId: id,
            balance: Number(newBalance),
          }),
        },
        session.jwt,
      );
      setNewBalance(res.balance);

      toast.success("Balance updated");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const onPageChange = (newPage) => {
    setPage(newPage);

    if (activeTab === "active-gift-cards") {
      fetchGiftCards(newPage);
    } else {
      fetchGiftCardHistory(newPage);
    }
  };

  /* ---------------------------------- */
  /* 🧾 UI */
  /* ---------------------------------- */
  return (
    <div className="py-4 md:py-6 px-2 xl:px-16">
      <div className="max-w-8xl mx-auto scroll-mt-16">
        {/* Tabs */}
        <div className="sticky top-16 z-20 bg-white rounded-xl shadow-md mb-6 overflow-hidden">
          <nav className="flex overflow-x-auto no-scrollbar space-x-6 px-4 bg-white">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={clsx(
                    `
                  relative flex items-center gap-2 whitespace-nowrap py-4 font-medium flex-shrink-0
                  text-gray-500 hover:text-gray-700 transition-colors
                  after:absolute after:left-0 after:bottom-0 after:h-[3px] after:w-full
                  after:bg-primary after:origin-left after:scale-x-0
                  after:transition-transform after:duration-300
                  hover:after:scale-x-100
                  `,
                    isActive && "text-primary after:scale-x-100",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>
                    {tab.label}{" "}
                    {!loading && tab.id === activeTab
                      ? `(${pagination ? pagination.total : 0})`
                      : null}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <main className="mx-auto">
          {(activeTab === "active-gift-cards" || activeTab === "gift-cards-history") && (
            <>
              <div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-6 space-y-4">
                <h2 className="text-lg font-bold text-primary ">🎟️ Gift Card Lookup</h2>

                <p className="text-sm text-gray-500">
                  Enter the gift card code <b>after</b>{" "}
                  <span className="font-mono font-bold">
                    {process.env.NEXT_PUBLIC_GIFT_CARD_PREFIX}
                  </span>
                </p>

                <div className="flex flex-col md:flex-row gap-2 items-stretch">
                  <div className="relative w-full">
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      className="border w-full rounded-lg px-4 py-2 flex-1 font-mono tracking-wider"
                      disabled={loading}
                    />

                    {code && (
                      <button onClick={clearSearch} className="absolute right-2 top-0 p-2">
                        ✕
                      </button>
                    )}
                  </div>

                  <button
                    onClick={checkGiftCard}
                    disabled={loading || !code}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50"
                  >
                    Check
                  </button>
                </div>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                {giftCardCheckLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin text-primary" size={32} />
                  </div>
                ) : null}
              </div>
              <div className="mx-auto py-6 space-y-4">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-primary" size={32} />
                  </div>
                ) : giftCards.length === 0 ? (
                  <p className="text-center text-gray-500 py-10">No gift cards found</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {giftCards.map((gc) => (
                      <div
                        key={gc.id}
                        className="border rounded-2xl p-2 md:p-6 bg-white shadow-sm space-y-4"
                      >
                        {/* STATUS */}
                        <div className="flex justify-between">
                          <span>Status</span>
                          <span
                            className={`font-bold capitalize ${
                              statusColorMap[gc.status] || "text-gray-600"
                            }`}
                          >
                            {gc.status}
                          </span>
                        </div>

                        {/* BALANCE */}
                        <div className="flex justify-between items-center">
                          <span>Balance</span>

                          {isSearching ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={newBalance}
                                onChange={(e) => setNewBalance(e.target.value)}
                                className="w-24 border rounded px-2 py-1 text-right"
                              />
                              <button
                                onClick={() => updateBalance(gc.id)}
                                disabled={updating}
                                className="px-3 py-1 rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                              >
                                Update
                              </button>
                            </div>
                          ) : (
                            <span className="font-bold text-green-600">
                              ${gc.balance.toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* ORIGINAL AMOUNT */}
                        <div className="flex justify-between">
                          <span>Original Amount</span>
                          <span>${gc.amount.toFixed(2)}</span>
                        </div>

                        {/* CREATED */}
                        <div className="flex justify-between">
                          <span>Created</span>
                          <span>{new Date(gc.createdAt).toLocaleString()}</span>
                        </div>

                        {/* UPDATED */}
                        <div className="flex justify-between">
                          <span>Last Updated</span>
                          <span>{new Date(gc.updatedAt).toLocaleString()}</span>
                        </div>

                        {/* REDEEMED */}
                        {gc.redeemedAt && (
                          <div className="flex justify-between text-red-600">
                            <span>Redeemed</span>
                            <span>{new Date(gc.redeemedAt).toLocaleString()}</span>
                          </div>
                        )}

                        <hr className="my-2" />

                        {/* BUYER */}
                        <div>
                          <p className="font-semibold text-gray-700">Buyer</p>
                          <p className="text-gray-600">
                            {gc.buyerName} · {gc.buyerEmail}
                          </p>
                        </div>

                        {/* RECIPIENT */}
                        <div>
                          <p className="font-semibold text-gray-700">Recipient</p>
                          <p className="text-gray-600">
                            {gc.recipientName} · {gc.recipientEmail}
                          </p>
                        </div>

                        {/* MESSAGE */}
                        {gc.message && (
                          <div className="bg-gray-50 border rounded-lg p-3 mt-2">
                            <p className="font-semibold text-gray-700 mb-1">Message</p>
                            <p className="italic text-gray-600">"{gc.message}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {pagination && !isSearching && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-500">
                      Page <span className="font-medium">{pagination.page}</span> of{" "}
                      <span className="font-medium">{pagination.totalPages}</span> •{" "}
                      {pagination.total} gift cards
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
            </>
          )}
        </main>
      </div>
    </div>
  );
}
