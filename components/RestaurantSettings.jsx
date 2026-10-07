"use client";
import { ownerFetch } from "../lib/ownerFetch";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const TABS = ["General", "Loyalty", "Gift Cards", "Email", "Printing", "Ordering"];

const emptyOrg = {
  name: "",
  contactEmail: "",
  branding: { logoUrl: "", primaryColor: "#111827", secondaryColor: "#ffffff" },
  loyalty: { enabled: false, pointsPerDollar: 1, rewardThreshold: 100, rewardValueCents: 500 },
  giftCards: { enabled: false, prefix: "", buyerReceiptSubject: "", recipientReceiptSubject: "" },
  emailSettings: {
    fromName: "",
    sendingDomain: "",
    fromEmail: "",
    replyTo: "",
    domainVerified: false,
    subjects: {
      orderReceipt: "",
      abandonedCart: "",
      orderConfirmed: "",
      orderReady: "",
      orderCompleted: "",
      orderCancelled: "",
    },
    messages: { orderConfirmed: "", orderReady: "", orderCompleted: "", orderCancelled: "" },
  },
};

const emptyLocation = {
  ordering: { abandonedCartIntervalMinutes: 20 },
  printing: {
    enabled: false,
    provider: "none",
    kitchen: { enabled: false, printerId: "", printerName: "", autoPrint: true },
    receipt: { enabled: false, printerId: "", printerName: "", autoPrint: false },
  },
};

function mergeOrg(value = {}) {
  return {
    ...emptyOrg,
    ...value,
    branding: { ...emptyOrg.branding, ...(value.branding || {}) },
    loyalty: { ...emptyOrg.loyalty, ...(value.loyalty || {}) },
    giftCards: { ...emptyOrg.giftCards, ...(value.giftCards || {}) },
    emailSettings: {
      ...emptyOrg.emailSettings,
      ...(value.emailSettings || {}),
      subjects: { ...emptyOrg.emailSettings.subjects, ...(value.emailSettings?.subjects || {}) },
      messages: { ...emptyOrg.emailSettings.messages, ...(value.emailSettings?.messages || {}) },
    },
  };
}

function mergeLocation(value = {}) {
  return {
    ...emptyLocation,
    ...value,
    ordering: { ...emptyLocation.ordering, ...(value.ordering || {}) },
    printing: {
      ...emptyLocation.printing,
      ...(value.printing || {}),
      kitchen: { ...emptyLocation.printing.kitchen, ...(value.printing?.kitchen || {}) },
      receipt: { ...emptyLocation.printing.receipt, ...(value.printing?.receipt || {}) },
    },
  };
}

async function jsonFetch(url, options) {
  const response = await ownerFetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

const input =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        className="h-5 w-5 accent-orange-600"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="font-medium text-slate-800">{label}</span>
    </label>
  );
}

export default function RestaurantSettings({ organizationId }) {
  const [tab, setTab] = useState("General");
  const [org, setOrg] = useState(emptyOrg);
  const [locations, setLocations] = useState([]);
  const [locationId, setLocationId] = useState("");
  const [location, setLocation] = useState(emptyLocation);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedLocation = useMemo(
    () => locations.find((x) => String(x._id || x.id) === locationId),
    [locations, locationId],
  );

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setError("");
        const [orgData, locationData] = await Promise.all([
          jsonFetch(
            `/api/owner/organizations/settings?organizationId=${encodeURIComponent(organizationId)}`,
          ),
          jsonFetch(`/api/owner/locations?organizationId=${encodeURIComponent(organizationId)}`),
        ]);
        setOrg(mergeOrg(orgData.settings));
        const list = Array.isArray(locationData.locations) ? locationData.locations : [];
        setLocations(list);
        if (list[0]) setLocationId(String(list[0]._id || list[0].id));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [organizationId]);

  useEffect(() => {
    if (!organizationId || !locationId) return;
    (async () => {
      try {
        const data = await jsonFetch(
          `/api/owner/locations/settings?organizationId=${encodeURIComponent(organizationId)}&locationId=${encodeURIComponent(locationId)}`,
        );
        setLocation(mergeLocation(data.settings));
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [organizationId, locationId]);

  const setOrgPart = (part, key, value) =>
    setOrg((old) => ({ ...old, [part]: { ...old[part], [key]: value } }));
  const setEmailNested = (part, key, value) =>
    setOrg((old) => ({
      ...old,
      emailSettings: { ...old.emailSettings, [part]: { ...old.emailSettings[part], [key]: value } },
    }));
  const setLocationPart = (part, key, value) =>
    setLocation((old) => ({ ...old, [part]: { ...old[part], [key]: value } }));
  const setPrinter = (target, key, value) =>
    setLocation((old) => ({
      ...old,
      printing: { ...old.printing, [target]: { ...old.printing[target], [key]: value } },
    }));

  async function saveOrganization() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const data = await jsonFetch("/api/owner/organizations/settings", {
        method: "PATCH",
        body: JSON.stringify({
          organizationId,
          branding: org.branding,
          loyalty: org.loyalty,
          giftCards: org.giftCards,
          emailSettings: org.emailSettings,
        }),
      });
      setOrg(mergeOrg(data.settings));
      setMessage("Restaurant settings saved.");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveLocation() {
    if (!locationId) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const data = await jsonFetch("/api/owner/locations/settings", {
        method: "PATCH",
        body: JSON.stringify({
          organizationId,
          locationId,
          ordering: location.ordering,
          printing: location.printing,
        }),
      });
      setLocation(mergeLocation(data.settings));
      setMessage("Location settings saved.");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!organizationId)
    return (
      <main className="mx-auto max-w-4xl p-8">
        <Link
          href={`/dashboard/restaurants/${organizationId}`}
          className="font-semibold text-orange-700"
        >
          ← Restaurant workspace
        </Link>
        <p className="mt-6">Select a restaurant from your dashboard.</p>
      </main>
    );
  if (loading) return <main className="mx-auto max-w-5xl p-8">Loading restaurant settings…</main>;

  const locationTab = tab === "Printing" || tab === "Ordering";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/dashboard/restaurants/${organizationId}`}
          className="text-sm font-semibold text-orange-700"
        >
          ← Restaurant workspace
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
              Restaurant settings
            </p>
            <h1 className="mt-1 text-3xl font-bold">{org.name || "Restaurant"}</h1>
            <p className="mt-2 text-slate-600">
              Manage ordering, loyalty, email, gift cards and printers.
            </p>
          </div>
          {locations.length > 0 && (
            <div className="min-w-[240px]">
              <Field label="Location">
                <select
                  className={input}
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                >
                  {locations.map((x) => (
                    <option key={String(x._id || x.id)} value={String(x._id || x.id)}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}
        </div>

        <div className="mt-7 overflow-x-auto border-b">
          <div className="flex min-w-max gap-1">
            {TABS.map((name) => (
              <button
                key={name}
                onClick={() => {
                  setTab(name);
                  setMessage("");
                  setError("");
                }}
                className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab === name ? "border-orange-600 text-orange-700" : "border-transparent text-slate-500 hover:text-slate-900"}`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            {message}
          </div>
        )}
        {locationTab && !locationId && (
          <div className="mt-6 rounded-xl border bg-white p-6">
            Create a location before configuring {tab.toLowerCase()}.
          </div>
        )}

        <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm md:p-8">
          {tab === "General" && (
            <div className="space-y-7">
              <div>
                <h2 className="text-xl font-bold">General & branding</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Branding used by your ordering site and restaurant emails.
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Restaurant name">
                  <input className={`${input} bg-slate-50`} value={org.name || ""} disabled />
                </Field>
                <Field label="Contact email">
                  <input
                    className={`${input} bg-slate-50`}
                    value={org.contactEmail || ""}
                    disabled
                  />
                </Field>
                <Field label="Logo URL">
                  <input
                    className={input}
                    value={org.branding.logoUrl || ""}
                    onChange={(e) => setOrgPart("branding", "logoUrl", e.target.value)}
                    placeholder="https://..."
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Primary color">
                    <input
                      className={input}
                      value={org.branding.primaryColor || ""}
                      onChange={(e) => setOrgPart("branding", "primaryColor", e.target.value)}
                    />
                  </Field>
                  <Field label="Secondary color">
                    <input
                      className={input}
                      value={org.branding.secondaryColor || ""}
                      onChange={(e) => setOrgPart("branding", "secondaryColor", e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {tab === "Loyalty" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold">Loyalty rewards</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Configure how customers earn and redeem restaurant-specific points.
                </p>
              </div>
              <Toggle
                label="Enable loyalty program"
                checked={org.loyalty.enabled}
                onChange={(v) => setOrgPart("loyalty", "enabled", v)}
              />
              <div className="grid gap-5 md:grid-cols-3">
                <Field label="Points per dollar">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className={input}
                    value={org.loyalty.pointsPerDollar}
                    onChange={(e) =>
                      setOrgPart("loyalty", "pointsPerDollar", Number(e.target.value))
                    }
                  />
                </Field>
                <Field label="Points needed for reward">
                  <input
                    type="number"
                    min="1"
                    className={input}
                    value={org.loyalty.rewardThreshold}
                    onChange={(e) =>
                      setOrgPart("loyalty", "rewardThreshold", Number(e.target.value))
                    }
                  />
                </Field>
                <Field label="Reward value ($)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={input}
                    value={(org.loyalty.rewardValueCents || 0) / 100}
                    onChange={(e) =>
                      setOrgPart(
                        "loyalty",
                        "rewardValueCents",
                        Math.round(Number(e.target.value || 0) * 100),
                      )
                    }
                  />
                </Field>
              </div>
              <div className="rounded-xl bg-orange-50 p-4 text-sm text-orange-900">
                Example: {org.loyalty.rewardThreshold} points = $
                {((org.loyalty.rewardValueCents || 0) / 100).toFixed(2)} reward.
              </div>
            </div>
          )}

          {tab === "Gift Cards" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold">Gift cards</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Configure restaurant gift cards and their email subjects.
                </p>
              </div>
              <Toggle
                label="Enable gift cards"
                checked={org.giftCards.enabled}
                onChange={(v) => setOrgPart("giftCards", "enabled", v)}
              />
              <div className="grid gap-5">
                <Field label="Gift card prefix" hint="Example: YOYO-GC-">
                  <input
                    className={input}
                    value={org.giftCards.prefix || ""}
                    onChange={(e) =>
                      setOrgPart("giftCards", "prefix", e.target.value.toUpperCase())
                    }
                  />
                </Field>
                <Field label="Buyer receipt subject">
                  <input
                    className={input}
                    value={org.giftCards.buyerReceiptSubject || ""}
                    onChange={(e) => setOrgPart("giftCards", "buyerReceiptSubject", e.target.value)}
                  />
                </Field>
                <Field label="Recipient email subject">
                  <input
                    className={input}
                    value={org.giftCards.recipientReceiptSubject || ""}
                    onChange={(e) =>
                      setOrgPart("giftCards", "recipientReceiptSubject", e.target.value)
                    }
                  />
                </Field>
              </div>
            </div>
          )}

          {tab === "Email" && (
            <div className="space-y-7">
              <div>
                <h2 className="text-xl font-bold">Email</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Customize restaurant identity, subjects and short messages. OrderXO controls the
                  underlying HTML templates.
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="From name">
                  <input
                    className={input}
                    value={org.emailSettings.fromName || ""}
                    onChange={(e) => setOrgPart("emailSettings", "fromName", e.target.value)}
                  />
                </Field>
                <Field label="Reply-to email">
                  <input
                    type="email"
                    className={input}
                    value={org.emailSettings.replyTo || ""}
                    onChange={(e) => setOrgPart("emailSettings", "replyTo", e.target.value)}
                  />
                </Field>
                <Field
                  label="Sending domain"
                  hint={
                    org.emailSettings.domainVerified
                      ? "Verified"
                      : "Changing this requires domain verification."
                  }
                >
                  <input
                    className={input}
                    value={org.emailSettings.sendingDomain || ""}
                    onChange={(e) => setOrgPart("emailSettings", "sendingDomain", e.target.value)}
                  />
                </Field>
                <Field label="From email">
                  <input
                    type="email"
                    className={input}
                    value={org.emailSettings.fromEmail || ""}
                    onChange={(e) => setOrgPart("emailSettings", "fromEmail", e.target.value)}
                  />
                </Field>
              </div>
              <div>
                <h3 className="mb-4 font-bold">Email subjects</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries({
                    orderReceipt: "Order receipt",
                    abandonedCart: "Abandoned cart",
                    orderConfirmed: "Order confirmed",
                    orderReady: "Order ready",
                    orderCompleted: "Order completed",
                    orderCancelled: "Order cancelled",
                  }).map(([key, label]) => (
                    <Field key={key} label={label}>
                      <input
                        className={input}
                        value={org.emailSettings.subjects[key] || ""}
                        onChange={(e) => setEmailNested("subjects", key, e.target.value)}
                      />
                    </Field>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-4 font-bold">Custom messages</h3>
                <div className="grid gap-4">
                  {Object.entries({
                    orderConfirmed: "Order confirmed",
                    orderReady: "Order ready",
                    orderCompleted: "Order completed",
                    orderCancelled: "Order cancelled",
                  }).map(([key, label]) => (
                    <Field key={key} label={`${label} message`}>
                      <textarea
                        rows="3"
                        className={input}
                        value={org.emailSettings.messages[key] || ""}
                        onChange={(e) => setEmailNested("messages", key, e.target.value)}
                      />
                    </Field>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "Printing" && locationId && (
            <div className="space-y-7">
              <div>
                <h2 className="text-xl font-bold">Printing</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedLocation?.name || "Location"} · Configure kitchen and receipt printers.
                </p>
              </div>
              <Toggle
                label="Enable printing"
                checked={location.printing.enabled}
                onChange={(v) =>
                  setLocation((old) => ({ ...old, printing: { ...old.printing, enabled: v } }))
                }
              />
              <Field label="Printing provider">
                <select
                  className={input}
                  value={location.printing.provider || "none"}
                  onChange={(e) =>
                    setLocation((old) => ({
                      ...old,
                      printing: { ...old.printing, provider: e.target.value },
                    }))
                  }
                >
                  <option value="none">None</option>
                  <option value="printnode">PrintNode</option>
                  <option value="orderxo_agent">OrderXO Print Agent</option>
                </select>
              </Field>
              {["kitchen", "receipt"].map((target) => (
                <div key={target} className="rounded-xl border p-5">
                  <h3 className="mb-4 text-lg font-bold capitalize">{target} printer</h3>
                  <div className="space-y-4">
                    <Toggle
                      label={`Enable ${target} printer`}
                      checked={location.printing[target].enabled}
                      onChange={(v) => setPrinter(target, "enabled", v)}
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Printer ID">
                        <input
                          className={input}
                          value={location.printing[target].printerId || ""}
                          onChange={(e) => setPrinter(target, "printerId", e.target.value)}
                        />
                      </Field>
                      <Field label="Printer name">
                        <input
                          className={input}
                          value={location.printing[target].printerName || ""}
                          onChange={(e) => setPrinter(target, "printerName", e.target.value)}
                        />
                      </Field>
                    </div>
                    <Toggle
                      label="Automatically print new orders"
                      checked={location.printing[target].autoPrint}
                      onChange={(v) => setPrinter(target, "autoPrint", v)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "Ordering" && locationId && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold">Ordering</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedLocation?.name || "Location"} · Configure location-specific ordering
                  behavior.
                </p>
              </div>
              <div className="max-w-sm">
                <Field
                  label="Abandoned cart interval (minutes)"
                  hint="How long a cart must be inactive before OrderXO treats it as abandoned. 1–10,080 minutes."
                >
                  <input
                    type="number"
                    min="1"
                    max="10080"
                    className={input}
                    value={location.ordering.abandonedCartIntervalMinutes}
                    onChange={(e) =>
                      setLocationPart(
                        "ordering",
                        "abandonedCartIntervalMinutes",
                        Number(e.target.value),
                      )
                    }
                  />
                </Field>
              </div>
            </div>
          )}

          <div className="mt-8 border-t pt-6">
            <button
              disabled={saving || (locationTab && !locationId)}
              onClick={locationTab ? saveLocation : saveOrganization}
              className="rounded-xl bg-orange-600 px-5 py-2.5 font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
