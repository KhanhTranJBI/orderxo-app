"use client";

import { apiFetch } from "@/lib/api";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "react-toastify";

export default function RefundSection({ order, onRefunded }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [refundType, setRefundType] = useState("full"); // full | partial | items
  const [amount, setAmount] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [reason, setReason] = useState("");

  const totalPaid = (order.amountPaid || 0) + (order.giftCard?.amountUsed || 0);

  const alreadyRefunded = order.refunds?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;

  const nonRefundableFees = order.onlineServiceFee || 0;

  const remainingRefund = totalPaid - alreadyRefunded - nonRefundableFees;

  // 🧮 Calculate item refund
  const itemRefundAmount = order.items
    .filter((item) => selectedItems.includes(item.menuItemId?.toString()))
    .reduce((sum, item) => {
      const itemSubtotal = item.totalPrice || 0;

      // 🧠 proportional tax
      const itemTax = order.subtotal > 0 ? (itemSubtotal / order.subtotal) * (order.tax || 0) : 0;

      return sum + itemSubtotal + itemTax;
    }, 0);

  const handleRefund = async () => {
    let refundAmount = 0;

    if (refundType === "full") {
      refundAmount = remainingRefund;
    } else if (refundType === "partial") {
      refundAmount = Number(amount);
    } else if (refundType === "items") {
      refundAmount = itemRefundAmount;
    }

    if (!refundAmount || refundAmount <= 0) {
      alert("Invalid refund amount");
      return;
    }

    setLoading(true);

    try {
      const data = await apiFetch(
        "/api/admin/orders/refund",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: order._id,
            amount: refundAmount,
            reason,
          }),
        },
        session?.jwt,
      );

      toast.success("Refund successful");

      setOpen(false);
      onRefunded?.(); // refresh order
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!["completed", "cancelled"].includes(order.status)) return null;

  return (
    <>
      <div className="flex justify-end">
        {/* 🔘 OPEN BUTTON */}
        <button
          onClick={() => setOpen(true)}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-bold"
        >
          Refund
        </button>
      </div>

      {/* 🧾 MODAL */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Refund Order</h2>

            <p className="text-sm mb-2">
              Remaining refundable: <b>${remainingRefund.toFixed(2)}</b>
            </p>

            {/* 🔘 TYPE SELECT */}
            <div className="flex gap-2 mb-4">
              {["full", "partial", "items"].map((type) => (
                <button
                  key={type}
                  onClick={() => setRefundType(type)}
                  className={`px-3 py-1 rounded-lg border ${
                    refundType === type ? "bg-black text-white" : "bg-white"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* 💰 PARTIAL */}
            {refundType === "partial" && (
              <input
                type="number"
                placeholder="Enter amount"
                className="w-full border rounded-lg p-2 mb-4"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            )}

            {/* 🧾 ITEMS */}
            {refundType === "items" && (
              <div className="max-h-48 overflow-y-auto border rounded-lg p-2 mb-4">
                {order.items.map((item) => {
                  const id = item.menuItemId?.toString();

                  const itemSubtotal = item.totalPrice || 0;
                  const itemTax =
                    order.subtotal > 0 ? (itemSubtotal / order.subtotal) * (order.tax || 0) : 0;

                  const itemTotalWithTax = itemSubtotal + itemTax;

                  return (
                    <label key={id} className="flex justify-between items-center mb-2">
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
                  Refund: <b>${itemRefundAmount.toFixed(2)}</b>
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
              <button onClick={() => setOpen(false)} className="px-4 py-2 border rounded-lg">
                Cancel
              </button>

              <button
                onClick={handleRefund}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold"
              >
                {loading ? "Processing..." : "Confirm Refund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
