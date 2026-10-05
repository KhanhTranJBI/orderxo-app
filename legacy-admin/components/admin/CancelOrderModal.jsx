"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

export default function CancelOrderModal({ order, onClose, onSuccess }) {
  const { data: session } = useSession();

  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("full"); // full | partial | items
  const [amount, setAmount] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [reason, setReason] = useState("");

  const totalPaid = (order.amountPaid || 0) + (order.giftCard?.amountUsed || 0);

  const alreadyRefunded =
    order.refunds?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;

  const nonRefundableFees = order.onlineServiceFee || 0;

  const remainingRefund = totalPaid - alreadyRefunded - nonRefundableFees;

  // 🧮 item refund
  const itemRefund = order.items
    .filter((item) => selectedItems.includes(item.menuItemId?.toString()))
    .reduce((sum, item) => {
      const itemSubtotal = item.totalPrice || 0;

      const itemTax =
        order.subtotal > 0
          ? (itemSubtotal / order.subtotal) * (order.tax || 0)
          : 0;

      return sum + itemSubtotal + itemTax;
    }, 0);

  const getRefundAmount = () => {
    if (type === "full") return remainingRefund;
    if (type === "partial") return Number(amount);
    if (type === "items") return itemRefund;
    return 0;
  };

  const handleSubmit = async () => {
    const refundAmount = getRefundAmount();

    if (!refundAmount || refundAmount <= 0) {
      toast.error("Invalid refund amount");
      return;
    }

    setLoading(true);

    try {
      await apiFetch(
        "/api/admin/orders/cancel",
        {
          method: "POST",
          body: JSON.stringify({
            orderId: order._id,
            refundAmount,
            reason,
          }),
        },
        session?.jwt,
      );

      toast.success("Order cancelled & refunded");

      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Cancel failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-4">
          Cancel Order #{order.orderNumber}
        </h2>

        <p className="text-sm mb-3">
          Remaining refundable: <b>${remainingRefund.toFixed(2)}</b>
        </p>

        {/* 🔘 TYPE */}
        <div className="flex gap-2 mb-4">
          {["full", "partial", "items"].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 py-1 rounded-lg border ${
                type === t ? "bg-black text-white" : ""
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* 💰 PARTIAL */}
        {type === "partial" && (
          <input
            type="number"
            placeholder="Enter amount"
            className="w-full border rounded-lg p-2 mb-4"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        )}

        {/* 🧾 ITEMS */}
        {type === "items" && (
          <div className="max-h-48 overflow-y-auto border rounded-lg p-2 mb-4">
            {order.items.map((item) => {
              const id = item.menuItemId?.toString();

              const itemSubtotal = item.totalPrice || 0;
              const itemTax =
                order.subtotal > 0
                  ? (itemSubtotal / order.subtotal) * (order.tax || 0)
                  : 0;

              const itemTotalWithTax = itemSubtotal + itemTax;

              return (
                <label
                  key={id}
                  className="flex justify-between items-center mb-2"
                >
                  <div>
                    {item.name} x{item.quantity}
                    <div className="text-xs text-gray-500">
                      ${itemTotalWithTax.toFixed(2)} (incl. tax)
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={selectedItems.includes(id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems([...selectedItems, id]);
                      } else {
                        setSelectedItems(selectedItems.filter((i) => i !== id));
                      }
                    }}
                  />
                </label>
              );
            })}

            <p className="mt-2 text-sm">
              Refund (incl. tax): <b>${itemRefund.toFixed(2)}</b>
            </p>
          </div>
        )}

        {/* 📝 REASON */}
        <textarea
          placeholder="Reason (optional)"
          className="w-full border rounded-lg p-2 mb-4"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {/* ACTIONS */}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">
            Close
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold"
          >
            {loading ? "Processing..." : "Cancel Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
