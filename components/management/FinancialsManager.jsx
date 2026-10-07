"use client";
import { useEffect, useState } from "react";
import LocationPageShell from "./LocationPageShell";
const usd = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0));
export default function FinancialsManager({ organizationId }) {
  return (
    <LocationPageShell
      organizationId={organizationId}
      title="Financials"
      description="Sales, refunds and transaction details for the selected location."
    >
      {({ locationId }) => <Fin organizationId={organizationId} locationId={locationId} />}
    </LocationPageShell>
  );
}
function Fin({ organizationId, locationId }) {
  const [d, setD] = useState({ transactions: [], summary: {} }),
    [err, setErr] = useState("");
  useEffect(() => {
    if (!locationId) return;
    (async () => {
      let r = await fetch(
          `/api/owner/manage/admin/financials/transactions?organizationId=${organizationId}&locationId=${locationId}&limit=50`,
          { cache: "no-store" },
        ),
        x = await r.json();
      if (r.ok) {
        setD(x);
        setErr("");
      } else setErr(x.error || "Unable to load financials");
    })();
  }, [locationId]);
  let s = d.summary || {};
  return (
    <section className="mt-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Gross sales", s.grossSales],
          ["Net after refunds", s.netAfterRefund],
          ["Tips", s.tips],
          ["Refunded", s.refunded],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-slate-500">{k}</p>
            <p className="mt-1 text-2xl font-bold">{usd(v)}</p>
          </div>
        ))}
      </div>
      {err && <p className="mt-4 text-red-600">{err}</p>}
      <div className="mt-6 overflow-x-auto rounded-2xl border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["Order", "Date", "Customer", "Gross", "Refund", "Net"].map((x) => (
                <th key={x} className="p-4">
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(d.transactions || []).map((t) => (
              <tr key={t.orderId} className="border-t">
                <td className="p-4">#{t.orderNumber || String(t.orderId).slice(-6)}</td>
                <td className="p-4">{new Date(t.date).toLocaleString()}</td>
                <td className="p-4">{t.customer}</td>
                <td className="p-4">{usd(t.grossSales)}</td>
                <td className="p-4">{usd(t.refundedAmount)}</td>
                <td className="p-4 font-semibold">{usd(t.netAfterRefund)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
