import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendRequest, cookieName } from "../../../../lib/backend";
import StripeConnectManager from "../../../../components/StripeConnectManager";
export const dynamic = "force-dynamic";
export default async function Payments({ searchParams }) {
  if (!cookies().get(cookieName)?.value) redirect("/login");
  const organizationId = searchParams?.organizationId;
  const result = organizationId
    ? await backendRequest(`/api/locations?organizationId=${encodeURIComponent(organizationId)}`, {
        authenticated: true,
      })
    : null;
  if (result?.status === 401) redirect("/login");
  const data = result?.data || {};
  const locations = Array.isArray(data.locations)
    ? data.locations
    : Array.isArray(data.data)
      ? data.data
      : [];
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/dashboard" className="font-semibold text-orange-700">
          ← Dashboard
        </Link>
        <h1 className="text-3xl font-bold">Payments</h1>
        {searchParams?.connect && (
          <p className="rounded-lg border bg-white p-3">
            Stripe connection result: {searchParams.connect}. Check the status below.
          </p>
        )}
        {!organizationId ? (
          <p>Select a restaurant first.</p>
        ) : result?.status !== 200 ? (
          <p>Unable to load locations.</p>
        ) : locations.length === 0 ? (
          <p>No restaurant locations available.</p>
        ) : (
          <StripeConnectManager organizationId={organizationId} locations={locations} />
        )}
      </div>
    </main>
  );
}
