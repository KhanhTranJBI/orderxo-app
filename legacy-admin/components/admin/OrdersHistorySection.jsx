"use client";

import { Loader2, Search, X } from "lucide-react";
import { statusColors } from "@/lib/utils";
import OrderTypeBadge from "@/components/admin/OrderTypeBadge";
import PaymentChannelBadge from "@/components/admin/PaymentChannelBadge";

export default function OrdersHistorySection({
  loading,
  historyOrders,
  search,
  setSearch,
  pagination,
  onPageChange,
  setSelectedOrder,
}) {
  return (
    <>
      {/* 🔍 Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

        <input
          type="text"
          placeholder="Search by name, email, or order number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-9 py-2 w-full border rounded-lg"
        />

        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* 📦 Table */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : historyOrders.length === 0 ? (
        <p className="text-center text-gray-500 py-10">No orders found</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Channel</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Items</th>
                <th className="px-4 py-3 text-left">Subtotal</th>
                <th className="px-4 py-3 text-left">Tax</th>
                <th className="px-4 py-3 text-left">Tip</th>
                <th className="px-4 py-3 text-left">Order Service Fee</th>
                <th className="px-4 py-3 text-left">Gross Sales</th>
                <th className="px-4 py-3 text-left">Rewards Redeemed</th>
                <th className="px-4 py-3 text-left">Promotion</th>
                <th className="px-4 py-3 text-left">Refunded Amount</th>
                <th className="px-4 py-3 text-left">Transaction Fee</th>
                <th className="px-4 py-3 text-left">Net Total</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {historyOrders.map((order) => {
                const promoDiscount = Number(order.promoDiscount || 0);

                return (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td
                      className="px-4 py-3 font-bold text-primary cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      #{order.orderNumber}
                    </td>

                    <td className="px-4 py-3 text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>

                    <td className="px-4 py-3">{order.customer?.name || "Guest"}</td>

                    <td className="px-4 py-3">
                      <OrderTypeBadge orderType={order.orderType} />
                    </td>

                    <td className="px-4 py-3">
                      <PaymentChannelBadge paymentChannel={order.paymentChannel} />
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${statusColors[order.status]}`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {order.items?.reduce((sum, i) => sum + (i.quantity || 1), 0)}
                    </td>

                    {/* Subtotal */}
                    <td className="px-4 py-3">${Number(order.subtotal || 0).toFixed(2)}</td>

                    {/* Tax */}
                    <td className="px-4 py-3 text-blue-600">
                      ${Number(order.tax || 0).toFixed(2)}
                    </td>

                    {/* Tip */}
                    <td className="px-4 py-3 text-blue-600">
                      ${Number(order.tip || 0).toFixed(2)}
                    </td>

                    {/* Service Fee */}
                    <td className="px-4 py-3 text-blue-600">
                      ${Number(order.onlineServiceFee || 0).toFixed(2)}
                    </td>

                    {/* Gross Sales */}
                    <td className="px-4 py-3 font-medium">
                      ${Number(order.totalAmount || 0).toFixed(2)}
                    </td>

                    {/* Rewards */}
                    <td className="px-4 py-3 text-red-600">
                      -${Number(order.rewardsRedeemed || 0).toFixed(2)}
                    </td>

                    {/* 🎟️ Promotion */}
                    <td className="px-4 py-3">
                      {order.promoCode && promoDiscount > 0 ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-green-700">{order.promoCode}</span>

                          <span className="text-red-600">-${promoDiscount.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Refund */}
                    <td className="px-4 py-3 text-red-600">
                      -${Number(order.refunded || 0).toFixed(2)}
                    </td>

                    {/* Stripe Fee */}
                    <td className="px-4 py-3 text-red-600">
                      -${Number(order.stripeFee || 0).toFixed(2)}
                    </td>

                    {/* Net */}
                    <td className="px-4 py-3 text-green-600 font-bold">
                      ${Number(order.net || 0).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
