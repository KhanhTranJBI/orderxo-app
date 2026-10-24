"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/** Consistent navigation on every page below the main dashboard. */
export default function DashboardBreadcrumbs() {
  const pathname = usePathname() || "";
  const params = useSearchParams();
  if (pathname === "/dashboard" || pathname === "/dashboard/") return null;

  const match = pathname.match(/^\/dashboard\/restaurants\/([^/]+)(?:\/|$)/);
  const organizationId = match ? decodeURIComponent(match[1]) : params?.get("organizationId");
  const isWorkspace = !!match && /^\/dashboard\/restaurants\/[^/]+\/?$/.test(pathname);
  const isSecondLevel = !!organizationId && !isWorkspace;
  const workspaceHref = organizationId
    ? `/dashboard/restaurants/${encodeURIComponent(organizationId)}`
    : null;

  return (
    <nav
      aria-label="Dashboard navigation"
      className="mx-auto max-w-8xl px-2 xl:px-16 pt-5 text-sm font-semibold text-orange-600"
    >
      <div className="mx-auto flex max-w-8xl flex-wrap items-center gap-x-3 gap-y-2">
        <Link href="/dashboard" className="hover:text-orange-800 hover:underline">
          Dashboard
        </Link>
        {isSecondLevel && workspaceHref && (
          <>
            <span aria-hidden="true" className="text-slate-400">
              &lt;
            </span>
            <Link href={workspaceHref} className="hover:text-orange-800 hover:underline">
              Restaurant Workspace
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
