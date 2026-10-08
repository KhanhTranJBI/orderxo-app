"use client";
import { ownerFetch } from "../lib/ownerFetch";

import Link from "next/link";
import { useEffect, useState } from "react";

const TABS = ["General", "Loyalty", "Gift Cards", "Email", "Ordering"];

const emptyOrg = {
  name: "",
  contactEmail: "",
  branding: { logoUrl: "", primaryColor: "#111827", secondaryColor: "#ffffff" },
  loyalty: { enabled: false, pointsPerDollar: 1, rewardThreshold: 100, rewardValueCents: 500 },
  giftCards: { enabled: false, prefix: "", buyerReceiptSubject: "", recipientReceiptSubject: "" },
  ordering: { abandonedCartIntervalMinutes: 20 },
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

function mergeOrg(value = {}) {
  return {
    ...emptyOrg,
    ...value,
    branding: { ...emptyOrg.branding, ...(value.branding || {}) },
    loyalty: { ...emptyOrg.loyalty, ...(value.loyalty || {}) },
    giftCards: { ...emptyOrg.giftCards, ...(value.giftCards || {}) },
    ordering: { ...emptyOrg.ordering, ...(value.ordering || {}) },
    emailSettings: {
      ...emptyOrg.emailSettings,
      ...(value.emailSettings || {}),
      subjects: { ...emptyOrg.emailSettings.subjects, ...(value.emailSettings?.subjects || {}) },
      messages: { ...emptyOrg.emailSettings.messages, ...(value.emailSettings?.messages || {}) },
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setError("");
        const orgData = await jsonFetch(
          `/api/owner/organizations/settings?organizationId=${encodeURIComponent(organizationId)}`,
        );
        setOrg(mergeOrg(orgData.settings));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [organizationId]);

  const setOrgPart = (part, key, value) =>
    setOrg((old) => ({ ...old, [part]: { ...old[part], [key]: value } }));
  const setEmailNested = (part, key, value) =>
    setOrg((old) => ({
      ...old,
      emailSettings: { ...old.emailSettings, [part]: { ...old.emailSettings[part], [key]: value } },
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
          ordering: org.ordering,
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

  if (!organizationId)
    return (
      <main className="mx-auto max-w-4xl p-8">
        <Link href="/dashboard" className="font-semibold text-orange-700">
          ← Dashboard
        </Link>
        <p className="mt-6">Select a restaurant from your dashboard.</p>
      </main>
    );
  if (loading) return <main className="mx-auto max-w-5xl p-8">Loading restaurant settings…</main>;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard" className="text-sm font-semibold text-orange-700">
          ← Dashboard
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
              Restaurant settings
            </p>
            <h1 className="mt-1 text-3xl font-bold">{org.name || "Restaurant"}</h1>
            <p className="mt-2 text-slate-600">
              Manage restaurant-wide branding, loyalty, gift cards, email and ordering defaults.
            </p>
          </div>
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

          {tab === "Ordering" && (
            <div className="space-y-7">
              <div>
                <h2 className="text-xl font-bold">Ordering</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Restaurant-wide ordering defaults shared by every location.
                </p>
              </div>
              <div className="max-w-xl">
                <Field
                  label="Abandoned cart interval (minutes)"
                  hint="Used across all locations when determining when an inactive cart is considered abandoned."
                >
                  <input
                    type="number"
                    min="1"
                    max="10080"
                    className={input}
                    value={org.ordering?.abandonedCartIntervalMinutes ?? 20}
                    onChange={(e) =>
                      setOrgPart("ordering", "abandonedCartIntervalMinutes", Number(e.target.value))
                    }
                  />
                </Field>
              </div>
            </div>
          )}

          <div className="mt-8 border-t pt-6">
            <button
              disabled={saving}
              onClick={saveOrganization}
              className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
