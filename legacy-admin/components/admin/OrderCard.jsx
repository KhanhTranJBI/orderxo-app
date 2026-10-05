import { formatTime, statusColors } from "@/lib/utils";
import clsx from "clsx";
import InfoTooltip from "../InfoTooltip";
import OrderTypeBadge from "@/components/admin/OrderTypeBadge";
import PaymentChannelBadge from "@/components/admin/PaymentChannelBadge";
import {
  POINTS_PER_DOLLAR,
  REWARD_THRESHOLD,
  REWARD_VALUE,
} from "@/lib/environment";
import Image from "next/image";

const orderStatusStyles = {
  pending: "bg-gray-50 border-gray-300",
  paid: "bg-yellow-50 border-yellow-300",
  preparing: "bg-orange-50 border-orange-300",
  ready: "bg-green-50 border-green-300",
  completed: "bg-gray-100 border-gray-400",
  cancelled: "bg-red-50 border-red-300",
  deleted: "bg-red-100 border-red-400",
};

const orderStatusAccent = {
  pending: "border-l-4 border-l-gray-400",
  paid: "border-l-4 border-l-yellow-500",
  preparing: "border-l-4 border-l-primary",
  ready: "border-l-4 border-l-green-500",
  completed: "border-l-4 border-l-gray-500",
  cancelled: "border-l-4 border-l-red-500",
  deleted: "border-l-4 border-l-red-700",
};

function getMinutesRemaining(pickupTime) {
  if (!pickupTime) return null;

  // Get today's date in yyyy-mm-dd
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const dateString = `${yyyy}-${mm}-${dd} ${pickupTime}`;

  // Parse as local time
  const pickup = new Date(dateString);
  if (isNaN(pickup)) return null;

  const diff = pickup.getTime() - Date.now();
  return Math.round(diff / 60000);
}

export default function OrderCard({
  order,
  activeTab,
  handleReorder,
  handleCancelOrder,
  updateOrderStatus,
  handlePrintOrder,
  setDeleteOrder,
}) {
  const minutes = getMinutesRemaining(order.pickupTime);

  const renderActionButton = (order) => {
    if (activeTab !== "active-orders") return null;

    if (order.status === "pending")
      return (
        <button
          onClick={() => setDeleteOrder(order)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold"
        >
          🗑️ Delete
        </button>
      );

    if (order.status === "paid")
      return (
        <>
          <button
            onClick={() => handleCancelOrder(order)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold"
          >
            ❌ Cancel Order
          </button>
          <button
            onClick={() => updateOrderStatus(order._id, "preparing")}
            className="flex gap-2 items-center px-4 py-2 bg-primary text-white rounded-lg font-bold"
          >
            👍 Confirm
          </button>
        </>
      );

    if (order.status === "preparing")
      return (
        <>
          <button
            onClick={() => handleCancelOrder(order)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold"
          >
            ❌ Cancel Order
          </button>
          <button
            onClick={() => updateOrderStatus(order._id, "ready")}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold"
          >
            ✅ Ready to Pick Up
          </button>
        </>
      );

    if (order.status === "ready")
      return (
        <>
          <button
            onClick={() => handleCancelOrder(order)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold"
          >
            ❌ Cancel Order
          </button>
          <button
            onClick={() => updateOrderStatus(order._id, "completed")}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg font-bold"
          >
            🥡 Picked Up
          </button>
        </>
      );

    return null;
  };

  return (
    <div
      className={clsx(
        "border rounded-2xl p-2 md:p-6 shadow-sm space-y-4 transition-all",
        "hover:-translate-y-1 hover:scale-[1.01] hover:shadow-xl",
        "hover:ring-2 hover:ring-orange-400/40",
        orderStatusStyles[order.status],
        orderStatusAccent[order.status],
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-lg">Order #{order.orderNumber}</p>
            {/* dine-in vs to-go, right next to the order number so
                kitchen sees it immediately without scanning the whole card */}
            <OrderTypeBadge orderType={order.orderType} />
            {/* ✅ NEW — kiosk vs online, so staff know which channel it came from */}
            <PaymentChannelBadge paymentChannel={order.paymentChannel} />
          </div>

          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleDateString()} ·{" "}
            {order.pickupTime}
          </p>

          {/* Countdown */}
          {minutes !== null && (
            <p className="text-xs font-bold mt-1">
              {minutes < 0 && <span className="text-red-600">OVERDUE</span>}

              {minutes >= 0 && minutes < 10 && (
                <span className="text-red-600">READY IN {minutes} MIN</span>
              )}

              {minutes >= 10 && (
                <span className="text-yellow-700">READY IN {minutes} MIN</span>
              )}
            </p>
          )}
        </div>

        <div className="text-right space-y-2 space-x-2">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
              statusColors[order.status]
            }`}
          >
            {order.status}
          </span>

          <button
            onClick={() => handleReorder(order)}
            className="font-bold text-primary hover:underline"
          >
            Reorder
          </button>
        </div>
      </div>

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
            <a
              href={`mailto:${order.customer?.email}`}
              className="font-medium underline"
            >
              {order.customer?.email || "—"}
            </a>
          </div>

          <div className="flex justify-between">
            <span className="text-blue-600">Phone</span>
            <a
              href={`tel:${order.customer?.phone}`}
              className="font-medium underline"
            >
              {order.customer?.phone || "—"}
            </a>
          </div>
        </div>
      </div>

      {/* Order Timeline */}
      <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2 divide-y divide-gray-200">
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
      </div>

      {/* Special Instructions */}
      {order.specialInstructions && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm">
          <p className="font-bold text-orange-700 mb-1">
            📝 Special Instructions
          </p>

          <p className="text-orange-800 italic">{order.specialInstructions}</p>
        </div>
      )}

      {/* Items */}
      <div className="divide-y divide-gray-200">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex gap-4 items-start py-4 text-sm">
            {/* Image */}
            <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {item.image && (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              )}
            </div>

            {/* Item Info */}
            <div className="flex-1">
              <div className="flex justify-between">
                <p className="font-semibold text-gray-900">
                  {item.quantity}× {item.name}
                </p>

                <p className="font-semibold text-primary ">
                  ${item.totalPrice.toFixed(2)}
                </p>
              </div>

              {/* Modifiers */}
              {Object.values(item.selectedModifiers)
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((group, idx) => {
                  if (!group.selections?.length) return null;

                  return (
                    <div key={idx}>
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

      {/* Totals */}
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

        {/* Loyalty Redeemed */}
        {order.pointsRedeemed > 0 &&
          (() => {
            const REWARD_THRESHOLD = Number(
              process.env.NEXT_PUBLIC_POINTS_REWARD_THRESHOLD || 100,
            );

            const REWARD_VALUE = Number(
              process.env.NEXT_PUBLIC_POINTS_REWARD_VALUE || 5,
            );

            const redeemedBlocks = Math.floor(
              order.pointsRedeemed / REWARD_THRESHOLD,
            );

            const redeemedDollars = redeemedBlocks * REWARD_VALUE;

            return (
              <div className="flex justify-between py-2 text-gray-700">
                <span>Loyalty Reward Applied ({order.pointsRedeemed} pts)</span>

                <span className="text-green-700">
                  -${redeemedDollars.toFixed(2)}
                </span>
              </div>
            );
          })()}

        {order.promoCode && (
          <div className="flex items-center justify-between gap-2 py-2">
            <span className="text-sm font-semibold text-gray-700">
              Promo: {order.promoCode}
            </span>

            <span className="text-green-700">
              -${Number(order.promoDiscount || 0).toFixed(2)}
            </span>
          </div>
        )}

        <div className="flex justify-between font-bold py-2">
          <span>Total</span>

          <span className="text-primary">${order.totalAmount.toFixed(2)}</span>
        </div>

        {/* Payment */}
        <div className="pt-2 space-y-1 text-gray-600">
          <div className="flex justify-between">
            <span>Payment Method</span>
            <span className="font-medium">
              {order.paymentMethod || "Gift Card"}
            </span>
          </div>

          {order.giftCard?.amountUsed > 0 && (
            <div className="flex justify-between py-2 text-gray-600">
              <span>Gift Card Applied</span>
              <span className="font-medium text-green-700">
                -${Number(order.giftCard.amountUsed || 0).toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Amount Charged</span>
            <span className="font-medium text-primary">
              ${Number(order.amountPaid || 0).toFixed(2)}
            </span>
          </div>

          {/* Points Earned */}
          {order.pointsEarned > 0 && (
            <div className="flex justify-between py-2 text-gray-600">
              <div className="flex items-center gap-2">
                <span>Loyalty Points Earned</span>

                <InfoTooltip
                  text={`Earn ${POINTS_PER_DOLLAR} point${POINTS_PER_DOLLAR > 1 ? "s" : ""} per $1 spent on food subtotal after rewards.

Every ${REWARD_THRESHOLD} points = $${REWARD_VALUE} reward.

Tax, tip, service fees, and gift cards do not earn points.`}
                />
              </div>

              <span className="font-medium text-green-700">
                +{order.pointsEarned} pts
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="flex flex-col gap-2">
        {/* Row 1: Print button (left) */}
        {process.env.NEXT_PUBLIC_ENABLE_PRINT === "true" ? (
          <div className="flex justify-start">
            <button
              onClick={() => handlePrintOrder(order)}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg font-bold hover:bg-black"
            >
              🖨️ Print
            </button>
          </div>
        ) : null}

        {/* Row 2: actions (right) */}
        <div className="flex justify-end gap-2 flex-wrap">
          {renderActionButton(order)}
        </div>
      </div>
    </div>
  );
}
