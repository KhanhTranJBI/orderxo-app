"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

export default function DeleteOrderModal({ order, onClose, onSuccess }) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);

    try {
      await apiFetch(
        "/api/admin/orders/update-status",
        {
          method: "POST",
          body: JSON.stringify({
            orderId: order._id,
            status: "deleted",
          }),
        },
        session?.jwt,
      );

      toast.success("Order deleted");

      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-red-600">
          Delete Order #{order.orderNumber}
        </h2>

        <p className="text-gray-600 mb-4">
          This action <b>cannot be undone</b>. Are you sure you want to delete
          this order?
        </p>

        <div className="bg-gray-50 rounded-lg p-3 text-sm mb-4">
          <div className="flex justify-between">
            <span>Items</span>
            <span>{order.items.reduce((sum, i) => sum + i.quantity, 0)}</span>
          </div>

          <div className="flex justify-between">
            <span>Total</span>
            <span className="font-bold text-primary">
              ${order.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">
            Cancel
          </button>

          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold"
          >
            {loading ? "Deleting..." : "Delete Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
