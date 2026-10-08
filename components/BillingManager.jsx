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
  const [showCancelModal, setShowCancelModal] = useState(false);
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
      {active && (
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Subscription cancellation</h2>
          {subscription?.cancelAtPeriodEnd ? (
            <>
              <p className="mt-2 text-sm text-amber-700">
                Your subscription is scheduled to end on {formatDate(subscription.currentPeriodEnd)}
                . OrderXO will continue working normally until then.
              </p>
              <button
                disabled={!!busy}
                onClick={() => post("/api/owner/billing/resume", { organizationId }, "resume")}
                className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white disabled:opacity-50"
              >
                {busy === "resume" ? "Resuming…" : "Keep subscription"}
              </button>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-slate-600">
                If you no longer use OrderXO, cancel at the end of your current billing period. Your
                restaurant remains active until {formatDate(subscription?.currentPeriodEnd)}.
              </p>
              <button
                disabled={!!busy}
                onClick={() => setShowCancelModal(true)}
                className="mt-4 rounded-xl border border-red-300 px-4 py-2.5 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {busy === "cancel" ? "Scheduling cancellation…" : "Cancel subscription"}
              </button>
            </>
          )}
        </section>
      )}

      <p className="text-xs text-slate-500">
        OrderXO does not collect card details on this page. Payment methods, invoices and billing
        recovery are handled by Stripe.
      </p>

      {showCancelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-subscription-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && busy !== "cancel") setShowCancelModal(false);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-red-600">Subscription cancellation</p>
                <h2
                  id="cancel-subscription-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  Cancel your OrderXO subscription?
                </h2>
              </div>
              <button
                type="button"
                disabled={busy === "cancel"}
                onClick={() => setShowCancelModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                aria-label="Close cancellation dialog"
              >
                ×
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Your subscription will remain active until{" "}
              {formatDate(subscription?.currentPeriodEnd)}. You can continue using OrderXO normally
              until that date.
            </p>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              After the billing period ends, online ordering will be unavailable until you
              reactivate your subscription.
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={busy === "cancel"}
                onClick={() => setShowCancelModal(false)}
                className="rounded-xl border px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Keep subscription
              </button>
              <button
                type="button"
                disabled={busy === "cancel"}
                onClick={() => post("/api/owner/billing/cancel", { organizationId }, "cancel")}
                className="rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busy === "cancel" ? "Scheduling cancellation…" : "Cancel subscription"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
