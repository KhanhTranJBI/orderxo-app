"use client";
import { ownerFetch } from "../lib/ownerFetch";
import { useState } from "react";

function normalizeDomain(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
}

export default function DomainsManager({ organization, locations }) {
  const [items, setItems] = useState(locations);
  const [editing, setEditing] = useState("");
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const restaurantSlug = organization.slug;

  async function save(location) {
    const locationId = String(location._id || location.id);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await ownerFetch("/api/owner/domains", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: String(organization._id || organization.id),
          locationId,
          domain: normalizeDomain(domain) || null,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Unable to update custom domain");
      const updated = data.location ||
        data.domain || {
          ...location,
          domain: normalizeDomain(domain) || null,
          domainStatus: data.status || "pending",
        };
      setItems((old) =>
        old.map((x) => (String(x._id || x.id) === locationId ? { ...x, ...updated } : x)),
      );
      setEditing("");
      setMessage(
        data.message ||
          "Custom domain saved. Complete the DNS records shown by OrderXO, then verification can activate it.",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 space-y-4">
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {message}
        </p>
      )}
      {items.length === 0 && (
        <div className="rounded-xl border bg-white p-6">
          No locations are available for this restaurant.
        </div>
      )}
      {items.map((location, index) => {
        const id = String(location._id || location.id);
        const custom = location.customDomain || location.domain || "";
        const defaultHost = restaurantSlug
          ? items.length === 1 || index === 0
            ? `${restaurantSlug}.orderxo.com`
            : `${restaurantSlug}-${location.slug}.orderxo.com`
          : null;
        const status =
          location.domainStatus ||
          location.customDomainStatus ||
          (custom ? "pending" : "not connected");
        return (
          <section key={id} className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold">{location.name}</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs capitalize">
                {location.status || "pending"}
              </span>
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              OrderXO address
            </p>
            <p className="mt-1 break-all font-mono text-base font-medium">
              {defaultHost || "Subdomain not assigned"}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              This address is based on your restaurant slug, not the location name. It becomes live
              when the restaurant website is activated.
            </p>
            <div className="mt-5 border-t pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Custom domain
                  </p>
                  <p className="mt-1 break-all font-mono">{custom || "Not connected"}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs capitalize">
                  {status}
                </span>
              </div>
              {editing === id ? (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    autoFocus
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="www.myrestaurant.com"
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-orange-500"
                  />
                  <button
                    disabled={busy}
                    onClick={() => save(location)}
                    className="rounded-xl bg-orange-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60"
                  >
                    {busy ? "Saving…" : "Save domain"}
                  </button>
                  <button
                    onClick={() => setEditing("")}
                    className="rounded-xl border px-4 py-2.5 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditing(id);
                    setDomain(custom);
                  }}
                  className="mt-4 rounded-xl border border-orange-200 px-4 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                >
                  {custom ? "Change custom domain" : "Connect custom domain"}
                </button>
              )}
              <p className="mt-3 text-sm text-slate-500">
                OrderXO will return the DNS records and verification status after you save the
                domain. Do not redirect traffic until the domain is verified.
              </p>
            </div>
          </section>
        );
      })}
    </div>
  );
}
