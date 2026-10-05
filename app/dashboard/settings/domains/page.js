import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendRequest, cookieName } from "../../../../lib/backend";
import DomainsManager from "../../../../components/DomainsManager";
export const dynamic = "force-dynamic";
export default async function DomainsPage({ searchParams }) {
  if (!cookies().get(cookieName)?.value) redirect("/login");
  const organizationId = searchParams?.organizationId;
  if (!organizationId)
    return (
      <main className="mx-auto max-w-3xl p-8">
        <Link href="/dashboard" className="text-orange-700">
          ← Dashboard
        </Link>
        <h1 className="my-5 text-3xl font-bold">Websites & domains</h1>
        <p>Select a restaurant from your dashboard.</p>
      </main>
    );
  const [orgs, locs] = await Promise.all([
    backendRequest("/api/organizations", { authenticated: true }),
    backendRequest(`/api/locations?organizationId=${encodeURIComponent(organizationId)}`, {
      authenticated: true,
    }),
  ]);
  if (orgs.status === 401 || locs.status === 401) redirect("/login");
  const organization = (orgs.data.organizations || []).find(
    (org) => String(org._id || org.id) === organizationId,
  );
  if (!organization || locs.status !== 200)
    return (
      <main className="mx-auto max-w-3xl p-8">
        <Link href="/dashboard" className="text-orange-700">
          ← Dashboard
        </Link>
        <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-800">
          Restaurant not found or access denied.
        </p>
      </main>
    );
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard" className="text-sm font-semibold text-orange-700">
          ← Dashboard
        </Link>
        <h1 className="mt-5 text-3xl font-bold">Websites & domains</h1>
        <p className="mt-2 text-slate-600">
          {organization.name} · Manage your OrderXO address and custom domain
        </p>
        <DomainsManager
          organization={organization}
          locations={Array.isArray(locs.data.locations) ? locs.data.locations : []}
        />
      </div>
    </main>
  );
}
