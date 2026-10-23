import Link from "next/link";
import { Store } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendRequest, cookieName } from "../../lib/backend";
import LogoutButton from "../../components/LogoutButton";
import EndSupportButton from "../../components/EndSupportButton";

// Presentation only: never change the underlying organization status here.
function getOrganizationStatus(org) {
  const status = String(org.status || "pending").toLowerCase();
  const reason = String(org.suspensionReason || "").toLowerCase();
  const isOnboardingSuspension = status === "suspended" && !reason;

  if (status === "active")
    return {
      label: "Active",
      className: "bg-green-100 text-green-800 ring-green-200",
      kind: "active",
    };
  if (["pending", "draft", "onboarding"].includes(status) || isOnboardingSuspension)
    return {
      label: "Setup in progress",
      className: "bg-amber-100 text-amber-900 ring-amber-200",
      kind: "setup",
    };
  if (status === "suspended")
    return {
      label: "Account needs attention",
      className: "bg-red-100 text-red-800 ring-red-200",
      kind: "restricted",
    };
  if (["archived", "disabled", "inactive"].includes(status))
    return {
      label: "Inactive",
      className: "bg-slate-200 text-slate-700 ring-slate-300",
      kind: "inactive",
    };
  return {
    label: "Status unavailable",
    className: "bg-slate-100 text-slate-700 ring-slate-200",
    kind: "unknown",
  };
}

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  if (!cookies().get(cookieName)?.value && !cookies().get("orderxo_support_session")?.value)
    redirect("/login");
  const result = await backendRequest("/api/organizations", { authenticated: true });
  if (result.status === 401) redirect("/login");
  const organizations =
    result.status === 200 && Array.isArray(result.data.organizations)
      ? result.data.organizations
      : [];
  // Restaurant creation is an account-level owner capability. Invited admins/managers
  // can manage organizations they belong to, but cannot create new organizations.
  // A brand-new verified account with no memberships may create its first restaurant.
  const staffMode = Boolean(
    cookies().get("orderxo_support_session")?.value && !cookies().get(cookieName)?.value,
  );
  const canCreateRestaurant =
    !staffMode && (organizations.length === 0 || organizations.some((org) => org.role === "owner"));

  const planResults = await Promise.all(
    organizations.map(async (org) => {
      const id = String(org._id || org.id || "");
      const r = await backendRequest(
        `/api/subscriptions/current?organizationId=${encodeURIComponent(id)}`,
        { authenticated: true },
      );
      return [id, r.status === 200 ? r.data.subscription?.plan || null : null];
    }),
  );
  const planByOrg = Object.fromEntries(planResults);
  // Branding lives in restaurant settings, which may not be included in the
  // lightweight organizations list response. Load each restaurant's own logo.
  const logoResults = await Promise.all(
    organizations.map(async (org) => {
      const id = String(org._id || org.id || "");
      const response = await backendRequest(
        `/api/organizations/settings?organizationId=${encodeURIComponent(id)}`,
        { authenticated: true },
      );
      const settings = response.status === 200 ? response.data?.settings : null;
      const logo = settings?.branding?.logoUrl || org.branding?.logoUrl || "";
      return [id, typeof logo === "string" && /^https?:\/\//i.test(logo.trim()) ? logo.trim() : ""];
    }),
  );
  const logoByOrg = Object.fromEntries(logoResults);
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
              {staffMode ? "OrderXO Staff Mode" : "OrderXO Owner Portal"}
            </p>
            <h1 className="mt-1 text-3xl font-bold">Your restaurants</h1>
            <p className="mt-2 text-slate-600">Manage your restaurant websites and subscription.</p>
          </div>
          <div className="flex items-center gap-3">
            {staffMode ? <EndSupportButton /> : <LogoutButton />}
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
              const displayStatus = getOrganizationStatus(org);
              const isOwner = org.role === "owner";
              const proTeam = planByOrg[id] === "pro";
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
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                        {logoByOrg[id] ? (
                          // Remote restaurant logos can be hosted on any tenant domain.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={logoByOrg[id]}
                            alt={`${org.name} logo`}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Store aria-hidden="true" className="h-7 w-7 text-orange-600" />
                        )}
                      </div>
                      <h2 className="min-w-0 break-words text-xl font-bold">{org.name}</h2>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${displayStatus.className}`}
                    >
                      {displayStatus.label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">Role: {roleLabel}</p>
                  {displayStatus.kind === "setup" && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      <p className="font-semibold">Finish setting up your restaurant</p>
                      <p className="mt-1">
                        Complete the go-live checklist, connect Stripe, and confirm your
                        subscription before accepting online orders.
                      </p>
                      {(isAdmin || staffMode) && (
                        <Link
                          href={`/dashboard/settings/go-live?organizationId=${encodeURIComponent(id)}`}
                          className="mt-3 inline-block font-semibold underline"
                        >
                          Continue setup
                        </Link>
                      )}
                    </div>
                  )}
                  {displayStatus.kind === "restricted" && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                      <p className="font-semibold">Your restaurant account needs attention</p>
                      <p className="mt-1">
                        {org.suspensionReason === "subscription_canceled"
                          ? "Your OrderXO subscription ended. Reactivate your plan to restore service."
                          : org.suspensionReason === "billing_unpaid"
                            ? "There is a billing issue with your subscription. Update your billing details to restore service."
                            : "This restaurant is currently restricted. Review billing or contact OrderXO support for assistance."}
                      </p>
                      {isAdmin && (
                        <Link
                          href={`/dashboard/settings/billing?organizationId=${encodeURIComponent(id)}`}
                          className="mt-3 inline-block font-semibold underline"
                        >
                          Review billing & subscription
                        </Link>
                      )}
                    </div>
                  )}
                  {displayStatus.kind === "inactive" && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      This restaurant is inactive. Contact OrderXO support if you need to restore
                      access.
                    </div>
                  )}
                  {displayStatus.kind === "unknown" && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      We couldn't determine this restaurant's status. Contact OrderXO support if
                      this persists.
                    </div>
                  )}
                  {(isAdmin || staffMode) && (
                    <Link
                      href={`/dashboard/settings/go-live?organizationId=${encodeURIComponent(id)}`}
                      className="mt-4 block rounded-xl border border-orange-200 bg-orange-50 p-4 hover:bg-orange-100"
                    >
                      <span className="font-bold text-orange-900">
                        Restaurant setup & go-live checklist →
                      </span>
                      <p className="mt-1 text-sm text-orange-800">
                        {staffMode
                          ? "Review progress and finish permitted setup tasks. Activation requires owner approval."
                          : "Check required steps, connect Stripe, and activate online ordering."}
                      </p>
                    </Link>
                  )}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      href={`/dashboard/restaurants/${encodeURIComponent(id)}`}
                    >
                      Manage restaurant
                    </Link>
                    {staffMode && (
                      <Link
                        className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                        href={`/dashboard/restaurants/${encodeURIComponent(id)}/settings`}
                      >
                        Restaurant settings
                      </Link>
                    )}
                    {isAdmin && (
                      <>
                        <Link
                          className={`rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50 ${!proTeam ? "border-orange-200 bg-orange-50 text-orange-800" : ""}`}
                          href={`/dashboard/restaurants/${encodeURIComponent(id)}/team`}
                        >
                          {proTeam ? "Admins & Managers" : "🔒 Admins & Managers · Pro"}
                        </Link>
                        <Link
                          className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                          href={`/dashboard/restaurants/${encodeURIComponent(id)}/settings`}
                        >
                          Restaurant settings
                        </Link>
                        <Link
                          className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                          href={`/dashboard/settings/domains?organizationId=${encodeURIComponent(id)}`}
                        >
                          Websites & domains
                        </Link>
                        <Link
                          className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                          href={`/dashboard/settings/billing?organizationId=${encodeURIComponent(id)}`}
                        >
                          Billing & subscription
                        </Link>
                      </>
                    )}
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
