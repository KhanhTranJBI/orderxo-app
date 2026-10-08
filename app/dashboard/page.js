import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendRequest, cookieName } from "../../lib/backend";
import LogoutButton from "../../components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  if (!cookies().get(cookieName)?.value) redirect("/login");
  const result = await backendRequest("/api/organizations", { authenticated: true });
  if (result.status === 401) redirect("/login");
  const organizations =
    result.status === 200 && Array.isArray(result.data.organizations)
      ? result.data.organizations
      : [];
  // Restaurant creation is an account-level owner capability. Invited admins/managers
  // can manage organizations they belong to, but cannot create new organizations.
  // A brand-new verified account with no memberships may create its first restaurant.
  const canCreateRestaurant =
    organizations.length === 0 ||
    organizations.some((org) => Boolean(org.isOwner) || org.role === "owner");

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
              OrderXO Owner Portal
            </p>
            <h1 className="mt-1 text-3xl font-bold">Your restaurants</h1>
            <p className="mt-2 text-slate-600">Manage your restaurant websites and subscription.</p>
          </div>
          <div className="flex items-center gap-3">
            <LogoutButton />
            {canCreateRestaurant && (
              <Link
                href="/restaurants/new"
                className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700"
              >
                Add restaurant
              </Link>
            )}
          </div>
        </div>
        {result.status !== 200 ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
            Unable to load restaurants. Please try again later.
          </div>
        ) : organizations.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold">Welcome to OrderXO</h2>
            <p className="mt-2 text-slate-600">Create your first restaurant to begin setup.</p>
            <Link
              href="/restaurants/new"
              className="mt-5 inline-block rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white"
            >
              Set up restaurant
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {organizations.map((org) => {
              const id = String(org._id || org.id || "");
              const isOwner = Boolean(org.isOwner) || org.role === "owner";
              const isAdmin = isOwner || org.role === "admin";
              const roleLabel = isOwner
                ? "Owner"
                : org.role === "admin"
                  ? "Admin"
                  : org.role === "manager"
                    ? "Manager"
                    : org.role || "Member";
              return (
                <section key={id} className="rounded-2xl border bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-xl font-bold">{org.name}</h2>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize">
                      {org.status || "pending"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">Role: {roleLabel}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      href={`/dashboard/restaurants/${encodeURIComponent(id)}`}
                    >
                      Manage restaurant
                    </Link>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
