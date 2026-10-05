"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { apiFetch } from "@/lib/api";
import { useSession } from "next-auth/react";
import { BarChart3, Flame, History, Loader2, ShoppingCart } from "lucide-react";
import { useDispatch } from "react-redux";
import { addReorderItem } from "@/store/cartSlice";

import CancelOrderModal from "@/components/admin/CancelOrderModal";
import DeleteOrderModal from "@/components/admin/DeleteOrderModal";
import OrdersHistorySection from "@/components/admin/OrdersHistorySection";
import ActiveOrdersSection from "@/components/admin/ActiveOrdersSection";
import HistoryOrderDetailsModal from "@/components/admin/HistoryOrderDetailsModal";
import { toast } from "react-toastify";
import ActiveCartsSection from "@/components/admin/ActiveCartsSection";
import OrdersReportSection from "@/components/admin/OrdersReportSection";
import { ORDERS_POLL_INTERVAL_MS } from "@/lib/environment";

export default function AdminOrdersDashboardTemplate() {
  const { data: session, status } = useSession();
  const dispatch = useDispatch();

  const getTabFromHash = () => {
    if (typeof window === "undefined") return "active-orders";

    const params = new URLSearchParams(window.location.hash.replace("#", ""));

    const tab = params.get("tab");

    if (
      ["active-orders", "active-carts", "orders-history", "report"].includes(
        tab,
      )
    ) {
      return tab;
    }

    return "active-orders";
  };

  const [activeTab, setActiveTab] = useState(getTabFromHash); // active | history
  const [activeOrders, setActiveOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [deleteOrder, setDeleteOrder] = useState(null);

  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const lastOrderIdRef = useRef(null);

  // Keep the current tab in a ref so long-lived intervals (which close over
  // stale state) can always check "are we currently looking at this tab?"
  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const tabs = [
    { id: "active-carts", label: "Active Carts", icon: ShoppingCart },
    { id: "active-orders", label: "Active Orders", icon: Flame },
    {
      id: "orders-history",
      label: "Orders History",
      icon: History,
    },
    { id: "report", label: "Report", icon: BarChart3 },
  ];

  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const fetchReport = async () => {
    try {
      setReportLoading(true);

      const res = await apiFetch(
        "/api/admin/reports",
        { method: "GET" },
        session?.jwt,
      );

      setReport(res || null);
      setPagination(null);
    } finally {
      setReportLoading(false);
    }
  };

  function useNow(interval = 60000) {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
      const timer = setInterval(() => {
        setNow(Date.now());
      }, interval);

      return () => clearInterval(timer);
    }, [interval]);

    return now;
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset page when searching
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const handleTabClick = (id) => {
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
  /* 🔔 SINGLE HEARTBEAT POLL            */
  /* Fetches /api/admin/orders once     */
  /* every 5s and does double duty:     */
  /*  - detects brand-new paid orders   */
  /*  - keeps the Active Orders list    */
  /*    fresh while that tab is open,   */
  /*    so we don't need a *second*     */
  /*    interval hitting the same       */
  /*    endpoint every 20s.             */
  /* ---------------------------------- */
  const checkForNewOrders = async () => {
    try {
      const res = await apiFetch(
        "/api/admin/orders",
        { method: "GET" },
        session?.jwt,
      );

      const data = res?.orders || [];

      // If the admin is currently on the Active Orders tab, this same
      // response is exactly what that tab needs — reuse it instead of
      // firing a second, separate poll for it.
      if (activeTabRef.current === "active-orders") {
        setActiveOrders(data);
        setPagination(res?.pagination || null);
      }

      // ✅ Only consider PAID orders for the "new order" alert
      const paidOrders = data.filter((o) => o.status === "paid");

      if (!paidOrders.length) {
        return;
      }

      const newestOrder = data.reduce((latest, order) =>
        new Date(order.createdAt) > new Date(latest.createdAt) ? order : latest,
      );

      const newestOrderId = newestOrder._id;

      if (newestOrderId !== lastOrderIdRef.current) {
        lastOrderIdRef.current = newestOrderId;

        callOnNewOrder();

        setShowNewOrderModal(true);
      }
    } catch (err) {
      console.error("Check new orders failed:", err);
    }
  };

  // Single 5s heartbeat, paused whenever the browser tab isn't visible
  // (an admin leaving this open in the background was silently generating
  // a request every 5s for no reason).
  useEffect(() => {
    if (status !== "authenticated") return;

    let interval = null;

    const start = () => {
      if (interval) return;
      checkForNewOrders();
      interval = setInterval(checkForNewOrders, ORDERS_POLL_INTERVAL_MS);
    };

    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    if (
      typeof document === "undefined" ||
      document.visibilityState === "visible"
    ) {
      start();
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [status]);

  /* ---------------------------------- */
  /* 📦 FETCH ORDERS (tab switch / manual refresh only) */
  /* ---------------------------------- */
  const fetchOrders = async (type, pageNum = 1, searchValue = "") => {
    try {
      setLoading(true);

      let endpoint;

      if (type === "orders-history") {
        endpoint = `/api/admin/orders/history?page=${pageNum}&search=${searchValue}`;
      } else {
        endpoint = "/api/admin/orders";
      }

      const res = await apiFetch(endpoint, { method: "GET" }, session?.jwt);

      const data = res?.orders || [];

      if (type === "active-orders") {
        setActiveOrders(data);
      } else {
        setHistoryOrders(data);
      }

      setPagination(res?.pagination || null);
    } finally {
      setLoading(false);
    }
  };

  const handleNewOrderClick = async () => {
    setShowNewOrderModal(false);
    stopKitchenAlert();

    setActiveTab("active-orders");
    window.location.hash = "tab=active-orders";

    // show loading immediately
    setLoading(true);

    await fetchOrders("active-orders", 1);
  };

  const [activeCarts, setActiveCarts] = useState([]);
  const lastCartRef = useRef(null);
  const fetchCarts = async () => {
    try {
      setLoading(true);

      const res = await apiFetch(
        "/api/admin/carts",
        { method: "GET" },
        session?.jwt,
      );

      const data = res?.carts || [];

      setActiveCarts(data);

      setPagination(res?.pagination || null);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------- */
  /* 🔁 EFFECT: initial load per tab + tab-scoped polling */
  /* (Active Orders no longer polls here — the 5s heartbeat above */
  /*  keeps it fresh, so we only do the *initial* fetch on switch) */
  /* ---------------------------------- */
  useEffect(() => {
    if (status !== "authenticated") return;

    setPage(1);

    if (activeTab === "orders-history") {
      fetchOrders("orders-history", 1, debouncedSearch);
    } else if (activeTab === "active-orders") {
      fetchOrders("active-orders", 1);
    } else if (activeTab === "active-carts") {
      fetchCarts();
    } else if (activeTab === "report") {
      fetchReport();
    }

    if (activeTab === "active-carts") {
      // Pause this one too when the tab is hidden, same reasoning as the heartbeat above.
      const tick = () => {
        if (
          typeof document === "undefined" ||
          document.visibilityState === "visible"
        ) {
          fetchCarts();
        }
      };
      const interval = setInterval(tick, ORDERS_POLL_INTERVAL_MS);
      return () => clearInterval(interval);
    }
  }, [activeTab, status, debouncedSearch]);

  const [cancelOrder, setCancelOrder] = useState(null);
  const handleCancelOrder = async (order) => {
    setCancelOrder(order);
  };

  /* ---------------------------------- */
  /* 🔄 UPDATE STATUS (ACTIVE ONLY) */
  /* ---------------------------------- */
  const updateOrderStatus = async (orderId, nextStatus) => {
    await apiFetch(
      "/api/admin/orders/update-status",
      {
        method: "POST",
        body: JSON.stringify({ orderId, status: nextStatus }),
      },
      session.jwt,
    );

    setActiveOrders((prev) =>
      prev.map((order) =>
        order._id === orderId
          ? {
              ...order,
              status: nextStatus,
              preparedAt:
                nextStatus === "preparing"
                  ? new Date().toISOString()
                  : order.preparedAt,
              completedAt:
                nextStatus === "ready"
                  ? new Date().toISOString()
                  : order.completedAt,
              pickedAt:
                nextStatus === "completed"
                  ? new Date().toISOString()
                  : order.pickedAt,
            }
          : order,
      ),
    );
  };

  const handlePrintOrder = async (order) => {
    try {
      await apiFetch(
        "/api/admin/orders/print",
        {
          method: "POST",
          body: JSON.stringify({ orderId: order._id }),
        },
        session.jwt,
      );

      toast.success(`🖨️ Order #${order.orderNumber} sent to printer`);
    } catch (err) {
      console.error("Print failed:", err);
      toast.error("❌ Failed to print");
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  function handleReorder(order) {
    order.items.forEach((item) => {
      dispatch(
        addReorderItem({
          _id: item.menuItemId,
          name: item.name,
          image: item.image,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
          selectedModifiers: item.selectedModifiers,
          modifierGroups: item.modifierGroups ?? [],
        }),
      );
    });
  }

  const onPageChange = (page) => {
    setPage(page);
    fetchOrders("orders-history", page, debouncedSearch);
  };

  const now = useNow();

  const isASAP = (order) =>
    !order.pickupTime || order.pickupTime.toLowerCase().includes("asap");

  const asapOrders = activeOrders
    .filter(isASAP)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const scheduledOrders = activeOrders
    .filter((o) => !isASAP(o))
    .sort((a, b) => new Date(a.pickupTime) - new Date(b.pickupTime));

  const alertContextRef = useRef(null);
  const alertBufferRef = useRef(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Initialize audio context & buffer
  const initAudio = async () => {
    try {
      if (!alertContextRef.current) {
        alertContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
      }

      if (alertContextRef.current.state === "suspended") {
        await alertContextRef.current.resume();
      }

      if (!alertBufferRef.current) {
        const res = await fetch("/sounds/kitchen-bell.wav");

        const arrayBuffer = await res.arrayBuffer();

        alertBufferRef.current =
          await alertContextRef.current.decodeAudioData(arrayBuffer);
      }

      setAudioUnlocked(true);
    } catch (err) {
      console.error("❌ Audio init failed:", err);
    }
  };

  // Play bell
  const playKitchenAlert = async () => {
    if (!alertContextRef.current || !alertBufferRef.current) return;

    if (alertContextRef.current.state === "suspended") {
      await alertContextRef.current.resume();
    }

    const source = alertContextRef.current.createBufferSource();
    source.buffer = alertBufferRef.current;
    source.connect(alertContextRef.current.destination);
    source.start(0);
  };

  useEffect(() => {
    const unlockAudio = async () => {
      if (audioUnlocked) {
        return;
      }

      await initAudio();
    };

    window.addEventListener("click", unlockAudio);

    return () => {
      window.removeEventListener("click", unlockAudio);
    };
  }, [audioUnlocked]);

  const alertLoopRef = useRef(null);

  const stopKitchenAlert = () => {
    if (alertLoopRef.current) {
      clearInterval(alertLoopRef.current);
      alertLoopRef.current = null;
    }
  };

  /* -----------------------------
     🔔 Example: call on new order
     ----------------------------- */
  const callOnNewOrder = () => {
    if (!alertContextRef.current || !alertBufferRef.current) {
      return;
    }

    stopKitchenAlert();

    playKitchenAlert();

    alertLoopRef.current = setInterval(() => {
      playKitchenAlert();
    }, 2000);

    const clickHandler = () => {
      stopKitchenAlert();
      window.removeEventListener("click", clickHandler);
    };

    window.addEventListener("click", clickHandler);
  };

  /* ---------------------------------- */
  /* 🧾 UI */
  /* ---------------------------------- */
  return (
    <div className="py-4 md:py-6 px-2 xl:px-16">
      {!audioUnlocked && (
        <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded-lg">
          Tap anywhere to enable sound 🔊
        </div>
      )}
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

        {/* ORDERS */}
        <main className="mx-auto">
          <div className="space-y-4">
            {activeTab === "orders-history" ? (
              <OrdersHistorySection
                loading={loading}
                historyOrders={historyOrders}
                search={search}
                setSearch={setSearch}
                pagination={pagination}
                onPageChange={onPageChange}
                setSelectedOrder={setSelectedOrder}
              />
            ) : activeTab === "active-carts" ? (
              <ActiveCartsSection carts={activeCarts} />
            ) : activeTab === "active-orders" ? (
              <ActiveOrdersSection
                asapOrders={asapOrders}
                scheduledOrders={scheduledOrders}
                activeTab={activeTab}
                handleReorder={handleReorder}
                handleCancelOrder={handleCancelOrder}
                updateOrderStatus={updateOrderStatus}
                handlePrintOrder={handlePrintOrder}
                setDeleteOrder={setDeleteOrder}
              />
            ) : activeTab === "report" ? (
              <OrdersReportSection report={report} loading={reportLoading} />
            ) : null}
            {pagination && (
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-500">
                  Page <span className="font-medium">{pagination.page}</span> of{" "}
                  <span className="font-medium">{pagination.totalPages}</span> •{" "}
                  {pagination.total} orders
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className={`px-3 py-1 rounded border ${
                      pagination.hasPrev
                        ? "hover:bg-gray-100"
                        : "opacity-40 cursor-not-allowed"
                    }`}
                  >
                    ← Previous
                  </button>

                  <button
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className={`px-3 py-1 rounded border ${
                      pagination.hasNext
                        ? "hover:bg-gray-100"
                        : "opacity-40 cursor-not-allowed"
                    }`}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>

          {selectedOrder && (
            <HistoryOrderDetailsModal
              order={selectedOrder}
              onClose={() => setSelectedOrder(null)}
            />
          )}
          {cancelOrder && (
            <CancelOrderModal
              order={cancelOrder}
              onClose={() => setCancelOrder(null)}
              onSuccess={() => fetchOrders(activeTab)}
            />
          )}
        </main>
      </div>
      {deleteOrder && (
        <DeleteOrderModal
          order={deleteOrder}
          onClose={() => setDeleteOrder(null)}
          onSuccess={() => fetchOrders(activeTab)}
        />
      )}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-md text-center">
            <h2 className="text-xl font-bold mb-2">🔥 New Order Received</h2>
            <p className="text-gray-600 mb-4">
              A new order just came in. Click to view it.
            </p>

            <button
              onClick={handleNewOrderClick}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:opacity-90"
            >
              View Active Orders
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
