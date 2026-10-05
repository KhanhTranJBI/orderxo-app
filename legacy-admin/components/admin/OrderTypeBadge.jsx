import { Utensils, ShoppingBag } from "lucide-react";

/**
 * Small pill badge showing dine-in vs to-go for an order.
 * Drop this next to the order number / status badge wherever orders are
 * rendered: ActiveOrdersSection, OrdersHistorySection,
 * HistoryOrderDetailsModal, ActiveCartsSection, etc.
 *
 * Usage:
 *   <OrderTypeBadge orderType={order.orderType} />
 *
 * order.orderType is "dine_in" | "to_go" (defaults to "to_go" if missing,
 * matching the Order schema default — safe for orders created before this
 * field existed).
 */
export default function OrderTypeBadge({ orderType, className = "" }) {
  const isDineIn = orderType === "dine_in";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap
        ${
          isDineIn
            ? "bg-blue-50 text-blue-700 border border-blue-200"
            : "bg-orange-50 text-orange-700 border border-orange-200"
        } ${className}`}
    >
      {isDineIn ? (
        <>
          <Utensils size={12} /> Dine In
        </>
      ) : (
        <>
          <ShoppingBag size={12} /> To Go
        </>
      )}
    </span>
  );
}
