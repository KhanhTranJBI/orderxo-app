"use client";
import { ownerFetch } from "../lib/ownerFetch";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const plans = [
  { id: "starter", name: "Starter", rank: 0 },
  { id: "growth", name: "Growth", rank: 1 },
  { id: "pro", name: "Pro", rank: 2 },
];
const rank = Object.fromEntries(plans.map((p) => [p.id, p.rank]));
const activeStatuses = new Set(["active", "trialing"]);

export default function BillingManager({
  organizationId,
  subscription,
  locationBilling,
  initialAddLocation = false,
}) {
  const router = useRouter();
  const [plus, setPlus] = useState(null);
  const [plusBusy, setPlusBusy] = useState(false);
  const [confirmPlusCancel, setConfirmPlusCancel] = useState(false);
  const loadPlus = useCallback(async () => {
    try {
      const r = await ownerFetch(`/api/owner/domains/billing?organizationId=${encodeURIComponent(organizationId)}`, { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Unable to load Website Plus");
      setPlus(d);
    } catch (e) { toast.error(e.message); }
  }, [organizationId]);
  useEffect(() => { loadPlus(); }, [loadPlus]);
  async function plusAction(method) {
    setPlusBusy(true);
    try {
      const r = await ownerFetch("/api/owner/domains/billing", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Unable to update Website Plus");
      if (method === "POST") { if (!d.url) throw new Error("Checkout URL unavailable"); window.location.assign(d.url); return; }
      setConfirmPlusCancel(false);
      await loadPlus();
      toast.success(method === "PATCH" ? "Website Plus will renew normally" : "Website Plus will end at the billing period end");
    } catch (e) { toast.error(e.message); } finally { setPlusBusy(false); }
  }
  const [billingSnapshot, setBillingSnapshot] = useState(null);
  const billing = billingSnapshot || locationBilling;
  const [busy, setBusy] = useState("");
  const [error, setErrorState] = useState("");
  const setError = (value) => {
    setErrorState(value);
    if (typeof value === "string" && value.trim()) toast.error(value);
  };
  const [notice, setNoticeState] = useState("");
  const setNotice = (value) => {
    setNoticeState(value);
    if (typeof value === "string" && value.trim()) toast.info(value);
  };
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [confirmPlan, setConfirmPlan] = useState(null);
  const [newLocationName, setNewLocationName] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(initialAddLocation);
  const usd = (cents) =>
    (Number(cents || 0) / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  async function addLocation() {
    if (!newLocationName.trim()) {
      setError("Enter a location name.");
      return;
    }
    await post(
      "/api/owner/locations",
      { organizationId, name: newLocationName.trim() },
      "add-location",
    );
  }
  const current = subscription?.plan || "starter";
  const active = activeStatuses.has(subscription?.status);
  const pending = subscription?.pendingPlan;
  const isTrialing = subscription?.status === "trialing";
  const trialEnd = subscription?.trialEnd;
  const trialDaysRemaining = subscription?.trialDaysRemaining;
  const trialOfferDays = !active && Number(subscription?.trialOffer?.days || 0);
  const hasTrialOffer = trialOfferDays > 0;

  const monthlyPrices = { starter: 2900, growth: 6900, pro: 12900 };
  const count = Math.max(1, Number(billing?.locationCount) || 1);
  const estimatedMonthly = (planId) => {
    const base = monthlyPrices[planId];
    return base + Math.round(base * 0.8) * (count - 1);
  };
  const currentMonthly =
    billing?.monthlyTotalCents != null
      ? Number(billing.monthlyTotalCents)
      : estimatedMonthly(current);
  const targetMonthly = confirmPlan ? estimatedMonthly(confirmPlan.id) : 0;
  const upgradeDelta = targetMonthly - currentMonthly;
  const closePlanModal = () => {
    if (!busy) setConfirmPlan(null);
  };
  const confirmPlanChange = async () => {
    if (!confirmPlan || busy) return;
    const selected = confirmPlan;
    setConfirmPlan(null);
    await post(
      "/api/owner/billing/change-plan",
      { organizationId, plan: selected.id },
      `change-${selected.id}`,
    );
  };

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
      toast.success(
        key === "add-location"
          ? "Location added and billing updated."
          : d.message || "Subscription updated.",
      );
      if (key === "add-location") {
        // Update the billing summary immediately while Next.js refreshes server data.
        setBillingSnapshot((previous) => {
          const source = previous || locationBilling;
          if (!source) return previous;
          const nextCount = Math.max(1, Number(source.locationCount || 1)) + 1;
          return {
            ...source,
            locationCount: nextCount,
            monthlyTotalCents:
              Number(source.baseMonthlyCents || 0) +
              (nextCount - 1) * Number(source.additionalMonthlyCents || 0),
          };
        });
        setShowLocationModal(false);
        setNewLocationName("");
        // The workspace opens this modal through ?action=add-location.
        // Remove the one-time intent before refreshing, or it opens again.
        const url = new URL(window.location.href);
        if (url.searchParams.get("action") === "add-location") {
          url.searchParams.delete("action");
          window.history.replaceState(window.history.state, "", url.toString());
        }
      }
      setBusy("");
      // Re-fetch server component data without a full browser reload.
      router.refresh();
    } catch (e) {
      setError(e.message);
      toast.error(e.message || "Billing request failed");
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
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Current plan</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold capitalize">{current}</h2>
            <p className="mt-1 text-sm">
              Status:{" "}
              <span className="font-semibold capitalize">
                {subscription?.status === "trialing"
                  ? "Free Trial"
                  : subscription?.status || "incomplete"}
              </span>
            </p>
            {hasTrialOffer && (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                <p className="font-bold text-base">Your {trialOfferDays}-day free trial is ready</p>
                <p className="mt-1">
                  Continue with Stripe to add your payment method and activate your free trial. Your
                  trial begins when Stripe creates your subscription, not when you accepted the
                  invitation.
                </p>
                <p className="mt-2">
                  Subscription fee during trial: <strong>$0.00</strong>. After the trial, your
                  estimated subscription is <strong>{usd(currentMonthly)}/month</strong>
                  unless canceled or changed. OrderXO platform fees and Stripe processing fees are
                  separate.
                </p>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() =>
                    post(
                      "/api/owner/billing/checkout",
                      { organizationId, plan: current },
                      `checkout-${current}`,
                      true,
                    )
                  }
                  className="mt-3 rounded-xl bg-orange-600 px-4 py-2.5 font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  {busy === `checkout-${current}`
                    ? "Opening Stripe…"
                    : `Continue with Stripe — Start ${trialOfferDays}-day free trial`}
                </button>
              </div>
            )}
            {isTrialing && (
              <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-900">
                <p className="font-semibold">Free trial — $0.00 subscription fee during trial</p>
                {trialEnd ? (
                  <>
                    <p className="mt-1">
                      Trial ends: <strong>{formatDate(trialEnd)}</strong>
                    </p>
                    <p>
                      {trialDaysRemaining != null
                        ? `${trialDaysRemaining} day${trialDaysRemaining === 1 ? "" : "s"} remaining`
                        : "Remaining days unavailable"}
                    </p>
                    <p>
                      Regular subscription billing resumes after the trial, subject to Stripe
                      billing settings.
                    </p>
                  </>
                ) : (
                  <p className="mt-1">
                    Trial end date unavailable. Check Stripe Billing for the confirmed date.
                  </p>
                )}
                <p className="mt-1 text-xs">
                  Platform fees and payment processing fees are separate.
                </p>
              </div>
            )}
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

      {billing && (
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Multi-location billing</h2>
          <p className="mt-2 text-sm text-slate-600">
            One plan for all locations. The first location pays full price; every additional
            location gets 20% off its subscription fee.
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>First location</span>
              <strong>
                {isTrialing
                  ? usd(0)
                  : billing.baseMonthlyCents == null
                    ? "See Stripe Billing"
                    : usd(billing.baseMonthlyCents)}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>
                {Math.max(0, billing.locationCount - 1)} additional locations (20% off each)
              </span>
              <strong>
                {isTrialing
                  ? usd(0)
                  : billing.additionalMonthlyCents == null
                    ? "See Stripe Billing"
                    : usd(Math.max(0, billing.locationCount - 1) * billing.additionalMonthlyCents)}
              </strong>
            </div>
            <div className="flex justify-between border-t pt-3 text-base">
              <strong>
                {isTrialing ? "Subscription during free trial" : "Estimated monthly subscription"}
              </strong>
              <strong className={isTrialing ? "text-green-700" : ""}>
                {isTrialing
                  ? usd(0)
                  : billing.monthlyTotalCents == null
                    ? "See Stripe Billing"
                    : usd(billing.monthlyTotalCents)}
              </strong>
            </div>
          </div>
          {hasTrialOffer && (
            <p className="mt-3 text-sm font-medium text-emerald-700">
              {trialOfferDays}-day free trial available — $0 subscription fee during the trial after
              Stripe activation.
            </p>
          )}
          {isTrialing && (
            <div className="mt-3 flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span>Regular monthly subscription after trial</span>
              <strong>
                {billing.monthlyTotalCents == null
                  ? "Check Stripe Billing"
                  : usd(billing.monthlyTotalCents)}
              </strong>
            </div>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Plus the 1% OrderXO platform fee on eligible food sales. Stripe payment processing fees
            are separate. Changes during a billing period may include prorations.
          </p>
          <button
            type="button"
            disabled={!active || !!busy || !!pending}
            onClick={() => setShowLocationModal(true)}
            className="mt-4 rounded-xl bg-orange-600 px-4 py-2.5 font-semibold text-white disabled:opacity-50"
          >
            Add a location
          </button>
        </section>
      )}
      {showLocationModal && billing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowLocationModal(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-location-title"
          >
            <h3 id="add-location-title" className="text-xl font-bold">
              Add restaurant location
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {isTrialing
                ? "Regular monthly subscription pricing will increase by "
                : "Your subscription will increase by "}
              <strong>{usd(billing.additionalMonthlyCents)}/month</strong> plus applicable
              prorations.{" "}
              {isTrialing
                ? "During a free trial, confirm any immediate charges with Stripe before proceeding."
                : "Stripe may invoice the change immediately."}
            </p>
            <label htmlFor="new-location-name" className="mt-4 block text-sm font-medium">
              Location name
            </label>
            <input
              id="new-location-name"
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              maxLength={120}
              className="mt-1 w-full rounded-xl border p-3"
              placeholder="e.g. Poulsbo"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="rounded-xl border px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addLocation}
                disabled={!newLocationName.trim()}
                className="rounded-xl bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
              >
                Confirm and Bill
              </button>
            </div>
          </div>
        </div>
      )}
      <section>
        <h2 className="text-xl font-bold">Choose a plan</h2>
        <p className="mt-1 text-sm text-slate-500">
          {active
            ? "Upgrades apply now with Stripe proration. Downgrades take effect at the end of the current billing period."
            : hasTrialOffer
              ? `Your invitation includes a ${trialOfferDays}-day free trial. Continue with Stripe to activate it.`
              : "Choose a plan to start your Stripe subscription."}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = current === plan.id;
            const isPending = pending === plan.id;
            const upgrade = rank[plan.id] > rank[current];
            const label = !active
              ? isCurrent
                ? "Complete setup with Stripe"
                : `Choose ${plan.name}`
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
                        : isCurrent
                          ? "Complete subscription setup"
                          : `Select ${plan.name} subscription`}
                </p>
                <button
                  disabled={disabled}
                  onClick={() => {
                    if (active) setConfirmPlan(plan);
                    else
                      post(
                        "/api/owner/billing/checkout",
                        { organizationId, plan: plan.id },
                        `checkout-${plan.id}`,
                        true,
                      );
                  }}
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
      {confirmPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closePlanModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-confirm-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-orange-600">Subscription change</p>
                <h3 id="plan-confirm-title" className="mt-1 text-xl font-bold">
                  {rank[confirmPlan.id] > rank[current] ? "Upgrade" : "Downgrade"} to{" "}
                  {confirmPlan.name}?
                </h3>
              </div>
              <button
                type="button"
                onClick={closePlanModal}
                aria-label="Close dialog"
                className="rounded-full px-2 text-2xl text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              This plan applies to all {count} restaurant {count === 1 ? "location" : "locations"}{" "}
              in your organization.
            </p>
            <div className="mt-5 space-y-3 rounded-xl border bg-slate-50 p-4 text-sm">
              <div className="flex justify-between gap-3">
                <span>
                  Current {plans.find((p) => p.id === current)?.name || current} regular monthly fee
                </span>
                <strong>{usd(currentMonthly)}</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span>New {confirmPlan.name} regular monthly fee</span>
                <strong>{usd(targetMonthly)}</strong>
              </div>
              <div className="flex justify-between gap-3 border-t pt-3">
                <span>{isTrialing ? "Monthly difference after trial" : "Monthly difference"}</span>
                <strong className={upgradeDelta > 0 ? "text-orange-600" : "text-green-700"}>
                  {upgradeDelta > 0 ? "+" : upgradeDelta < 0 ? "−" : ""}
                  {usd(Math.abs(upgradeDelta))}
                </strong>
              </div>
            </div>
            {isTrialing && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-900">
                <p className="font-semibold">Free trial: $0.00 subscription fee during trial</p>
                <p className="mt-1">
                  Trial ends:{" "}
                  {trialEnd ? formatDate(trialEnd) : "Date unavailable — verify in Stripe"}
                </p>
                {trialDaysRemaining != null && <p>{trialDaysRemaining} days remaining</p>}
                <p className="mt-1">
                  Regular monthly fees below apply after your free trial. The 1% platform fee
                  continues during the trial.
                </p>
              </div>
            )}
            {rank[confirmPlan.id] > rank[current] ? (
              <p className="mt-4 text-sm text-slate-600">
                {isTrialing
                  ? "Pro features become available immediately. Your Stripe trial end date stays unchanged and subscription proration is disabled for this change."
                  : "Your upgrade will be requested immediately. Stripe may calculate a prorated charge for the remainder of the billing period. The exact amount due today depends on Stripe billing; this confirmation is not a payment receipt."}
              </p>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                {isTrialing
                  ? "Your downgrade will be scheduled for the end of your free trial. You keep your current plan features until then."
                  : "Your downgrade will be scheduled for the end of your current billing period. No immediate refund is promised."}
              </p>
            )}
            <p className="mt-3 text-xs text-slate-500">
              Prices exclude the 1% OrderXO platform fee, payment processing fees, and applicable
              taxes.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closePlanModal}
                className="rounded-xl border px-4 py-2.5 font-semibold"
              >
                Keep current plan
              </button>
              <button
                type="button"
                onClick={confirmPlanChange}
                className="rounded-xl bg-orange-600 px-4 py-2.5 font-semibold text-white hover:bg-orange-700"
              >
                Confirm {rank[confirmPlan.id] > rank[current] ? "upgrade" : "downgrade"}
              </button>
            </div>
          </div>
        </div>
      )}
      <section id="website-plus" className="rounded-2xl border bg-white p-6 shadow-sm scroll-mt-24">
        <h2 className="text-lg font-bold">Website Plus</h2>
        <p className="mt-2 text-sm text-slate-600">Custom domain and image uploads with 100 MB storage · $5/month when purchased separately.</p>
        <p className="mt-3 font-medium">{plus?.included ? "Included with your restaurant plan" : plus?.cancelAtPeriodEnd ? "Cancellation scheduled" : plus?.entitled ? "Active" : "Not subscribed"}</p>
        {plus?.cancelAtPeriodEnd && <p className="mt-2 text-sm text-amber-700">Your benefits remain active until {plus.currentPeriodEnd ? new Date(plus.currentPeriodEnd).toLocaleDateString() : "the end of the billing period"}.</p>}
        <div className="mt-4 flex flex-wrap gap-3">
          {!plus?.included && !plus?.entitled && plus?.price && <button disabled={plusBusy} onClick={() => plusAction("POST")} className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Upgrade to Website Plus</button>}
          {!plus?.included && plus?.entitled && !plus?.cancelAtPeriodEnd && <button disabled={plusBusy} onClick={() => setConfirmPlusCancel(true)} className="rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">Cancel Website Plus</button>}
          {!plus?.included && plus?.cancelAtPeriodEnd && <button disabled={plusBusy} onClick={() => plusAction("PATCH")} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Resume Website Plus</button>}
          <a href={`/dashboard/settings/domains?organizationId=${encodeURIComponent(organizationId)}`} className="rounded-xl border px-4 py-2 text-sm font-semibold">Manage domain &amp; storage</a>
        </div>
      </section>
      {confirmPlusCancel && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation">
        <div role="dialog" aria-modal="true" aria-labelledby="plus-cancel-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
          <h3 id="plus-cancel-title" className="text-xl font-bold">Cancel Website Plus?</h3>
          <p className="mt-3 text-sm text-slate-600">Website Plus remains active until {plus?.currentPeriodEnd ? new Date(plus.currentPeriodEnd).toLocaleDateString() : "your current billing period ends"}. After that, your custom domain and new image uploads will require an eligible plan. Existing images are not deleted immediately. Your free OrderXO address remains available.</p>
          <div className="mt-6 flex justify-end gap-3">
            <button disabled={plusBusy} onClick={() => setConfirmPlusCancel(false)} className="rounded-xl border px-4 py-2 font-semibold">Keep Website Plus</button>
            <button disabled={plusBusy} onClick={() => plusAction("DELETE")} className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{plusBusy ? "Cancelling…" : "Confirm cancellation"}</button>
          </div>
        </div>
      </div>}
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
