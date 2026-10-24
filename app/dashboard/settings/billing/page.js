import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendRequest, cookieName } from "../../../../lib/backend";
import BillingManager from "../../../../components/BillingManager";
export const dynamic = "force-dynamic";
export default async function Billing({ searchParams }) {
  if (!cookies().get(cookieName)?.value) redirect("/login");
  const id = searchParams?.organizationId;
  const result = id
    ? await backendRequest(`/api/subscriptions/current?organizationId=${encodeURIComponent(id)}`, {
        authenticated: true,
      })
    : null;
  if (result?.status === 401) redirect("/login");
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-8xl">
        <h1 className="mt-6 text-3xl font-bold">Billing & Subscription</h1>
        {id && (
          <Link
            href={`/dashboard/settings/payments?organizationId=${encodeURIComponent(id)}`}
            className="mt-3 inline-block font-semibold text-orange-700"
          >
            Restaurant Payments / Stripe Connect →
          </Link>
        )}
        <p className="mb-7 mt-2 text-slate-600">
          Manage your OrderXO plan, payment method and invoices through Stripe Billing.
        </p>
        {result?.status === 200 &&
          (() => {
            const subscription = result.data.subscription || {};
            const offer = subscription.platformFeePromotion;
            const standardBps = subscription.pricing?.platformFeeBps ?? 100;
            const now = Date.now();
            const pending =
              Number(offer?.durationMonths || offer?.durationDays) > 0 &&
              !offer?.startsAt &&
              !offer?.cancelledAt;
            const active = Boolean(
              !offer?.cancelledAt &&
              offer?.startsAt &&
              offer?.endsAt &&
              now >= new Date(offer.startsAt).getTime() &&
              now < new Date(offer.endsAt).getTime(),
            );
            const expired = Boolean(
              !offer?.cancelledAt && offer?.endsAt && now >= new Date(offer.endsAt).getTime(),
            );
            const daysLeft = active
              ? Math.max(0, Math.ceil((new Date(offer.endsAt).getTime() - now) / 86400000))
              : 0;
            return (
              <section
                className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                aria-label="Platform fee"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-bold">Platform Fee</h2>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${active ? "bg-green-100 text-green-800" : pending ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}
                  >
                    {active
                      ? "Promotion Active"
                      : pending
                        ? "Promotion Pending"
                        : offer?.cancelledAt
                          ? "Promotion Cancelled"
                          : expired
                            ? "Promotion Ended"
                            : "Standard Rate"}
                  </span>
                </div>
                <div className="mt-4 flex gap-12">
                  <div>
                    <p className="text-sm text-slate-500">Current rate</p>
                    <p className="text-3xl font-bold">
                      {(active ? 0 : standardBps / 100).toLocaleString("en-US")}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Standard rate</p>
                    <p className="text-3xl font-bold">
                      {(standardBps / 100).toLocaleString("en-US")}%
                    </p>
                  </div>
                </div>
                {pending && (
                  <p className="mt-4 text-sm text-amber-800">
                    Your{" "}
                    {offer.durationMonths
                      ? `${offer.durationMonths}-month`
                      : `${offer.durationDays}-day`}{" "}
                    0% promotion is awaiting invitation acceptance. If you have already accepted,
                    please contact OrderXO support.
                  </p>
                )}
                {active && (
                  <p className="mt-4 text-sm text-green-800">
                    Your 0% promotion ends{" "}
                    {new Date(offer.endsAt).toLocaleDateString("en-US", { dateStyle: "long" })} (
                    {daysLeft} days remaining). The standard rate then resumes automatically.
                  </p>
                )}
                {offer?.cancelledAt && (
                  <p className="mt-4 text-sm text-slate-600">
                    Your promotion was cancelled. The standard rate applies.
                  </p>
                )}
                {expired && (
                  <p className="mt-4 text-sm text-slate-600">
                    Your promotion ended {new Date(offer.endsAt).toLocaleDateString("en-US")}. The
                    standard rate applies.
                  </p>
                )}
                <p className="mt-3 text-xs text-slate-500">
                  Applied to food subtotal after discounts, excluding tax, tips and online service
                  fees. Stripe processing fees are separate.
                </p>
              </section>
            );
          })()}
        {!id ? (
          <p>Select a restaurant from your dashboard.</p>
        ) : result?.status === 200 ? (
          <BillingManager
            organizationId={id}
            subscription={result.data.subscription || {}}
            locationBilling={result.data.locationBilling || null}
            initialAddLocation={searchParams?.action === "add-location"}
          />
        ) : (
          <p className="rounded-lg bg-red-50 p-4 text-red-800">
            Unable to load subscription. Check organization access and admin API configuration.
          </p>
        )}
      </div>
    </main>
  );
}
