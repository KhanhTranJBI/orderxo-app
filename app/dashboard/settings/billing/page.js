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
      <div className="mx-auto max-w-6xl">
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
        {result?.status === 200 && Number(result.data.subscription?.platformFeePromotion?.durationDays) > 0 && (() => {
          const offer = result.data.subscription.platformFeePromotion;
          const active = offer.startsAt && offer.endsAt && Date.now() < new Date(offer.endsAt).getTime();
          const pending = !offer.startsAt;
          return (active || pending) ? (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
              <strong>0% Platform Fee — {offer.durationDays}-day promotion</strong>
              <p className="mt-1 text-sm">{pending
                ? "Your promotion starts with your first online checkout. Standard Stripe processing fees still apply."
                : `Promotion ends ${new Date(offer.endsAt).toLocaleDateString("en-US")}. Your normal plan platform fee resumes automatically.`}</p>
            </div>
          ) : null;
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
