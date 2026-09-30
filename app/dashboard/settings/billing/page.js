import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendRequest, cookieName } from "../../../../lib/backend";
export default async function Billing({ searchParams }) {
  if (!cookies().get(cookieName)) redirect("/login");
  const id = searchParams?.organizationId;
  const result = id
    ? await backendRequest(`/api/subscriptions/current?organizationId=${encodeURIComponent(id)}`, {
        authenticated: true,
      })
    : null;
  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link href="/dashboard" className="text-orange-700">
        ← Dashboard
      </Link>
      <h1 className="my-6 text-3xl font-bold">Billing & Subscription</h1>
      {!id ? (
        <p>Select a restaurant from your dashboard.</p>
      ) : result?.status === 200 ? (
        <div className="rounded-xl border p-6">
          <p className="text-sm text-slate-500">Current plan</p>
          <h2 className="text-2xl font-bold capitalize">{result.data.subscription?.plan}</h2>
          <p className="mt-2">Status: {result.data.subscription?.status}</p>
          <p className="mt-5 rounded-lg bg-amber-50 p-4 text-amber-900">
            Plan changes, payment methods and invoices will be available after Stripe Billing is
            connected to admin-api. No payment has been collected by this page.
          </p>
        </div>
      ) : (
        <p className="rounded-lg bg-red-50 p-4">
          Unable to load subscription. Check organization access and admin API configuration.
        </p>
      )}
    </main>
  );
}
