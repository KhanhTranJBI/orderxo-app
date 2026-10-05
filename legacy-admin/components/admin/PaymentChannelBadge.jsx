import { Monitor, Globe } from "lucide-react";

/**
 * Small pill badge showing which channel an order came from.
 * Same drop-in pattern as OrderTypeBadge — place it next to the order
 * number wherever orders are rendered.
 *
 * Usage:
 *   <PaymentChannelBadge paymentChannel={order.paymentChannel} />
 *
 * order.paymentChannel is "terminal" | "online" (defaults to "online" if
 * missing, matching the Order schema default — safe for orders created
 * before this field existed).
 */
export default function PaymentChannelBadge({ paymentChannel, className = "" }) {
  const isKiosk = paymentChannel === "terminal";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap
        ${
          isKiosk
            ? "bg-purple-50 text-purple-700 border border-purple-200"
            : "bg-teal-50 text-teal-700 border border-teal-200"
        } ${className}`}
    >
      {isKiosk ? (
        <>
          <Monitor size={12} /> Kiosk
        </>
      ) : (
        <>
          <Globe size={12} /> Online
        </>
      )}
    </span>
  );
}
