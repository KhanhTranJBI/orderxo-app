"use client";
import { ownerFetch } from "../lib/ownerFetch";
import { useState } from "react";

const plans = [
  { id: "starter", name: "Starter", rank: 0 },
  { id: "growth", name: "Growth", rank: 1 },
  { id: "pro", name: "Pro", rank: 2 },
];
const rank = Object.fromEntries(plans.map((p) => [p.id, p.rank]));
const activeStatuses = new Set(["active", "trialing"]);

export default function BillingManager({ organizationId, subscription }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const current = subscription?.plan || "starter";
  const active = activeStatuses.has(subscription?.status);
  const pending = subscription?.pendingPlan;

  async function post(path, body, key, expectUrl = false) {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      const r = await ownerFetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Billing request failed");
      if (expectUrl) {
        if (!d.url) throw new Error("Stripe did not return a billing URL");
        window.location.assign(d.url);
        return;
      }
      setNotice(d.message || "Subscription updated.");
      setBusy("");
      window.setTimeout(() => window.location.reload(), 700);
    } catch (e) {
      setError(e.message);
      setBusy("");
    }
  }

  const formatDate = (value) =>
    value
      ? new Date(value).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "the end of your billing period";

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {notice}
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
            {pending && (
              <p className="mt-2 text-sm font-medium text-amber-700">
                Scheduled change: {plans.find((p) => p.id === pending)?.name || pending} on{" "}
                {formatDate(subscription.pendingPlanEffectiveAt)}
              </p>
            )}
          </div>
          {subscription?.stripeCustomerId && (
            <button
              disabled={!!busy}
              onClick={() => post("/api/owner/billing/portal", { organizationId }, "portal", true)}
              className="rounded-xl border px-4 py-2.5 font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              {busy === "portal"
                ? "Opening…"
                : subscription?.status === "past_due"
                  ? "Fix billing"
                  : "Manage billing"}
            </button>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold">Choose a plan</h2>
        <p className="mt-1 text-sm text-slate-500">
          {active
            ? "Upgrades apply now with Stripe proration. Downgrades take effect at the end of the current billing period."
            : "Choose a plan to start your Stripe subscription."}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = current === plan.id;
            const isPending = pending === plan.id;
            const upgrade = rank[plan.id] > rank[current];
            const label = !active
              ? "Continue with Stripe"
              : isCurrent
                ? "Current plan"
                : isPending
                  ? "Downgrade scheduled"
                  : upgrade
                    ? `Upgrade to ${plan.name}`
                    : `Downgrade to ${plan.name}`;
            const disabled = !!busy || (active && (isCurrent || isPending));
            return (
              <div
                key={plan.id}
                className={`rounded-2xl border bg-white p-5 ${isCurrent ? "ring-2 ring-orange-500" : ""}`}
              >
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {isCurrent
                    ? "Current plan"
                    : isPending
                      ? `Starts ${formatDate(subscription.pendingPlanEffectiveAt)}`
                      : active
                        ? upgrade
                          ? "Upgrade immediately"
                          : "Change next billing period"
                        : "Start subscription"}
                </p>
                <button
                  disabled={disabled}
                  onClick={() =>
                    active
                      ? post(
                          "/api/owner/billing/change-plan",
                          { organizationId, plan: plan.id },
                          `change-${plan.id}`,
                        )
                      : post(
                          "/api/owner/billing/checkout",
                          { organizationId, plan: plan.id },
                          `checkout-${plan.id}`,
                          true,
                        )
                  }
                  className={`mt-5 w-full rounded-xl px-4 py-2.5 font-semibold disabled:opacity-50 ${isCurrent ? "border bg-white text-slate-700" : "bg-orange-600 text-white hover:bg-orange-700"}`}
                >
                  {busy === `change-${plan.id}`
                    ? "Updating…"
                    : busy === `checkout-${plan.id}`
                      ? "Opening Stripe…"
                      : label}
                </button>
              </div>
            );
          })}
        </div>
      </section>
      <p className="text-xs text-slate-500">
        OrderXO does not collect card details on this page. Payment methods, invoices and billing
        recovery are handled by Stripe.
      </p>
    </div>
  );
}
