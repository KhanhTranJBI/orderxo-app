"use client";
import { ownerFetch } from "../lib/ownerFetch";
import { useState } from "react";
const plans = [
  { id: "starter", name: "Starter" },
  { id: "growth", name: "Growth" },
  { id: "pro", name: "Pro" },
];
export default function BillingManager({ organizationId, subscription }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function action(path, body, key) {
    setBusy(key);
    setError("");
    try {
      const r = await ownerFetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Billing request failed");
      if (!d.url) throw new Error("Stripe did not return a billing URL");
      window.location.assign(d.url);
    } catch (e) {
      setError(e.message);
      setBusy("");
    }
  }
  const current = subscription?.plan || "starter";
  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </p>
      )}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Current plan</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold capitalize">{current}</h2>
            <p className="mt-1 text-sm">
              Status:{" "}
              <span className="font-semibold capitalize">
                {subscription?.status || "incomplete"}
              </span>
            </p>
          </div>
          {subscription?.stripeCustomerId && (
            <button
              disabled={!!busy}
              onClick={() => action("/api/owner/billing/portal", { organizationId }, "portal")}
              className="rounded-xl border px-4 py-2.5 font-semibold hover:bg-slate-50"
            >
              {busy === "portal" ? "Opening…" : "Manage billing"}
            </button>
          )}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-bold">Choose a plan</h2>
        <p className="mt-1 text-sm text-slate-500">
          Stripe securely handles the payment method, subscription and invoices.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl border bg-white p-5 ${current === plan.id ? "ring-2 ring-orange-500" : ""}`}
            >
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {current === plan.id ? "Current selection" : "Change subscription plan"}
              </p>
              <button
                disabled={!!busy || (current === plan.id && subscription?.status === "active")}
                onClick={() =>
                  action(
                    "/api/owner/billing/checkout",
                    { organizationId, plan: plan.id },
                    `checkout-${plan.id}`,
                  )
                }
                className="mt-5 w-full rounded-xl bg-orange-600 px-4 py-2.5 font-semibold text-white disabled:opacity-50"
              >
                {busy === `checkout-${plan.id}`
                  ? "Opening Stripe…"
                  : current === plan.id && subscription?.status === "active"
                    ? "Active"
                    : "Continue with Stripe"}
              </button>
            </div>
          ))}
        </div>
      </section>
      <p className="text-xs text-slate-500">
        OrderXO does not collect card details on this page. Checkout and billing management open on
        Stripe-hosted pages.
      </p>
    </div>
  );
}
