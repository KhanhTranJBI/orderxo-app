import {
  ShoppingBag,
  Gift,
  ChartNoAxesCombined,
  Users,
  Utensils,
  BookOpen,
  Printer,
  Tags,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendRequest, cookieName } from "../../../../lib/backend";
import AddLocationButton from "../../../../components/AddLocationButton";
import ManageLocations from "../../../../components/ManageLocations";
import LockedToolCard from "../../../../components/LockedToolCard";

export const dynamic = "force-dynamic";

const tools = [
  ["Orders Dashboard", "orders", "Confirm, prepare, complete, refund and review orders."],
  ["Menu Manager", "menu", "Items, categories, modifiers, pricing and availability."],
  ["Financials", "financials", "Transactions, refunds, reports and statements."],
  ["Promotions", "promotions", "Discount codes, eligibility and campaign status."],
  ["Manage Users", "users", "Customers, loyalty balances and email marketing preferences."],
  ["Gift Cards Dashboard", "gift-cards", "Gift card balances and activity."],
  ["Store Settings", "store", "Hours, notices, homepage slides and printer configuration."],
  ["Custom Pages", "custom-pages", "Build and publish pages with draggable sections."],
  [
    "Printable Notices",
    "notices",
    "Create door signs for closures, special hours, holidays and announcements.",
  ],
  ["Menu Book Designer", "menu-book", "Design, preview and print multi-page restaurant menus."],
];

const toolIcons = {
  orders: ShoppingBag,
  "gift-cards": Gift,
  financials: ChartNoAxesCombined,
  users: Users,
  menu: Utensils,
  "menu-book": BookOpen,
  notices: Printer,
  promotions: Tags,
  store: Settings,
  "custom-pages": BookOpen,
};

// Organization status is not the same as go-live or subscription status.
// Keep the backend status unchanged and show an understandable owner-facing label.
function getWorkspaceStatus(status) {
  const value = String(status || "")
    .trim()
    .toLowerCase();
  switch (value) {
    case "active":
      return {
        label: "Account active",
        description:
          "Your restaurant account is active. Check the go-live checklist to confirm online ordering readiness.",
        className: "bg-emerald-50 text-emerald-800",
      };
    case "pending":
    case "draft":
    case "onboarding":
      return {
        label: "Setup in progress",
        description: "Complete the restaurant setup checklist before going live.",
        className: "bg-amber-50 text-amber-900",
      };
    case "suspended":
      return {
        label: "Account needs attention",
        description:
          "This restaurant is currently restricted. Check your subscription and setup status, or contact OrderXO support for the reason.",
        className: "bg-amber-50 text-amber-900",
      };
    case "archived":
    case "disabled":
      return {
        label: "Account inactive",
        description:
          "This restaurant is not currently active. Contact OrderXO support if you need to restore access.",
        className: "bg-slate-100 text-slate-700",
      };
    default:
      return {
        label: "Status unavailable",
        description:
          "Check the restaurant setup checklist or contact OrderXO support to confirm your account status.",
        className: "bg-slate-100 text-slate-700",
      };
  }
}

export default async function RestaurantManager({ params }) {
  if (!cookies().get(cookieName)?.value && !cookies().get("orderxo_support_session")?.value)
    redirect("/login");
  const id = params.organizationId;
  const result = await backendRequest("/api/organizations", { authenticated: true });
  if (result.status === 401)
    redirect(cookies().get("orderxo_support_session")?.value ? "/dashboard" : "/login");
  const organizations = Array.isArray(result.data?.organizations) ? result.data.organizations : [];
  const org = organizations.find((o) => String(o._id || o.id) === id);
  if (!org) redirect("/dashboard");
  const workspaceStatus = getWorkspaceStatus(org.status);
  const subscriptionResult = await backendRequest(
    `/api/subscriptions/current?organizationId=${encodeURIComponent(id)}`,
    { authenticated: true },
  );
  const subscription =
    subscriptionResult.status === 200 ? subscriptionResult.data?.subscription : null;
  const hasOrderingPlan =
    ["starter", "growth", "pro"].includes(String(subscription?.plan || "").toLowerCase()) &&
    ["active", "trialing"].includes(String(subscription?.status || "").toLowerCase());
  // A failed subscription lookup must never unlock paid tools.

  const staffMode = org.role === "staff" || Boolean(cookies().get("orderxo_support_session")?.value);
  const isAdmin = !staffMode && (org.role === "admin" || org.role === "owner");
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
    <main className="min-h-screen mx-auto max-w-8xl px-2 xl:px-16 py-10 text-slate-900">
      {staffMode && (
        <div
          className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-950"
          role="status"
        >
          <strong>OrderXO Staff Mode</strong> — You are using the restaurant's existing Manager
          Dashboard. Your session permissions determine which editors and actions are available.
        </div>
      )}
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
        <div className="max-w-sm text-left sm:text-right" role="status">
          <span
            className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${workspaceStatus.className}`}
          >
            {workspaceStatus.label}
          </span>
          <p className="mt-2 text-xs leading-5 text-slate-600">{workspaceStatus.description}</p>
        </div>
      </div>
      {(isAdmin || staffMode) && (
        <Link
          href={`/dashboard/settings/go-live?organizationId=${encodeURIComponent(id)}`}
          className="mt-6 block rounded-xl border border-orange-200 bg-orange-50 p-5 font-semibold text-orange-800"
        >
          View restaurant setup checklist and go-live readiness →
        </Link>
      )}
      <section className="mt-8 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Locations</h2>
            <p className="mt-1 text-sm text-slate-500">
              {locations.filter((location) => location.status !== "archived").length} active
              locations
            </p>
          </div>
          {org.role === "owner" && <AddLocationButton organizationId={id} />}
        </div>
        <ManageLocations organizationId={id} locations={locations} owner={org.role === "owner"} />
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tools
          .filter(([name, slug]) => {
            const need =
              slug === "orders"
                ? "orders.read"
                : slug === "menu" || slug === "menu-book"
                  ? "menu.read"
                  : slug === "promotions"
                    ? "promotions.read"
                    : slug === "gift-cards"
                      ? "giftcards.read"
                      : slug === "financials"
                        ? "financials.read"
                        : slug === "users"
                          ? "customers.read"
                          : slug === "store" || slug === "location-settings" || slug === "kiosks"
                            ? null
                            : "settings.read";
            return slug === "store" || slug === "location-settings"
              ? can("store.read") || can("homepage.read")
              : slug === "kiosks"
                ? isAdmin || can("store.manage")
                : can(need);
          })
          .map(([name, slug, description]) => {
            const managePermission =
              slug === "orders"
                ? "orders.manage"
                : slug === "menu" || slug === "menu-book"
                  ? "menu.manage"
                  : slug === "promotions"
                    ? "promotions.manage"
                    : slug === "gift-cards"
                      ? "giftcards.manage"
                      : slug === "users"
                        ? "customers.manage"
                        : slug === "store" || slug === "location-settings" || slug === "kiosks"
                          ? null
                          : null;
            const readOnly =
              !isAdmin &&
              (slug === "store" || slug === "location-settings" || slug === "kiosks"
                ? !can("store.manage") && !can("homepage.manage")
                : managePermission && !can(managePermission));
            const ToolIcon = toolIcons[slug];
            const locked = !hasOrderingPlan && !["store", "menu", "custom-pages"].includes(slug);
            if (locked) {
              return (
                <LockedToolCard
                  key={slug}
                  title={name}
                  description={description}
                  iconName={slug}
                  billingHref={`/dashboard/settings/billing?organizationId=${encodeURIComponent(id)}`}
                />
              );
            }
            return (
              <Link
                key={slug}
                href={`/dashboard/restaurants/${id}/${slug}`}
                className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {ToolIcon && (
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                        <ToolIcon aria-hidden="true" size={23} strokeWidth={1.8} />
                      </span>
                    )}
                    <h2 className="text-xl font-bold">{name}</h2>
                  </div>
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
    </main>
  );
}
