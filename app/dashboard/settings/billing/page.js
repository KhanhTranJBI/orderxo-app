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
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard" className="font-semibold text-orange-700">
          ← Dashboard
        </Link>
        <h1 className="mt-6 text-3xl font-bold">Billing & Subscription</h1>
        <p className="mb-7 mt-2 text-slate-600">
          Manage your OrderXO plan, payment method and invoices through Stripe Billing.
        </p>
        {!id ? (
          <p>Select a restaurant from your dashboard.</p>
        ) : result?.status === 200 ? (
          <BillingManager organizationId={id} subscription={result.data.subscription || {}} />
        ) : (
          <p className="rounded-lg bg-red-50 p-4 text-red-800">
            Unable to load subscription. Check organization access and admin API configuration.
          </p>
        )}
      </div>
    </main>
  );
}
