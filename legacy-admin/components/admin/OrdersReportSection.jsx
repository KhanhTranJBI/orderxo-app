"use client";

import { Loader2 } from "lucide-react";

export default function OrdersReportSection({ report, loading }) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  const dailyReports = report?.dailyReports ?? [];

  const totals = dailyReports.reduce(
    (acc, d) => ({
      orderCount: acc.orderCount + Number(d.orderCount || 0),
      subtotal: acc.subtotal + Number(d.subtotal || 0),
      promoDiscount: acc.promoDiscount + Number(d.promoDiscount || 0),
      tax: acc.tax + Number(d.tax || 0),
      tip: acc.tip + Number(d.tip || 0),
      onlineOrderingFee: acc.onlineOrderingFee + Number(d.onlineOrderingFee || 0),
      grossSales: acc.grossSales + Number(d.grossSales || 0),
      rewardsRedeemed: acc.rewardsRedeemed + Number(d.rewardsRedeemed || 0),
      refunded: acc.refunded + Number(d.refunded || 0),
      transactionFee: acc.transactionFee + Number(d.transactionFee || 0),
      netTotal: acc.netTotal + Number(d.netTotal || 0),
    }),
    {
      orderCount: 0,
      subtotal: 0,
      promoDiscount: 0,
      tax: 0,
      tip: 0,
      onlineOrderingFee: 0,
      grossSales: 0,
      rewardsRedeemed: 0,
      refunded: 0,
      transactionFee: 0,
      netTotal: 0,
    },
  );

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100 text-gray-600 text-left">
            <th className="px-4 py-3 whitespace-nowrap">Date</th>

            <th className="px-4 py-3 text-right whitespace-nowrap">Orders</th>

            <th className="px-4 py-3 text-right whitespace-nowrap">Subtotal</th>

            <th className="px-4 py-3 text-right whitespace-nowrap">Tax</th>

            <th className="px-4 py-3 text-right whitespace-nowrap">Tip</th>

            <th className="px-4 py-3 text-right whitespace-nowrap">Order Service Fee</th>

            <th className="px-4 py-3 text-right whitespace-nowrap">Gross Sales</th>

            <th className="px-4 py-3 text-right whitespace-nowrap">Rewards Redeemed</th>

            {/* 🎟️ Promotion */}
            <th className="px-4 py-3 text-right whitespace-nowrap">Promotion Discount</th>

            <th className="px-4 py-3 text-right whitespace-nowrap">Refunded Amount</th>

            <th className="px-4 py-3 text-right whitespace-nowrap">Transaction Fee</th>

            <th className="px-4 py-3 text-right whitespace-nowrap">Net Total</th>
          </tr>
        </thead>

        <tbody>
          {[...dailyReports].reverse().map((day, i) => {
            const isToday = i === 0;

            const promoDiscount = Number(day.promoDiscount || 0);

            return (
              <tr
                key={day.date}
                className={`border-t transition-colors ${
                  isToday ? "bg-black text-white font-semibold" : "hover:bg-gray-50 text-gray-800"
                }`}
              >
                {/* Date */}
                <td className="px-3 py-2 whitespace-nowrap">{day.date}</td>

                {/* Orders */}
                <td className="px-3 py-2 text-right">{day.orderCount}</td>

                {/* Subtotal */}
                <td className="px-3 py-2 text-right">${Number(day.subtotal || 0).toFixed(2)}</td>

                {/* Tax */}
                <td
                  className={`px-3 py-2 text-right ${isToday ? "text-blue-300" : "text-blue-600"}`}
                >
                  ${Number(day.tax || 0).toFixed(2)}
                </td>

                {/* Tip */}
                <td
                  className={`px-3 py-2 text-right ${isToday ? "text-blue-300" : "text-blue-600"}`}
                >
                  ${Number(day.tip || 0).toFixed(2)}
                </td>

                {/* Service Fee */}
                <td
                  className={`px-3 py-2 text-right ${isToday ? "text-blue-300" : "text-blue-600"}`}
                >
                  ${Number(day.onlineOrderingFee || 0).toFixed(2)}
                </td>

                {/* Gross Sales */}
                <td className="px-3 py-2 text-right">${Number(day.grossSales || 0).toFixed(2)}</td>

                {/* Rewards */}
                <td className={`px-3 py-2 text-right ${isToday ? "text-red-400" : "text-red-600"}`}>
                  -$
                  {Number(day.rewardsRedeemed || 0).toFixed(2)}
                </td>

                {/* 🎟️ Promotion Discount */}
                <td className={`px-3 py-2 text-right ${isToday ? "text-red-400" : "text-red-600"}`}>
                  {promoDiscount > 0 ? `-$${promoDiscount.toFixed(2)}` : "—"}
                </td>

                {/* Refunded */}
                <td className={`px-3 py-2 text-right ${isToday ? "text-red-400" : "text-red-600"}`}>
                  -$
                  {Number(day.refunded || 0).toFixed(2)}
                </td>

                {/* Transaction Fee */}
                <td className={`px-3 py-2 text-right ${isToday ? "text-red-400" : "text-red-600"}`}>
                  -$
                  {Number(day.transactionFee || 0).toFixed(2)}
                </td>

                {/* Net */}
                <td
                  className={`px-3 py-2 text-right font-bold ${
                    isToday ? "text-green-400" : "text-green-600"
                  }`}
                >
                  ${Number(day.netTotal || 0).toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>

        {/* Month totals */}
        {dailyReports.length > 0 && (
          <tfoot>
            <tr className="bg-gray-900 text-white font-bold border-t-2 border-gray-600">
              <td className="px-3 py-3">Month Total</td>

              <td className="px-3 py-3 text-right">{totals.orderCount}</td>

              <td className="px-3 py-3 text-right">${totals.subtotal.toFixed(2)}</td>

              <td className="px-3 py-3 text-right text-blue-300">${totals.tax.toFixed(2)}</td>

              <td className="px-3 py-3 text-right text-blue-300">${totals.tip.toFixed(2)}</td>

              <td className="px-3 py-3 text-right text-blue-300">
                ${totals.onlineOrderingFee.toFixed(2)}
              </td>

              <td className="px-3 py-3 text-right">${totals.grossSales.toFixed(2)}</td>

              <td className="px-3 py-3 text-right text-red-400">
                -${totals.rewardsRedeemed.toFixed(2)}
              </td>

              {/* 🎟️ Promotion */}
              <td className="px-3 py-3 text-right text-red-400">
                {totals.promoDiscount > 0 ? `-$${totals.promoDiscount.toFixed(2)}` : "—"}
              </td>

              <td className="px-3 py-3 text-right text-red-400">-${totals.refunded.toFixed(2)}</td>

              <td className="px-3 py-3 text-right text-red-400">
                -${totals.transactionFee.toFixed(2)}
              </td>

              <td className="px-3 py-3 text-right text-green-400">${totals.netTotal.toFixed(2)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
