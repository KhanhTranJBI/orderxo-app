"use client";
import { useEffect, useMemo, useState } from "react";
import { ownerFetch } from "../../lib/ownerFetch";

const ALIASES = {
  "orders.manage": ["orders.manage", "orders.update"],
  "menu.manage": ["menu.manage", "menu.update", "menu.create", "menu.delete"],
  "financials.read": ["financials.read", "reports.read"],
  "store.read": ["store.read", "settings.read"],
  "store.manage": ["store.manage", "settings.manage"],
  "homepage.read": ["homepage.read", "settings.read"],
  "homepage.manage": ["homepage.manage", "settings.manage"],
};
export default function useRestaurantPermissions(organizationId) {
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const r = await ownerFetch("/api/owner/organizations", { cache: "no-store" });
        const d = await r.json();
        if (!live) return;
        const org = (d.organizations || []).find(
          (x) => String(x._id || x.id) === String(organizationId),
        );
        setOrganization(org || null);
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [organizationId]);
  return useMemo(() => {
    const isAdmin = organization?.role === "admin" || organization?.role === "owner";
    const set = new Set(Array.isArray(organization?.permissions) ? organization.permissions : []);
    const can = (permission) =>
      isAdmin || set.has("*") || (ALIASES[permission] || [permission]).some((p) => set.has(p));
    return { organization, loading, isAdmin, can, permissions: set };
  }, [organization, loading]);
}
