"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const pageLabels = {
  orders: "Orders Dashboard",
  menu: "Menu Manager",
  financials: "Financials",
  promotions: "Promotions",
  users: "Manage Users",
  "gift-cards": "Gift Cards Dashboard",
  store: "Store Settings",
  notices: "Printable Notices",
  "menu-book": "Menu Book Designer",
  homepage: "Homepage",
  kiosks: "Kiosks",
  settings: "Settings",
  "location-settings": "Location Settings",
  team: "Team",
  billing: "Billing & Subscription",
  domains: "Websites & Domains",
  restaurant: "Restaurant Settings",
  "go-live": "Go-Live Checklist",
  payments: "Payments",
};

const labelFor = (segment) => pageLabels[segment] || segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function DashboardBreadcrumbs({ organizations = [] }) {
  const pathname = usePathname() || "";
  const params = useSearchParams();
  if (pathname === "/dashboard" || pathname === "/dashboard/") return null;

  const segments = pathname.split("/").filter(Boolean);
  const match = pathname.match(/^\/dashboard\/restaurants\/([^/]+)(?:\/|$)/);
  const organizationId = match ? decodeURIComponent(match[1]) : params?.get("organizationId");
  const org = organizations.find((o) => String(o._id || o.id) === String(organizationId));
  const workspaceHref = organizationId ? `/dashboard/restaurants/${encodeURIComponent(organizationId)}` : null;
  const workspaceName = org?.name || org?.restaurantName || "Restaurant Workspace";
  const currentPage = match ? segments.slice(3).map(labelFor).join(" / ") : segments.slice(2).map(labelFor).join(" / ");

  return (
    <nav aria-label="Dashboard navigation" className="mx-auto max-w-8xl px-2 pt-5 text-sm font-semibold text-orange-600 xl:px-16">
      <div className="mx-auto flex max-w-8xl flex-wrap items-center gap-x-3 gap-y-2">
        <Link href="/dashboard" className="hover:text-orange-800 hover:underline">Dashboard</Link>
        {workspaceHref && (
          <>
            <span aria-hidden="true" className="text-slate-400">&lt;</span>
            {currentPage ? (
              <Link href={workspaceHref} className="hover:text-orange-800 hover:underline">{workspaceName}</Link>
            ) : (
              <span aria-current="page">{workspaceName}</span>
            )}
          </>
        )}
        {currentPage && (
          <>
            <span aria-hidden="true" className="text-slate-400">&lt;</span>
            <span aria-current="page" className="text-slate-700">{currentPage}</span>
          </>
        )}
      </div>
    </nav>
  );
}
