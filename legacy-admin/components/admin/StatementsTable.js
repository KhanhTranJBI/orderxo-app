export default function StatementsTable({
  data,
  pagination,
  onPageChange,
  token,
  summary,
  annualStatements,
  year,
}) {
  const formatMonth = (monthStr) => {
    if (!monthStr) return "";

    const [year, month] = monthStr.split("-");

    if (!year || !month) return "";

    const date = new Date(Number(year), Number(month) - 1);

    return date.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const money = (n) => {
    return Number(n || 0).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const downloadStatement = async (month) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_ADMIN_API_URL}/api/admin/financials/statements/download?month=${month}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error("Failed to download statement");
      }

      const blob = await res.blob();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;
      a.download = `Statement-${month}.pdf`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const SummaryCards = () => {
    if (!summary) return null;

    const cards = [
      {
        label: "Gross Sales",
        value: summary.grossSales,
      },
      {
        label: "Rewards",
        value: summary.rewardsRedeemed,
        negative: true,
      },
      {
        label: "Refunds",
        value: summary.refunds,
        negative: true,
      },

      {
        label: "Transaction Fees",
        value: summary.stripeFees,
        negative: true,
      },
      {
        label: "Net Total",
        value: summary.netTotal,
        highlight: true,
      },
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border p-4 ${
              card.highlight ? "bg-green-50 border-green-200" : "bg-gray-50"
            }`}
          >
            <div className="text-sm text-gray-500">{card.label}</div>

            <div
              className={`mt-1 text-xl font-bold ${
                card.highlight ? "text-green-600" : card.negative ? "text-red-600" : "text-gray-900"
              }`}
            >
              {card.negative ? `-${money(card.value)}` : money(card.value)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  /* =====================================================
     ALL YEARS
  ===================================================== */

  if (year === "all") {
    return (
      <div className="space-y-6">
        <SummaryCards />

        <div>
          <h2 className="text-lg font-bold mb-4">Annual Statements</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500 border-b">
                <tr>
                  <th className="py-2">Year</th>

                  <th className="text-right">Subtotal</th>

                  <th className="text-right">Tax</th>

                  <th className="text-right">Tip</th>

                  <th className="text-right">Order Service Fee</th>

                  <th className="text-right">Gross Sales</th>

                  <th className="text-right">Rewards</th>

                  <th className="text-right">Refunds</th>

                  <th className="text-right">Transaction Fee</th>

                  <th className="text-right font-semibold">Net Total</th>
                </tr>
              </thead>

              <tbody>
                {data.map((stmt) => (
                  <tr key={stmt.year} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-bold">{stmt.year}</td>

                    <td className="text-right">{money(stmt.subtotal)}</td>

                    <td className="text-right text-blue-600">{money(stmt.tax)}</td>

                    <td className="text-right text-blue-600">{money(stmt.tips)}</td>

                    <td className="text-right text-blue-600">{money(stmt.onlineFees)}</td>

                    <td className="text-right font-medium">{money(stmt.grossSales)}</td>

                    <td className="text-right text-red-600">-{money(stmt.rewardsRedeemed)}</td>

                    <td className="text-right text-red-600">-{money(stmt.refunds)}</td>

                    <td className="text-right text-red-600">-{money(stmt.stripeFees)}</td>

                    <td className="text-right font-bold text-green-600">{money(stmt.netTotal)}</td>
                  </tr>
                ))}

                {data.length === 0 && (
                  <tr>
                    <td colSpan="10" className="text-center py-10 text-gray-400">
                      No statements found
                    </td>
                  </tr>
                )}
              </tbody>

              {summary && (
                <tfoot>
                  <tr className="border-t-2 bg-gray-50 font-bold">
                    <td className="py-4">TOTAL</td>

                    <td className="text-right">{money(summary.subtotal)}</td>

                    <td className="text-right text-blue-600">{money(summary.tax)}</td>

                    <td className="text-right text-blue-600">{money(summary.tips)}</td>

                    <td className="text-right text-blue-600">{money(summary.onlineFees)}</td>

                    <td className="text-right">{money(summary.grossSales)}</td>

                    <td className="text-right text-red-600">-{money(summary.rewardsRedeemed)}</td>

                    <td className="text-right text-red-600">-{money(summary.refunds)}</td>

                    <td className="text-right text-red-600">-{money(summary.stripeFees)}</td>

                    <td className="text-right text-green-600">{money(summary.netTotal)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {pagination && (
          <Pagination pagination={pagination} onPageChange={onPageChange} label="years" />
        )}
      </div>
    );
  }

  /* =====================================================
     SINGLE YEAR → MONTHLY
  ===================================================== */

  return (
    <div className="space-y-6">
      <SummaryCards />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500 border-b">
            <tr>
              <th className="py-2">Month</th>

              <th className="text-right">Subtotal</th>

              <th className="text-right">Tax</th>

              <th className="text-right">Tip</th>

              <th className="text-right">Order Service Fee</th>

              <th className="text-right">Gross Sales</th>

              <th className="text-right">Rewards Redeemed</th>

              <th className="text-right">Refunded Amount</th>

              <th className="text-right">Transaction Fee</th>

              <th className="text-right font-semibold">Net Total</th>

              <th className="text-right">Statement</th>
            </tr>
          </thead>

          <tbody>
            {data.map((stmt) => (
              <tr key={stmt.month} className="border-b hover:bg-gray-50">
                <td className="py-3 font-medium text-gray-800">{formatMonth(stmt.month)}</td>

                <td className="text-right font-medium">{money(stmt.subtotal)}</td>

                <td className="text-right font-medium text-blue-600">{money(stmt.tax)}</td>

                <td className="text-right font-medium text-blue-600">{money(stmt.tips)}</td>

                <td className="text-right font-medium text-blue-600">{money(stmt.onlineFees)}</td>

                <td className="text-right font-medium">{money(stmt.grossSales)}</td>

                <td className="text-right text-red-600">-{money(stmt.rewardsRedeemed)}</td>

                <td className="text-right text-red-600">-{money(stmt.refunds)}</td>

                <td className="text-right text-red-600">-{money(stmt.stripeFees)}</td>

                <td className="text-right font-bold text-green-600">{money(stmt.netTotal)}</td>

                <td className="text-right">
                  <button
                    onClick={() => downloadStatement(stmt.month)}
                    className="text-primary font-semibold hover:underline whitespace-nowrap"
                  >
                    Download PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

          {summary && (
            <tfoot>
              <tr className="border-t-2 bg-gray-50 font-bold">
                <td className="py-4">TOTAL</td>

                <td className="text-right">{money(summary.subtotal)}</td>

                <td className="text-right text-blue-600">{money(summary.tax)}</td>

                <td className="text-right text-blue-600">{money(summary.tips)}</td>

                <td className="text-right text-blue-600">{money(summary.onlineFees)}</td>

                <td className="text-right">{money(summary.grossSales)}</td>

                <td className="text-right text-red-600">-{money(summary.rewardsRedeemed)}</td>

                <td className="text-right text-red-600">-{money(summary.refunds)}</td>

                <td className="text-right text-red-600">-{money(summary.stripeFees)}</td>

                <td className="text-right text-green-600">{money(summary.netTotal)}</td>

                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {pagination && (
        <Pagination pagination={pagination} onPageChange={onPageChange} label="months" />
      )}
    </div>
  );
}

/* =====================================================
   PAGINATION
===================================================== */

function Pagination({ pagination, onPageChange, label }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="text-gray-500">
        Page <span className="font-medium">{pagination.page}</span> of{" "}
        <span className="font-medium">{pagination.totalPages}</span> • {pagination.totalStatements}{" "}
        {label}
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
  );
}
