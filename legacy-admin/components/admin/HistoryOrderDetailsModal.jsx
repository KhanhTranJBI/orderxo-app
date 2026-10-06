"use client";

import Image from "next/image";
import { formatDateTime, formatTime, statusColors } from "@/lib/utils";
import InfoTooltip from "@/components/InfoTooltip";
import RefundSection from "@/components/admin/RefundSection";
import OrderTypeBadge from "@/components/admin/OrderTypeBadge";
import PaymentChannelBadge from "@/components/admin/PaymentChannelBadge";
import { POINTS_PER_DOLLAR, REWARD_THRESHOLD, REWARD_VALUE } from "@/lib/environment";

export default function HistoryOrderDetailsModal({ order, onClose }) {
  if (!order) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white max-w-3xl w-full max-h-[90vh] rounded-2xl shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 🔒 Fixed Header Bar */}
        <div className="sticky top-0 z-10 flex justify-end bg-white rounded-t-2xl border-b px-4 py-3">
          <button onClick={onClose} className="text-gray-500 hover:text-black text-xl">
            ✕
          </button>
        </div>

        {/* 🧾 Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-2xl">Order #{order.orderNumber}</p>
                {/* dine-in vs to-go */}
                <OrderTypeBadge orderType={order.orderType} />
                {/* ✅ NEW — kiosk vs online */}
                <PaymentChannelBadge paymentChannel={order.paymentChannel} />
              </div>
              <p className="text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleDateString()} · {order.pickupTime}
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                statusColors[order.status]
              }`}
            >
              {order.status}
            </span>
          </div>

          {/* 💸 Refund Summary */}
          {order.refunds?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
              <p className="font-bold text-red-700 mb-2">💸 Refund Summary</p>

              <div className="space-y-1 text-red-900">
                <div className="flex justify-between">
                  <span>Total Refunded</span>
                  <span className="font-bold">
                    -$
                    {order.refunds.reduce((sum, r) => sum + (r.amount || 0), 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-xs text-gray-500">
                  <span>{order.refunds.length} refund(s)</span>
                  <span>{formatDateTime(order.refunds[order.refunds.length - 1]?.createdAt)}</span>
                </div>
              </div>
            </div>
          )}

          {/* 🧾 Total Items */}
          <div className="flex justify-between">
            <span className="text-blue-600">Total Items</span>
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-600 text-white text-xs font-bold">
              {order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0)}
            </span>
          </div>

          {/* 👤 Customer Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
            <p className="font-bold text-blue-700 mb-2">👤 Customer</p>

            <div className="space-y-1 text-blue-900">
              <div className="flex justify-between">
                <span className="text-blue-600">Name</span>
                <span className="font-medium">{order.customer?.name || "—"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-blue-600">Email</span>
                <a href={`mailto:${order.customer?.email}`} className="font-medium underline">
                  {order.customer?.email || "—"}
                </a>
              </div>

              <div className="flex justify-between">
                <span className="text-blue-600">Phone</span>
                <a href={`tel:${order.customer?.phone}`} className="font-medium underline">
                  {order.customer?.phone || "—"}
                </a>
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm divide-y divide-gray-200">
            <p className="font-bold text-gray-700 mb-1">Order Timeline</p>

            <div className="flex justify-between py-2">
              <span className="text-gray-500">🧾 Ordered</span>
              <span className="font-medium">{formatTime(order.createdAt)}</span>
            </div>

            {order.preparedAt && (
              <div className="flex justify-between py-2">
                <span className="text-gray-500">👍 Confirmed</span>
                <span className="font-medium">{formatTime(order.preparedAt)}</span>
              </div>
            )}

            {order.completedAt && (
              <div className="flex justify-between py-2">
                <span className="text-gray-500">✅ Ready for Pickup</span>
                <span className="font-medium">{formatTime(order.completedAt)}</span>
              </div>
            )}

            {order.pickedAt && (
              <div className="flex justify-between py-2">
                <span className="text-gray-500">🥡 Picked up</span>
                <span className="font-medium">{formatTime(order.pickedAt)}</span>
              </div>
            )}

            {order.cancelledAt && (
              <div className="flex justify-between py-2">
                <span className="text-gray-500">❌ Cancelled</span>
                <span className="font-medium">{formatTime(order.cancelledAt)}</span>
              </div>
            )}

            {order.refunds?.map((refund, idx) => (
              <div key={idx} className="flex justify-between py-2">
                <span className="text-red-500">
                  💸 Refunded -$
                  {refund.amount.toFixed(2)}
                </span>
                <span className="font-medium">{formatTime(refund.createdAt)}</span>
              </div>
            ))}
          </div>

          {/* Special Instructions */}
          {order.specialInstructions && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm">
              <p className="font-bold text-orange-700 mb-1">📝 Special Instructions</p>
              <p className="text-orange-800 italic">{order.specialInstructions}</p>
            </div>
          )}

          {/* Items */}
          <div className="divide-y devide-gray-200">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-start py-4 text-sm">
                {/* Image */}
                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.image && (
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  )}
                </div>

                {/* Item Info */}
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-semibold text-gray-900">
                      {item.quantity}× {item.name}
                    </p>
                    <p className="font-semibold text-primary">${item.totalPrice.toFixed(2)}</p>
                  </div>

                  {/* Modifiers */}
                  {Object.values(item.selectedModifiers)
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((group, idx) => {
                      if (!group.selections?.length) return null;

                      return (
                        <div key={idx} className="">
                          <span className="font-bold text-gray-700 block uppercase">
                            {group.title}:
                          </span>

                          <span className="text-gray-500 italic">
                            {group.selections.map((sel, i) => (
                              <span key={i}>
                                {sel.name}
                                {sel.price > 0 && ` (+$${sel.price.toFixed(2)})`}
                                {i < group.selections.length - 1 ? ", " : ""}
                              </span>
                            ))}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>

          <div className="text-sm divide-y divide-gray-200 pt-2">
            <div className="flex justify-between py-2">
              <span>Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Tax</span>
              <span>${order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Order Service Fee</span>
              <span>${order.onlineServiceFee?.toFixed(2) ?? 0}</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Tip</span>
              <span>${order.tip?.toFixed(2) ?? 0}</span>
            </div>

            {/* 🎯 Loyalty Points Redeemed */}
            {order.pointsRedeemed > 0 &&
              (() => {
                const REWARD_THRESHOLD = Number(
                  process.env.NEXT_PUBLIC_POINTS_REWARD_THRESHOLD || 100,
                );

                const REWARD_VALUE = Number(process.env.NEXT_PUBLIC_POINTS_REWARD_VALUE || 5);

                const redeemedBlocks = Math.floor(order.pointsRedeemed / REWARD_THRESHOLD);

                const redeemedDollars = redeemedBlocks * REWARD_VALUE;

                return (
                  <div className="flex justify-between py-2 text-gray-700">
                    <span>Loyalty Reward Applied ({order.pointsRedeemed} pts)</span>
                    <span className="text-green-700">-${redeemedDollars.toFixed(2)}</span>
                  </div>
                );
              })()}

            {/* 🎟️ Promotion */}
            {order.promoCode && Number(order.promoDiscount || 0) > 0 && (
              <div className="flex justify-between py-2 text-gray-700">
                <span>Promotion ({order.promoCode})</span>

                <span className="text-green-700">-${Number(order.promoDiscount).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold py-2">
              <span>Total</span>

              <p className="font-bold text-primary">${order.totalAmount.toFixed(2)}</p>
            </div>

            {/* 💳 Payment info */}
            <div className="flex justify-between py-2">
              <span>Payment Method</span>
              <span className="font-medium">{order.paymentMethod || "Gift Card"}</span>
            </div>

            {/* 🎟️ Gift Card */}
            {order.giftCard?.amountUsed > 0 && (
              <div className="flex justify-between py-2 text-green-600 py-2">
                <span>Gift Card Applied</span>
                <span>
                  -$
                  {Number(order.giftCard.amountUsed || 0).toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between py-2">
              <span>Amount Charged</span>
              <span className="font-medium text-primary">
                ${Number(order.amountPaid || 0).toFixed(2)}
              </span>
            </div>

            {/* 💸 Refund Applied */}
            {order.refunds?.length > 0 && (
              <div className="flex justify-between text-red-600 py-2">
                <span>Total Refunded</span>
                <span>
                  -$
                  {order.refunds.reduce((sum, r) => sum + (r.amount || 0), 0).toFixed(2)}
                </span>
              </div>
            )}

            {/* 💰 Net Paid */}
            {order.refunds?.length > 0 && (
              <div className="flex justify-between font-bold text-green-700 py-2">
                <span>Net Paid</span>
                <span className="text-green-700">
                  $
                  {(
                    (order.amountPaid || 0) - order.refunds.reduce((sum, r) => sum + r.amount, 0)
                  ).toFixed(2)}
                </span>
              </div>
            )}

            {/* 🎯 Loyalty Points Earned */}
            {order.pointsEarned > 0 && (
              <div className="flex justify-between py-2 text-gray-600 py-2">
                <div className="flex items-center gap-2">
                  <span>Loyalty Points Earned</span>
                  <InfoTooltip
                    text={`Earn ${POINTS_PER_DOLLAR} point${POINTS_PER_DOLLAR > 1 ? "s" : ""} 
                                                        per $1 spent on food subtotal after rewards. 
                                                        
                                                        Every ${REWARD_THRESHOLD} points = $${REWARD_VALUE} reward. 
                                                        
                                                        Tax, tip, service fees, and gift cards do not earn points.`}
                  />
                </div>

                <span className="font-medium text-green-700">+{order.pointsEarned} pts</span>
              </div>
            )}

            {order.paymentStatus === "refunded" && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm mt-4 space-y-2">
                <p className="font-bold text-green-700">🔁 Loyalty Reverted</p>

                {order.pointsRedeemed > 0 && (
                  <div className="flex justify-between">
                    <span>Redeemed Points Restored</span>
                    <span className="text-green-700">+{order.pointsRedeemed} pts</span>
                  </div>
                )}

                {order.pointsEarned > 0 && (
                  <div className="flex justify-between">
                    <span>Earned Points Removed</span>
                    <span className="text-red-600">-{order.pointsEarned} pts</span>
                  </div>
                )}
              </div>
            )}

            {order.refunds?.length > 0 && (
              <div className="bg-gray-50 border rounded-xl p-4 text-sm mt-4">
                <p className="font-bold mb-2">Refund Details</p>

                <div className="space-y-3">
                  {order.refunds.map((refund, idx) => (
                    <div key={idx} className="border rounded-lg p-3 bg-white space-y-1">
                      <div className="flex justify-between">
                        <span className="font-medium text-red-600">
                          -${refund.amount.toFixed(2)}
                        </span>

                        <span className="text-gray-500 text-xs">
                          {formatDateTime(refund.createdAt)}
                        </span>
                      </div>

                      {refund.reason && (
                        <p className="text-gray-600 italic text-xs">{refund.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <RefundSection order={order} />
        </div>
      </div>
    </div>
  );
}
