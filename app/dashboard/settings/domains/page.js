import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendRequest, cookieName } from "../../../../lib/backend";

export const dynamic = "force-dynamic";

export default async function DomainsPage({ searchParams }) {
  if (!cookies().get(cookieName)?.value) redirect("/login");
  const organizationId = searchParams?.organizationId;
  if (!organizationId) {
    return <main className="mx-auto max-w-3xl p-8"><Link href="/dashboard" className="text-orange-700">← Dashboard</Link><h1 className="my-5 text-3xl font-bold">Websites & domains</h1><p>Select a restaurant from your dashboard.</p></main>;
  }
  const [organizationsResult, locationsResult] = await Promise.all([
    backendRequest("/api/organizations", { authenticated: true }),
    backendRequest(`/api/locations?organizationId=${encodeURIComponent(organizationId)}`, { authenticated: true }),
  ]);
  if (organizationsResult.status === 401 || locationsResult.status === 401) redirect("/login");
  const organization = (organizationsResult.data.organizations || []).find((org) => String(org._id || org.id) === organizationId);
  if (!organization || locationsResult.status !== 200) {
    return <main className="mx-auto max-w-3xl p-8"><Link href="/dashboard" className="text-orange-700">← Dashboard</Link><p className="mt-6 rounded-lg bg-red-50 p-4 text-red-800">Restaurant not found or access denied.</p></main>;
  }
  const locations = Array.isArray(locationsResult.data.locations) ? locationsResult.data.locations : [];
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard" className="text-sm font-semibold text-orange-700">← Dashboard</Link>
        <h1 className="mt-5 text-3xl font-bold">Websites & domains</h1>
        <p className="mt-2 text-slate-600">{organization.name} · Website addresses for each location</p>
        <div className="mt-8 space-y-4">
          {locations.length === 0 && <div className="rounded-xl border bg-white p-6">No locations are available for this restaurant.</div>}
          {locations.map((location) => {
            const slug = location.slug;
            const defaultHost = slug ? `${slug}.orderxo.com` : null;
            return (
              <section key={String(location._id || location.id)} className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl font-semibold">{location.name}</h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs capitalize">{location.status || "pending"}</span>
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">Planned OrderXO address</p>
                <p className="mt-1 break-all font-mono text-base font-medium">{defaultHost || "Subdomain not assigned"}</p>
                <p className="mt-2 text-sm text-slate-500">This address is available only after wildcard DNS, TLS and tenant routing are configured for orderxo-web. It is not automatically live.</p>
                <div className="mt-5 border-t pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Custom domain</p>
                  <p className="mt-1 break-all font-mono">{location.domain || "Not connected"}</p>
                  <p className="mt-2 text-sm text-slate-500">Custom-domain connection and verification will be enabled when the domain-management backend is ready.</p>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
