"use client";
import { ownerFetch } from "../../lib/ownerFetch";
import { useEffect, useState } from "react";
import LocationPageShell from "./LocationPageShell";
const usd = (n) => Number(n || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
const monthLabel = (m) => {
  const [y, mo] = String(m).split("-");
  return new Date(+y, +mo - 1).toLocaleString("en-US", { month: "long", year: "numeric" });
};
export default function FinancialsManager({ organizationId }) {
  return (
    <LocationPageShell
      organizationId={organizationId}
      title="Financials"
      description="Monthly statements for the selected location."
    >
      {({ locationId }) => <Fin organizationId={organizationId} locationId={locationId} />}
    </LocationPageShell>
  );
}
function Fin({ organizationId, locationId }) {
  const yearNow = new Date().getFullYear(),
    [year, setYear] = useState(String(yearNow)),
    [d, setD] = useState({ statements: [], summary: {}, pagination: {} }),
    [err, setErr] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!locationId) return;
    (async () => {
      setLoading(true);
      const r = await ownerFetch(
          `/api/owner/manage/admin/financials/statements?organizationId=${organizationId}&locationId=${locationId}&year=${year}&limit=24`,
          { cache: "no-store" },
        ),
        x = await r.json();
      r.ok ? (setD(x), setErr("")) : setErr(x.error || "Unable to load financials");
      setLoading(false);
    })();
  }, [organizationId, locationId, year]);
  // Use the same cent-precise totals for summary cards and the TOTAL row.
  // The API summary can be rounded independently; never mix it with monthly totals.
  const statementRows = d.statements || [];
  const totalFields = [
    "subtotal",
    "tax",
    "tips",
    "onlineFees",
    "grossSales",
    "rewardsRedeemed",
    "refunds",
    "stripeFees",
    "netTotal",
  ];
  const totals = Object.fromEntries(
    totalFields.map((field) => [
      field,
      statementRows.reduce((sum, row) => sum + Math.round(Number(row[field] || 0) * 100), 0) / 100,
    ]),
  );
  const download = async (month) => {
    const r = await ownerFetch(
      `/api/owner/financials/statement-download?organizationId=${organizationId}&locationId=${locationId}&month=${month}`,
    );
    if (!r.ok) {
      const x = await r.json().catch(() => ({}));
      return setErr(x.error || "Unable to download statement");
    }
    const blob = await r.blob(),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `Statement-${month}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="mt-8">
      <div className="mb-8 flex items-center gap-4">
        <label className="text-xl font-bold text-slate-700">Year</label>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="rounded-xl border bg-white px-5 py-3 text-xl shadow-sm"
        >
          {Array.from({ length: Math.max(1, yearNow - 2024 + 1) }, (_, i) => yearNow - i).map(
            (y) => (
              <option key={y}>{y}</option>
            ),
          )}
        </select>
      </div>
      {err && <p className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">{err}</p>}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Gross Sales", totals.grossSales],
            ["Rewards", totals.rewardsRedeemed, "red"],
            ["Refunds", totals.refunds, "red"],
            ["Transaction Fees", totals.stripeFees, "red"],
            ["Net Total", totals.netTotal, "green"],
          ].map(([k, v, t]) => (
            <div
              key={k}
              className={`rounded-2xl border p-5 ${t === "green" ? "border-green-200 bg-green-50" : "bg-slate-50"}`}
            >
              <p className="text-slate-500">{k}</p>
              <p
                className={`mt-2 text-2xl font-bold ${t === "green" ? "text-green-600" : t === "red" ? "text-red-600" : "text-slate-900"}`}
              >
                {t === "red" ? "-" : ""}
                {usd(v)}
              </p>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1300px] w-full text-left">
            <thead className="border-b text-slate-500">
              <tr>
                {[
                  "Month",
                  "Subtotal",
                  "Tax",
                  "Tip",
                  "Order Service Fee",
                  "Gross Sales",
                  "Rewards Redeemed",
                  "Refunded Amount",
                  "Transaction Fee",
                  "Net Total",
                  "Statement",
                ].map((x) => (
                  <th key={x} className="px-3 py-3 font-bold">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading &&
                statementRows.map((x) => (
                  <tr key={x.month} className="border-b">
                    <td className="px-3 py-4 font-bold">{monthLabel(x.month)}</td>
                    <td className="px-3 py-4 font-semibold">{usd(x.subtotal)}</td>
                    <td className="px-3 py-4 font-semibold text-blue-600">{usd(x.tax)}</td>
                    <td className="px-3 py-4 font-semibold text-blue-600">{usd(x.tips)}</td>
                    <td className="px-3 py-4 font-semibold text-blue-600">{usd(x.onlineFees)}</td>
                    <td className="px-3 py-4 font-bold">{usd(x.grossSales)}</td>
                    <td className="px-3 py-4 text-red-600">-{usd(x.rewardsRedeemed)}</td>
                    <td className="px-3 py-4 text-red-600">-{usd(x.refunds)}</td>
                    <td className="px-3 py-4 text-red-600">-{usd(x.stripeFees)}</td>
                    <td className="px-3 py-4 font-bold text-green-600">{usd(x.netTotal)}</td>
                    <td className="px-3 py-4">
                      <button
                        onClick={() => download(x.month)}
                        className="whitespace-nowrap font-bold text-orange-600 hover:text-orange-700"
                      >
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
            {!loading && statementRows.length > 0 && (
              <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                <tr>
                  <td className="px-3 py-4">TOTAL</td>
                  <td className="px-3 py-4">{usd(totals.subtotal)}</td>
                  <td className="px-3 py-4 text-blue-600">{usd(totals.tax)}</td>
                  <td className="px-3 py-4 text-blue-600">{usd(totals.tips)}</td>
                  <td className="px-3 py-4 text-blue-600">{usd(totals.onlineFees)}</td>
                  <td className="px-3 py-4">{usd(totals.grossSales)}</td>
                  <td className="px-3 py-4 text-red-600">-{usd(totals.rewardsRedeemed)}</td>
                  <td className="px-3 py-4 text-red-600">-{usd(totals.refunds)}</td>
                  <td className="px-3 py-4 text-red-600">-{usd(totals.stripeFees)}</td>
                  <td className="px-3 py-4 text-green-600">{usd(totals.netTotal)}</td>
                  <td className="px-3 py-4" />
                </tr>
              </tfoot>
            )}
          </table>
          {loading && (
            <div className="space-y-3 py-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-slate-100" />
              ))}
            </div>
          )}
          {!loading && !d.statements?.length && (
            <p className="py-10 text-center text-slate-500">No statements found</p>
          )}
        </div>
      </div>
    </section>
  );
}
