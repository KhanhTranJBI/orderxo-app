import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendRequest, cookieName } from "../../../../lib/backend";
import AddLocationButton from "../../../../components/AddLocationButton";

export const dynamic = "force-dynamic";

const tools = [
  ["Orders", "orders", "Confirm, prepare, complete, refund and review orders."],
  ["Menu", "menu", "Items, categories, modifiers, pricing and availability."],
  ["Store settings", "store", "Hours, ordering status and location notices."],
  ["Location settings", "location-settings", "Location ordering and printer configuration."],
  ["Manage users", "users", "Customers, loyalty balances and email marketing preferences."],
  ["Homepage slides", "homepage", "Manage the restaurant homepage hero content."],
  ["Promotions", "promotions", "Discount codes, eligibility and campaign status."],
  ["Gift cards", "gift-cards", "Gift card balances and activity."],
  ["Financials", "financials", "Transactions, refunds, reports and statements."],
];

export default async function RestaurantManager({ params }) {
  if (!cookies().get(cookieName)?.value) redirect("/login");
  const id = params.organizationId;
  const result = await backendRequest("/api/organizations", { authenticated: true });
  if (result.status === 401) redirect("/login");
  const organizations = Array.isArray(result.data?.organizations) ? result.data.organizations : [];
  const org = organizations.find((o) => String(o._id || o.id) === id);
  if (!org) redirect("/dashboard");
  const isAdmin = org.role === "admin" || org.role === "owner";
  const permissions = new Set(org.permissions || []);
  const aliases = {
    "orders.manage": ["orders.manage", "orders.update"],
    "menu.manage": ["menu.manage", "menu.update", "menu.create", "menu.delete"],
    "financials.read": ["financials.read", "reports.read"],
    "store.read": ["store.read", "settings.read"],
    "store.manage": ["store.manage", "settings.manage"],
    "homepage.read": ["homepage.read", "settings.read"],
    "homepage.manage": ["homepage.manage", "settings.manage"],
  };
  const can = (p) =>
    isAdmin || permissions.has("*") || (aliases[p] || [p]).some((x) => permissions.has(x));

  const locationsResult = await backendRequest(
    `/api/locations?organizationId=${encodeURIComponent(id)}`,
    { authenticated: true },
  );
  const locations =
    locationsResult.status === 200 && Array.isArray(locationsResult.data?.locations)
      ? locationsResult.data.locations
      : [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard" className="text-sm font-semibold text-orange-600">
          ← Your restaurants
        </Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
              Restaurant workspace
            </p>
            <h1 className="mt-1 text-4xl font-bold">{org.name}</h1>
            <p className="mt-2 text-slate-600">
              Manage ordering, website content and restaurant operations.
            </p>
          </div>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-medium capitalize shadow-sm">
            {org.status || "pending"}
          </span>
        </div>
        <section className="mt-8 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Locations</h2>
              <p className="mt-1 text-sm text-slate-500">
                {locations.length} {locations.length === 1 ? "location" : "locations"}
              </p>
            </div>
            {isAdmin && <AddLocationButton organizationId={id} />}
          </div>
          {locations.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {locations.map((location) => (
                <span
                  key={String(location._id || location.id)}
                  className="rounded-full border bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700"
                >
                  {location.name}
                </span>
              ))}
            </div>
          )}
        </section>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tools
            .filter(([name, slug]) => {
              const need =
                slug === "orders"
                  ? "orders.read"
                  : slug === "menu"
                    ? "menu.read"
                    : slug === "promotions"
                      ? "promotions.read"
                      : slug === "gift-cards"
                        ? "giftcards.read"
                        : slug === "financials"
                          ? "financials.read"
                          : slug === "users"
                            ? "customers.read"
                            : slug === "store"
                              ? "store.read"
                              : slug === "homepage"
                                ? "homepage.read"
                                : slug === "location-settings"
                                  ? "store.read"
                                  : "settings.read";
              return can(need);
            })
            .map(([name, slug, description]) => {
              const managePermission =
                slug === "orders"
                  ? "orders.manage"
                  : slug === "menu"
                    ? "menu.manage"
                    : slug === "promotions"
                      ? "promotions.manage"
                      : slug === "gift-cards"
                        ? "giftcards.manage"
                        : slug === "users"
                          ? "customers.manage"
                          : slug === "store"
                            ? "store.manage"
                            : slug === "homepage"
                              ? "homepage.manage"
                              : slug === "location-settings"
                                ? "store.manage"
                                : null;
              const readOnly = !isAdmin && managePermission && !can(managePermission);
              return (
                <Link
                  key={slug}
                  href={`/dashboard/restaurants/${id}/${slug}`}
                  className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold">{name}</h2>
                    {readOnly && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Read only
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                  <p className="mt-5 text-sm font-semibold text-orange-600">Open →</p>
                </Link>
              );
            })}
        </div>
        {isAdmin && (
          <div className="mt-8 flex flex-wrap gap-3 border-t pt-6">
            <Link
              className="rounded-lg border bg-white px-4 py-2 font-semibold"
              href={`/dashboard/restaurants/${id}/team`}
            >
              Admins & Managers
            </Link>
            <Link
              className="rounded-lg border bg-white px-4 py-2 font-semibold"
              href={`/dashboard/restaurants/${id}/team`}
            >
              Restaurant settings
            </Link>
            <Link
              className="rounded-lg border bg-white px-4 py-2 font-semibold"
              href={`/dashboard/settings/domains?organizationId=${encodeURIComponent(id)}`}
            >
              Websites & domains
            </Link>
            <Link
              className="rounded-lg border bg-white px-4 py-2 font-semibold"
              href={`/dashboard/settings/billing?organizationId=${encodeURIComponent(id)}`}
            >
              Billing & Subscription
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
