export default function TransactionsTable({ data, pagination, onPageChange, onRowClick }) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500 border-b">
            <tr>
              <th>Order #</th>
              <th className="py-2">Date</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Payment</th>
              <th className="text-right">Subtotal</th>
              <th className="text-right">Tax</th>
              <th className="text-right">Tip</th>
              <th className="text-right">Order Service Fee</th>
              <th className="text-right">Gross Sales</th>
              <th className="text-right">Rewards Redeemed</th>
              <th className="text-right">Refunded Amount</th>
              <th className="text-right">Transaction Fee</th>
              <th className="text-right">Net Total</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {data.map((tx) => (
              <tr key={tx.orderId} className="hover:bg-gray-50 transition">
                <td
                  className="cursor-pointer py-3 font-bold text-primary hover:underline"
                  onClick={() => onRowClick(tx.orderId)}
                >
                  {tx.orderNumber}
                </td>
                <td className="py-3 whitespace-nowrap">{new Date(tx.date).toLocaleString()}</td>
                <td>{tx.customer}</td>

                <td>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tx.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : tx.status === "cancelled"
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {tx.status}
                  </span>
                </td>

                <td>{tx.paymentMethod}</td>

                <td className="text-right">${tx.subtotal}</td>
                <td className="text-right text-blue-600">${tx.tax}</td>
                <td className="text-right text-blue-600">${tx.tip}</td>
                <td className="text-right text-blue-600">${tx.onlineServiceFee}</td>
                <td className="text-right">${tx.grossSales}</td>
                <td className="text-right text-red-600">-${tx.rewardsRedeemed}</td>
                <td className="text-right text-red-600">-${tx.refundedAmount}</td>
                <td className="text-right text-red-600">-${tx.stripeFee}</td>
                <td className="text-right font-bold text-green-600">${tx.netAfterRefund}</td>
              </tr>
            ))}

            {data.length === 0 && (
              <tr>
                <td colSpan="11" className="text-center py-10 text-gray-400">
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔢 Pagination Controls */}
      {pagination && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-500">
            Page <span className="font-medium">{pagination.page}</span> of{" "}
            <span className="font-medium">{pagination.totalPages}</span> • {pagination.total}{" "}
            transactions
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className={`px-3 py-1 rounded border ${
                pagination.hasPrev ? "hover:bg-gray-100" : "opacity-40 cursor-not-allowed"
              }`}
            >
              ← Previous
            </button>

            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className={`px-3 py-1 rounded border ${
                pagination.hasNext ? "hover:bg-gray-100" : "opacity-40 cursor-not-allowed"
              }`}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
