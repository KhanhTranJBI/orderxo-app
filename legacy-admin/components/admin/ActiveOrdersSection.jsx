"use client";

import OrderCard from "@/components/admin/OrderCard";

export default function ActiveOrdersSection({
  asapOrders,
  scheduledOrders,
  activeTab,
  handleReorder,
  handleCancelOrder,
  updateOrderStatus,
  handlePrintOrder,
  setDeleteOrder,
}) {
  return (
    <div className="space-y-10">
      {/* 🔥 ASAP */}
      {asapOrders.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-red-600 mb-4">🔥 MAKE NOW (ASAP)</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {asapOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                activeTab={activeTab}
                handleReorder={handleReorder}
                handleCancelOrder={handleCancelOrder}
                updateOrderStatus={updateOrderStatus}
                handlePrintOrder={handlePrintOrder}
                setDeleteOrder={setDeleteOrder}
              />
            ))}
          </div>
        </div>
      )}

      {/* ⏰ Scheduled */}
      {scheduledOrders.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-yellow-700 mb-4">⏰ SCHEDULED PICKUP</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scheduledOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                activeTab={activeTab}
                handleReorder={handleReorder}
                handleCancelOrder={handleCancelOrder}
                updateOrderStatus={updateOrderStatus}
                handlePrintOrder={handlePrintOrder}
                setDeleteOrder={setDeleteOrder}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
