"use client";
import { toast } from "react-toastify";
import LoadingSpinner from "./ui/LoadingSpinner";
import PrintableOrderingQR from "./PrintableOrderingQR";
import ImageUploadButton from "./ui/ImageUploadButton";

import HomepageBuilder from "./HomepageBuilder";
import { ownerFetch } from "../lib/ownerFetch";

import Link from "next/link";
import RestaurantLinksSettings from "./RestaurantLinksSettings";
import { useEffect, useState } from "react";
import {
  Settings,
  Link2,
  Palette,
  House,
  Star,
  Gift,
  Mail,
  Megaphone,
  Search,
  ShoppingCart,
  Instagram,
  Facebook,
  MapPin,
  Phone,
} from "lucide-react";

const TABS = [
  "General",
  "Nav & Footer Links",
  "Appearance",
  "Homepage",
  "Loyalty",
  "Gift Cards",
  "Email",
  "Marketing Automations",
    "Ordering",
];

const TAB_ICONS = {
  General: Settings,
  "Nav & Footer Links": Link2,
  Appearance: Palette,
  Homepage: House,
  Loyalty: Star,
  "Gift Cards": Gift,
  Email: Mail,
  "Marketing Automations": Megaphone,
  Ordering: ShoppingCart,
};

// Stable, shareable URL fragments for Restaurant Settings tabs.
const TAB_HASHES = {
  General: "general",
  "Nav & Footer Links": "social-links",
  Appearance: "appearance",
  Homepage: "homepage",
  Loyalty: "loyalty",
  "Gift Cards": "gift-cards",
  Email: "email",
  "Marketing Automations": "marketing-automations",
  Ordering: "ordering",
};
const HASH_TABS = Object.fromEntries(
  Object.entries(TAB_HASHES).map(([name, hash]) => [hash, name]),
);

const emptyOrg = {
  name: "",
  contactEmail: "",
  businessStartYear: "",
  website: { social: {}, navigationLinks: [], footerLinks: [], footerGroups: [] },
  branding: {
    logoUrl: "",
    faviconUrl: "",
    primaryColor: "#111827",
    secondaryColor: "#ffffff",
    backgroundColor: "#ffffff",
    headingTextColor: "#111827",
    bodyTextColor: "#475569",
    navigationBackgroundColor: "#ffffff",
    navigationTextColor: "#475569",
    activeLinkColor: "#f97316",
    announcementBackgroundColor: "#f97316",
    announcementTextColor: "#ffffff",
    menuCategoryBarBackgroundColor: "#ffffff",
    menuCategoryActiveColor: "#f97316",
    menuCategoryInactiveColor: "#6b7280",
    cardBackgroundColor: "#ffffff",
    cardTextColor: "#111827",
    borderColor: "#e5e7eb",
    buttonBackgroundColor: "#f97316",
    buttonTextColor: "#ffffff",
    buttonHoverColor: "#ea580c",
    inputBackgroundColor: "#ffffff",
    inputTextColor: "#111827",
    inputBorderColor: "#cbd5e1",
    footerBackgroundColor: "#111827",
    footerTextColor: "#ffffff",
    footerLinkColor: "#fdba74",
    footerLinkHoverColor: "#F97316",
    footerIconColor: "#fdba74",
    footerIconHoverColor: "#F97316",
    successColor: "#15803d",
    errorColor: "#dc2626",
    warningColor: "#d97706",
    itemBackgroundColor: "#F3F4F6",
    itemTextColor: "#374151",
    selectedItemBackgroundColor: "#FFF7ED",
    selectedItemBorderColor: "#F97316",
    selectedItemTextColor: "#374151",
    selectedItemCheckColor: "#F97316",
  },
  loyalty: { enabled: false, pointsPerDollar: 1, rewardThreshold: 100, rewardValueCents: 500 },
  giftCards: { enabled: false, prefix: "", buyerReceiptSubject: "", recipientReceiptSubject: "" },
  smartUpsell: { enabled: false, showInItemModal: true, showInCart: true, showInCheckout: false },
  marketingAutomations: {
    abandonedCart: { enabled: true, delayMinutes: 20 },
    winback: {
      enabled: false,
      inactiveDays: 30,
      subject: "We miss you!",
      message: "We'd love to see you again.",
      rewardEnabled: true,
      rewardType: "percent",
      discountPercent: 15,
      discountAmountCents: 700,
      maxDiscountAmountCents: 700,
      minSubtotalCents: 2000,
      validDays: 7,
    },
    birthday: {
      enabled: false,
      subject: "Happy birthday!",
      message: "Wishing you a wonderful birthday!",
      rewardEnabled: true,
      rewardType: "percent",
      discountPercent: 10,
      discountAmountCents: 500,
      maxDiscountAmountCents: 500,
      minSubtotalCents: 1500,
      validDays: 7,
    },
    loyalty: {
      enabled: false,
      minimumPoints: 100,
      cooldownDays: 30,
      subject: "You have rewards waiting!",
      message: "You have points ready to use on your next order.",
    },
  },
  ordering: {
    qrPoster: {
      heading: "Scan to Order",
      description: "Scan the QR code to order directly from your phone.",
      footer: "Order online • Fast & Easy",
    },
    abandonedCartIntervalMinutes: 20,
    serviceFeePerItemCents: 0,
    serviceFee: {
      enabled: false,
      type: "fixed",
      fixedCents: 150,
      perItemCents: 100,
      percentageBps: 0,
    },
  },
  notifications: { orderEmails: [], abandonedCartEmails: [], giftCardEmails: [] },
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
    website: {
      ...emptyOrg.website,
      ...(value.website || {}),
      social: { ...(value.website?.social || {}) },
    },
    branding: { ...emptyOrg.branding, ...(value.branding || {}) },
    loyalty: { ...emptyOrg.loyalty, ...(value.loyalty || {}) },
    giftCards: { ...emptyOrg.giftCards, ...(value.giftCards || {}) },
    smartUpsell: { ...emptyOrg.smartUpsell, ...(value.smartUpsell || {}) },
    marketingAutomations: {
      abandonedCart: {
        ...emptyOrg.marketingAutomations.abandonedCart,
        ...(value.marketingAutomations?.abandonedCart || {}),
        delayMinutes:
          value.marketingAutomations?.abandonedCart?.delayMinutes ??
          value.ordering?.abandonedCartIntervalMinutes ??
          20,
      },
      ...Object.fromEntries(
        ["winback", "birthday", "loyalty"].map((key) => [
          key,
          { ...emptyOrg.marketingAutomations[key], ...(value.marketingAutomations?.[key] || {}) },
        ]),
      ),
    },
    ordering: {
      ...emptyOrg.ordering,
      ...(value.ordering || {}),
      serviceFee: { ...emptyOrg.ordering.serviceFee, ...(value.ordering?.serviceFee || {}) },
      qrPoster: { ...emptyOrg.ordering.qrPoster, ...(value.ordering?.qrPoster || {}) },
    },
    notifications: { ...emptyOrg.notifications, ...(value.notifications || {}) },
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

const APPEARANCE_GROUPS = [
  {
    title: "Brand colors",
    description: "Your restaurant's signature colors.",
    fields: [
      ["primaryColor", "Primary"],
      ["secondaryColor", "Secondary"],
      ["backgroundColor", "Page background"],
    ],
  },
  {
    title: "Typography",
    description: "Keep headings and body copy readable.",
    fields: [
      ["headingTextColor", "Heading text"],
      ["bodyTextColor", "Body text"],
    ],
  },
  {
    title: "Navigation",
    description: "Header and navigation links.",
    fields: [
      ["navigationBackgroundColor", "Background"],
      ["navigationTextColor", "Text"],
      ["activeLinkColor", "Active link"],
    ],
  },
  {
    title: "Announcement bar",
    description: "Promotional banner below the navigation.",
    fields: [
      ["announcementBackgroundColor", "Background"],
      ["announcementTextColor", "Text"],
    ],
  },
  {
    title: "Menu Category Bar",
    description: "Background and active/inactive category text and indicator colors.",
    fields: [
      ["menuCategoryBarBackgroundColor", "Background"],
      ["menuCategoryActiveColor", "Active category"],
      ["menuCategoryInactiveColor", "Inactive category"],
    ],
  },
  {
    title: "Cards & content",
    description: "Menus, information cards and panels.",
    fields: [
      ["cardBackgroundColor", "Card background"],
      ["cardTextColor", "Card text"],
      ["borderColor", "Border"],
    ],
  },
  {
    title: "Menu Items & Selection",
    description:
      "Modifier choices, unselected options and highlighted selections across your menu.",
    fields: [
      ["itemBackgroundColor", "Item background"],
      ["itemTextColor", "Item text"],
      ["selectedItemBackgroundColor", "Selected background"],
      ["selectedItemBorderColor", "Selected border"],
      ["selectedItemTextColor", "Selected text"],
      ["selectedItemCheckColor", "Selected checkmark"],
    ],
  },
  {
    title: "Buttons",
    description: "Primary actions across the website.",
    fields: [
      ["buttonBackgroundColor", "Background"],
      ["buttonTextColor", "Text"],
      ["buttonHoverColor", "Hover"],
    ],
  },
  {
    title: "Forms",
    description: "Checkout and contact form inputs.",
    fields: [
      ["inputBackgroundColor", "Background"],
      ["inputTextColor", "Text"],
      ["inputBorderColor", "Border"],
    ],
  },
  {
    title: "Footer",
    description: "Website footer and links.",
    fields: [
      ["footerBackgroundColor", "Background"],
      ["footerTextColor", "Text"],
      ["footerLinkColor", "Link color"],
      ["footerLinkHoverColor", "Link hover color"],
      ["footerIconColor", "Icon color"],
      ["footerIconHoverColor", "Icon hover color"],
    ],
  },
  {
    title: "Status colors",
    description: "Success, error and warning messages.",
    fields: [
      ["successColor", "Success"],
      ["errorColor", "Error"],
      ["warningColor", "Warning"],
    ],
  },
];

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
function AppearanceColor({ label, value, fallback, onChange }) {
  const color = HEX_COLOR.test(value || "") ? value : fallback;
  return (
    <label className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300">
      <input
        aria-label={`${label} color picker`}
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-12 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        <input
          aria-label={`${label} hex color`}
          value={value || ""}
          placeholder={fallback}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => {
            if (!HEX_COLOR.test(e.target.value)) onChange(color);
          }}
          className="mt-1 w-full min-w-0 bg-transparent font-mono text-xs uppercase text-slate-500 outline-none focus:text-slate-900"
        />
      </span>
    </label>
  );
}

function AppearancePreview({ branding, restaurantName }) {
  const [activePreviewCategory, setActivePreviewCategory] = useState("Appetizer");
  const b = branding;
  const c = (key) => (HEX_COLOR.test(b[key] || "") ? b[key] : emptyOrg.branding[key]);
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
        style={{ background: c("navigationBackgroundColor"), color: c("navigationTextColor") }}
      >
        <span className="font-bold">{restaurantName || "Your Restaurant"}</span>
        <div className="flex gap-4 text-xs sm:text-sm">
          <span>Home</span>
          <span style={{ color: c("activeLinkColor"), fontWeight: 700 }}>Menu</span>
          <span>Contact</span>
        </div>
      </div>
      <div
        className="px-4 py-2 text-center text-xs font-medium"
        style={{ background: c("announcementBackgroundColor"), color: c("announcementTextColor") }}
      >
        Fresh food, made for you — order online!
      </div>
      <div className="p-5 sm:p-7" style={{ background: c("backgroundColor") }}>
        <h3 className="text-xl font-bold" style={{ color: c("headingTextColor") }}>
          Explore our menu
        </h3>
        <p className="mt-1 text-sm" style={{ color: c("bodyTextColor") }}>
          Made fresh at your selected location.
        </p>
        <div
          className="mt-4 flex flex-wrap items-center gap-5 rounded-xl px-4 pt-3 shadow-sm"
          style={{ backgroundColor: c("menuCategoryBarBackgroundColor") }}
          aria-label="Menu category bar preview"
        >
          {["Appetizer", "Pho", "Drinks"].map((category) => {
            const active = activePreviewCategory === category;
            const color = c(active ? "menuCategoryActiveColor" : "menuCategoryInactiveColor");
            return (
              <button
                key={category}
                type="button"
                aria-pressed={active}
                onClick={() => setActivePreviewCategory(category)}
                className="flex flex-col items-center gap-2 border-b-[3px] px-1 pb-3 text-sm font-semibold transition-colors"
                style={{ color, borderBottomColor: active ? color : "transparent" }}
              >
                {category}
              </button>
            );
          })}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {["Signature bowl", "Fresh favorites"].map((name, i) => (
            <div
              key={name}
              className="overflow-hidden rounded-xl border"
              style={{
                background: c("cardBackgroundColor"),
                borderColor: c("borderColor"),
                color: c("cardTextColor"),
              }}
            >
              <div
                className="flex h-20 items-center justify-center text-3xl"
                style={{ background: c("itemBackgroundColor") }}
              >
                {i ? "🥗" : "🍲"}
              </div>
              <div className="p-3">
                <div className="flex justify-between gap-2 text-sm font-semibold">
                  <span>{name}</span>
                  <span style={{ color: c("primaryColor") }}>$12.50</span>
                </div>
                <button
                  type="button"
                  className="mt-3 w-full rounded-lg px-3 py-2 text-sm font-semibold"
                  style={{ background: c("buttonBackgroundColor"), color: c("buttonTextColor") }}
                >
                  Add to order
                </button>
              </div>
            </div>
          ))}
        </div>
        <div
          className="mt-5 rounded-xl border p-4"
          style={{ background: c("cardBackgroundColor"), borderColor: c("borderColor") }}
        >
          <p className="mb-1 text-sm font-bold" style={{ color: c("cardTextColor") }}>
            Gluten Free Selection
          </p>
          <p className="mb-3 text-xs" style={{ color: c("bodyTextColor") }}>
            Select up to 1 · Modifier selection preview
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: "Yes", selected: false },
              { name: "No", selected: true },
            ].map((option) => (
              <div
                key={option.name}
                className="relative flex flex-col items-center gap-2 rounded-xl border-2 px-2 py-4 text-sm font-semibold"
                style={{
                  background: c(
                    option.selected ? "selectedItemBackgroundColor" : "itemBackgroundColor",
                  ),
                  color: c(option.selected ? "selectedItemTextColor" : "itemTextColor"),
                  borderColor: option.selected ? c("selectedItemBorderColor") : c("borderColor"),
                }}
              >
                {option.selected && (
                  <span
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-white"
                    style={{ background: c("selectedItemCheckColor") }}
                  >
                    ✓
                  </span>
                )}
                <span
                  className="h-14 w-14 rounded-full border"
                  style={{ background: c("itemBackgroundColor"), borderColor: c("borderColor") }}
                />
                {option.name}
              </div>
            ))}
          </div>
        </div>
        <div
          className="mt-4 rounded-xl border p-3"
          style={{
            background: c("cardBackgroundColor"),
            borderColor: c("borderColor"),
            color: c("cardTextColor"),
          }}
        >
          <p className="text-sm font-semibold">Checkout preview</p>
          <div
            className="mt-2 rounded-lg border px-3 py-2 text-xs"
            style={{
              background: c("inputBackgroundColor"),
              color: c("inputTextColor"),
              borderColor: c("inputBorderColor"),
            }}
          >
            Your name
          </div>
          <p className="mt-2 text-xs" style={{ color: c("successColor") }}>
            ✓ Secure checkout
          </p>
        </div>
      </div>
      <div
        className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 text-xs"
        style={{ background: c("footerBackgroundColor"), color: c("footerTextColor") }}
      >
        <span>© {restaurantName || "Your Restaurant"}</span>
        <div className="flex flex-wrap items-center gap-4">
          {["Privacy", "Contact"].map((label) => (
            <span
              key={label}
              tabIndex={0}
              className="cursor-pointer transition-colors"
              style={{ color: c("footerLinkColor") }}
              onMouseEnter={(e) => { e.currentTarget.style.color = c("footerLinkHoverColor"); }}
              onMouseLeave={(e) => { e.currentTarget.style.color = c("footerLinkColor"); }}
              onFocus={(e) => { e.currentTarget.style.color = c("footerLinkHoverColor"); }}
              onBlur={(e) => { e.currentTarget.style.color = c("footerLinkColor"); }}
            >
              {label}
            </span>
          ))}
          {[Instagram, Facebook, MapPin, Phone].map((Icon, index) => (
            <span
              key={index}
              tabIndex={0}
              role="img"
              aria-label={["Instagram icon preview", "Facebook icon preview", "Location icon preview", "Phone icon preview"][index]}
              className="inline-flex cursor-pointer items-center transition-colors"
              style={{ color: c("footerIconColor") }}
              onMouseEnter={(e) => { e.currentTarget.style.color = c("footerIconHoverColor"); }}
              onMouseLeave={(e) => { e.currentTarget.style.color = c("footerIconColor"); }}
              onFocus={(e) => { e.currentTarget.style.color = c("footerIconHoverColor"); }}
              onBlur={(e) => { e.currentTarget.style.color = c("footerIconColor"); }}
            >
              <Icon size={17} aria-hidden="true" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlanLocked({ title, required, href }) {
  return (
    <div className="rounded-2xl border border-orange-200 bg-orange-50 p-8 text-center">
      <h2 className="text-xl font-bold text-slate-900">🔒 {title}</h2>
      <p className="mt-2 text-slate-600">
        Available on {required}. Your existing content is preserved.
      </p>
      <a
        className="mt-5 inline-block rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white"
        href={href}
      >
        View plans & upgrade
      </a>
    </div>
  );
}

export default function RestaurantSettings({
  organizationId,
  staffMode = false,
  staffPermissions = [],
}) {
  const [tab, setTab] = useState("General");

  // Respect direct links, browser Back/Forward, and manual hash changes.
  useEffect(() => {
    const syncTabFromHash = () => {
      const hash = window.location.hash.slice(1).toLowerCase();
      const nextTab = HASH_TABS[hash];
      if (nextTab) setTab(nextTab);
    };
    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);
    window.addEventListener("popstate", syncTabFromHash);
    return () => {
      window.removeEventListener("hashchange", syncTabFromHash);
      window.removeEventListener("popstate", syncTabFromHash);
    };
  }, []);

  const selectTab = (name) => {
    setTab(name);
    setMessage("");
    setError("");
    const hash = TAB_HASHES[name];
    if (hash && window.location.hash !== `#${hash}`) {
      window.history.pushState(
        null,
        "",
        `${window.location.pathname}${window.location.search}#${hash}`,
      );
    }
  };
  const [org, setOrg] = useState(emptyOrg);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testType, setTestType] = useState("orderReceipt");
  const [testSending, setTestSending] = useState(false);
  const [testFeedback, setTestFeedback] = useState("");
  const [entitlements, setEntitlements] = useState({
    loyalty: false,
    giftCards: false,
    smartUpsell: false,
    appearanceCustomization: false,
    homepageBuilder: false,
    marketingAutomations: false,
  });
  const [plan, setPlan] = useState(null);
  const [entitlementError, setEntitlementError] = useState("");
  const [upgradeFeature, setUpgradeFeature] = useState(null);
  const [message, setMessageState] = useState("");
  const setMessage = (value) => {
    setMessageState(value);
    if (typeof value === "string" && value.trim()) toast.success(value);
  };
  const [error, setErrorState] = useState("");
  const setError = (value) => {
    setErrorState(value);
    if (typeof value === "string" && value.trim()) toast.error(value);
  };

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setError("");
        setEntitlementError("");
        const orgData = await jsonFetch(
          `/api/owner/organizations/settings?organizationId=${encodeURIComponent(organizationId)}`,
        );
        setOrg(mergeOrg(orgData.settings));
        // Admin API exposes permissions inside settings.features, not top-level entitlements.
        // Also consult the subscription endpoint for compatibility with older settings APIs.
        const settingsFeatures =
          orgData.settings?.features || orgData.features || orgData.entitlements;
        const settingsSubscription = orgData.settings?.subscription || orgData.subscription;
        let resolvedFeatures = settingsFeatures;
        let resolvedSubscription = settingsSubscription;
        try {
          const billingData = await jsonFetch(
            `/api/owner/subscriptions/current?organizationId=${encodeURIComponent(organizationId)}`,
          );
          resolvedSubscription = billingData.subscription || resolvedSubscription;
          resolvedFeatures = billingData.features || resolvedFeatures;
        } catch (billingError) {
          if (!resolvedFeatures) {
            setEntitlementError(
              "Unable to verify subscription features. Please refresh or try again.",
            );
          }
        }
        const activePlan = String(
          resolvedSubscription?.plan || resolvedSubscription?.tier || orgData.plan || "",
        ).toLowerCase();
        const isGrowth = ["growth", "grow", "pro"].includes(activePlan);
        const isPro = activePlan === "pro";
        const feature = (key, fallback) =>
          typeof resolvedFeatures?.[key] === "boolean" ? resolvedFeatures[key] : fallback;
        if (activePlan || resolvedFeatures) {
          setEntitlements({
            loyalty: feature("loyalty", isGrowth),
            giftCards: feature("giftCards", isGrowth),
            smartUpsell: feature("smartUpsell", isGrowth),
            appearanceCustomization: feature("appearanceCustomization", isGrowth),
            homepageBuilder: feature("homepageBuilder", isPro),
            marketingAutomations: feature("marketingAutomations", isPro),
          });
          setEntitlementError("");
        } else {
          setEntitlementError(
            "Unable to verify subscription features. Please refresh or try again.",
          );
        }
        setPlan(activePlan || null);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [organizationId]);

  const billingUrl = `/dashboard/settings/billing?organizationId=${encodeURIComponent(organizationId)}`;
  const showUpgrade = (feature) => setUpgradeFeature(feature);

  const setOrgPart = (part, key, value) =>
    setOrg((old) => ({ ...old, [part]: { ...old[part], [key]: value } }));
  async function sendTestEmail() {
    setTestSending(true);
    setTestFeedback("");
    try {
      const result = await jsonFetch("/api/owner/organizations/test-email", {
        method: "POST",
        body: JSON.stringify({ organizationId, type: testType }),
      });
      setTestFeedback(result.message || "Test email submitted.");
    } catch (e) {
      setTestFeedback(e.message || "Unable to send test email.");
    } finally {
      setTestSending(false);
    }
  }

  async function saveOrganization() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const data = await jsonFetch("/api/owner/organizations/settings", {
        method: "PATCH",
        body: JSON.stringify({
          organizationId,
          businessStartYear: org.businessStartYear,
          branding: (staffMode && staffPermissions.includes("setup:settings")) || entitlements.appearanceCustomization
            ? org.branding
            : { logoUrl: org.branding.logoUrl, faviconUrl: org.branding.faviconUrl },
          website: org.website,
          loyalty: { ...org.loyalty, enabled: entitlements.loyalty && org.loyalty.enabled },
          giftCards: { ...org.giftCards, enabled: entitlements.giftCards && org.giftCards.enabled },
          ordering: org.ordering,
          ...(staffMode || entitlements.marketingAutomations
            ? { marketingAutomations: org.marketingAutomations }
            : {}),
          smartUpsell: org.smartUpsell,
          notifications: org.notifications,
        }),
      });
      if (!data?.settings) throw new Error("Settings response missing; please reload and verify your changes.");
      if (tab === "Appearance" && ((staffMode && staffPermissions.includes("setup:settings")) || entitlements.appearanceCustomization)) {
        for (const [key, value] of Object.entries(org.branding)) {
          if (key.endsWith("Color") && typeof value === "string" &&
              data.settings.branding?.[key]?.toLowerCase() !== value.toLowerCase()) {
            throw new Error(`Appearance setting ${key} was not saved. Please retry.`);
          }
        }
      }
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
      <main className="mx-auto max-w-8xl p-8">
        <p className="mt-6">Select a restaurant from your dashboard.</p>
      </main>
    );
  if (loading) return <LoadingSpinner fullPage label="Loading restaurant settings…" />;

  return (
    <main className="min-h-screen mx-auto max-w-8xl px-2 xl:px-16 py-8 text-slate-900">
      <div className="mx-auto max-w-8xl">
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

        {entitlementError && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          >
            {entitlementError}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="ml-3 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}
        <div className="mt-7 overflow-x-auto border-b">
          <div className="flex min-w-max gap-1">
            {TABS.map((name) => {
              const TabIcon = TAB_ICONS[name];
              return (
                <button
                  key={name}
                  onClick={() => selectTab(name)}
                  className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold ${tab === name ? "border-orange-600 text-orange-700" : "border-transparent text-slate-500 hover:text-slate-900"}`}
                >
                  <TabIcon size={18} aria-hidden="true" className="shrink-0" />
                  {name}
                </button>
              );
            })}
          </div>
        </div>

        <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm md:p-8">
          {staffMode && (
            <div
              role="note"
              className="mb-7 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
            >
              OrderXO Staff Access — You may update this restaurant's settings with your assigned
              permissions. Publishing requires setup:publish permission.
            </div>
          )}
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
                <Field label="Business start year">
                  <input
                    type="number"
                    min="1800"
                    max={new Date().getFullYear()}
                    className={input}
                    value={org.businessStartYear ?? ""}
                    placeholder="e.g. 2023"
                    onChange={(e) =>
                      setOrg((old) => ({ ...old, businessStartYear: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Logo URL">
                  <input
                    className={input}
                    value={org.branding.logoUrl || ""}
                    onChange={(e) => setOrgPart("branding", "logoUrl", e.target.value)}
                    placeholder="https://..."
                  />
                  <ImageUploadButton organizationId={organizationId} onUploaded={(url) => setOrgPart("branding", "logoUrl", url)} label="Upload logo" />
                </Field>
                <Field label="Favicon URL (browser tab icon)">
                  <input
                    className={input}
                    value={org.branding.faviconUrl || ""}
                    onChange={(e) => setOrgPart("branding", "faviconUrl", e.target.value)}
                    placeholder="https://.../favicon.png (falls back to logo)"
                  />
                  <ImageUploadButton organizationId={organizationId} onUploaded={(url) => setOrgPart("branding", "faviconUrl", url)} label="Upload favicon" />
                </Field>
              </div>
            </div>
          )}

          {tab === "Appearance" && (
            <div className="space-y-8">
              {!staffMode && !entitlements.appearanceCustomization && (
                <PlanLocked title="Website Appearance" required="Growth or Pro" href={billingUrl} />
              )}
              <fieldset
                disabled={
                  !staffMode && (!entitlements.appearanceCustomization || !!entitlementError)
                }
                className="space-y-8 disabled:opacity-75"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Website Appearance</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Customize the look of your ordering website. Changes apply to all restaurant
                      locations.
                    </p>
                  </div>
                  <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">
                    All locations
                  </span>
                </div>
                <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
                  <div className="min-w-0 space-y-7">
                    {APPEARANCE_GROUPS.map((group) => (
                      <div
                        key={group.title}
                        className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5"
                      >
                        <h3 className="text-base font-bold text-slate-900">{group.title}</h3>
                        <p className="mb-4 mt-1 text-sm text-slate-500">{group.description}</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {group.fields.map(([key, label]) => (
                            <AppearanceColor
                              key={key}
                              label={label}
                              value={org.branding[key]}
                              fallback={emptyOrg.branding[key]}
                              onChange={(value) => setOrgPart("branding", key, value)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start">
                    <div className="mb-3">
                      <h3 className="font-bold text-slate-900">Live website preview</h3>
                      <p className="text-sm text-slate-500">
                        Updates as you edit. Save changes to publish.
                      </p>
                    </div>
                    <AppearancePreview branding={org.branding} restaurantName={org.name} />
                  </aside>
                </div>
              </fieldset>
            </div>
          )}

          {tab === "Nav & Footer Links" && (
            <RestaurantLinksSettings organizationId={organizationId}
              value={org.website}
              onChange={(website) => setOrg((old) => ({ ...old, website }))}
            />
          )}

          {tab === "Homepage" && (
            <div className="space-y-5">
              {!staffMode && !entitlements.homepageBuilder && (
                <PlanLocked title="Homepage Studio" required="Pro" href={billingUrl} />
              )}
              <HomepageBuilder
                organizationId={organizationId}
                readOnly={!staffMode && (!entitlements.homepageBuilder || !!entitlementError)}
                canPublish={!staffMode || staffPermissions.includes("setup:publish")}
              />
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
              {!entitlements.loyalty && !entitlementError && (
                <p className="text-sm text-orange-700">
                  Available on Growth and Pro. Select the switch to see upgrade options.
                </p>
              )}
              <Toggle
                label="Enable loyalty program"
                checked={entitlements.loyalty && org.loyalty.enabled}
                onChange={(v) => {
                  if (entitlementError) return setError(entitlementError);
                  if (!entitlements.loyalty) return showUpgrade("Loyalty rewards");
                  setOrgPart("loyalty", "enabled", v);
                }}
              />
              <fieldset
                disabled={!entitlements.loyalty}
                className="grid gap-5 md:grid-cols-3 disabled:opacity-50"
              >
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
              </fieldset>
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
              {!entitlements.giftCards && !entitlementError && (
                <p className="text-sm text-orange-700">
                  Available on Growth and Pro. Select the switch to see upgrade options.
                </p>
              )}
              <Toggle
                label="Enable gift cards"
                checked={entitlements.giftCards && org.giftCards.enabled}
                onChange={(v) => {
                  if (entitlementError) return setError(entitlementError);
                  if (!entitlements.giftCards) return showUpgrade("Gift Cards");
                  setOrgPart("giftCards", "enabled", v);
                }}
              />
              <fieldset
                disabled={!entitlements.giftCards}
                className="grid gap-5 disabled:opacity-50"
              >
                <Field label="Gift card prefix" hint="Example: YOYO-GC-">
                  <input
                    className={input}
                    value={org.giftCards.prefix || ""}
                    onChange={(e) =>
                      setOrgPart("giftCards", "prefix", e.target.value.toUpperCase())
                    }
                  />
                </Field>
              </fieldset>
            </div>
          )}

          {tab === "Email" && (
            <div className="space-y-7">
              <div>
                <h2 className="text-xl font-bold">Email</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Preview transactional emails using your restaurant branding. OrderXO manages email
                  delivery and templates.
                </p>
              </div>
              {!staffMode && (
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 space-y-3">
                  <h3 className="font-bold text-slate-900">Send test email</h3>
                  <p className="text-sm text-slate-600">
                    Preview a sample Mailgun template with your saved restaurant branding. Tests are
                    sent only to your account email. Save changes first to preview updated settings.
                  </p>
                  <div className="flex flex-wrap gap-3 items-center">
                    <select
                      className={input + " max-w-sm"}
                      value={testType}
                      onChange={(e) => setTestType(e.target.value)}
                    >
                      {[
                        ["orderReceipt", "Order receipt"],
                        ["abandonedCart", "Abandoned cart"],
                        ["giftCardBuyerReceipt", "Gift card buyer receipt"],
                        ["giftCardRecipientReceipt", "Gift card recipient"],
                        ["orderConfirmed", "Order confirmed"],
                        ["orderReady", "Order ready"],
                        ["orderCompleted", "Order completed"],
                        ["orderCancelled", "Order cancelled"],
                      ].map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={testSending}
                      onClick={sendTestEmail}
                      className="rounded-lg bg-orange-600 px-5 py-3 text-white font-semibold disabled:opacity-50"
                    >
                      {testSending ? "Sending…" : "Send test email"}
                    </button>
                  </div>
                  {testFeedback && (
                    <p role="status" className="text-sm text-slate-700">
                      {testFeedback}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    Sample orders and gift card codes are not real. Sending does not create orders
                    or charges.
                  </p>
                </div>
              )}
              <p className="text-sm text-slate-600">
                OrderXO manages sender addresses, email subjects, and message templates
                automatically. Restaurant branding is applied from your saved settings.
              </p>
            </div>
          )}

          {tab === "Marketing Automations" && (
            <div className="space-y-5">
              {!staffMode && (!entitlements.marketingAutomations || !!entitlementError) && (
                <PlanLocked title="Marketing Automations" required="Pro" href={billingUrl} />
              )}
              <fieldset
                disabled={!staffMode && (!entitlements.marketingAutomations || !!entitlementError)}
                className="space-y-5 disabled:opacity-60"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Customer Marketing Automations
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Configure email reminders for your restaurant. Changes take effect after saving.
                  </p>
                </div>
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 space-y-4">
                  <label className="flex items-center gap-3 font-semibold text-slate-900">
                    <input
                      type="checkbox"
                      checked={org.marketingAutomations?.abandonedCart?.enabled !== false}
                      onChange={(e) =>
                        setOrgPart("marketingAutomations", "abandonedCart", {
                          ...org.marketingAutomations?.abandonedCart,
                          enabled: e.target.checked,
                        })
                      }
                    />
                    Abandoned Cart Recovery
                  </label>
                  <p className="text-sm text-slate-600">
                    Email subscribed customers who leave an online cart without checking out. This
                    uses your existing Mailgun recovery template and tokenized checkout link.
                  </p>
                  <div className="max-w-sm">
                    <Field
                      label="Send reminder after"
                      hint="Minimum 15 minutes; cron runs every 15 minutes, so delivery can be later than the selected delay."
                    >
                      <select
                        className={input}
                        value={org.marketingAutomations?.abandonedCart?.delayMinutes ?? 20}
                        onChange={(e) =>
                          setOrgPart("marketingAutomations", "abandonedCart", {
                            ...org.marketingAutomations?.abandonedCart,
                            delayMinutes: Number(e.target.value),
                          })
                        }
                      >
                        {[15, 20, 30, 45, 60, 120, 240, 1440].map((minutes) => (
                          <option key={minutes} value={minutes}>
                            {minutes < 60
                              ? `${minutes} minutes`
                              : minutes === 1440
                                ? "24 hours"
                                : `${minutes / 60} hours`}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>
                {[
                  {
                    key: "winback",
                    title: "Win-back Emails",
                    detail:
                      "Send opted-in customers a unique, single-use welcome-back promo after inactivity.",
                    fields: [["inactiveDays", "Days without an order", [7, 14, 30, 45, 60, 90]]],
                  },
                  {
                    key: "birthday",
                    title: "Birthday Rewards",
                    detail:
                      "Send a birthday email and a unique, single-use promo code. Customers can enter their birthday only once.",
                    fields: [],
                  },
                  {
                    key: "loyalty",
                    title: "Loyalty Reminders",
                    detail:
                      "Remind subscribed customers with redeemable restaurant loyalty points.",
                    fields: [
                      ["minimumPoints", "Minimum points", [50, 100, 150, 200, 500]],
                      ["cooldownDays", "Repeat no more often than (days)", [7, 14, 30, 60, 90]],
                    ],
                  },
                ].map(({ key, title, detail, fields }) => {
                  const config = org.marketingAutomations?.[key] || {};
                  const change = (field, value) =>
                    setOrgPart("marketingAutomations", key, { ...config, [field]: value });
                  return (
                    <div key={key} className="rounded-xl border border-slate-200 p-5 space-y-4">
                      <label className="flex items-center gap-3 font-semibold text-slate-900">
                        <input
                          type="checkbox"
                          checked={config.enabled === true}
                          onChange={(e) => change("enabled", e.target.checked)}
                        />
                        {title}
                      </label>
                      <p className="text-sm text-slate-500">{detail}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fields.map(([field, label, options]) => (
                          <Field key={field} label={label}>
                            <select
                              className={input}
                              value={config[field] ?? options[0]}
                              onChange={(e) => change(field, Number(e.target.value))}
                            >
                              {options.map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </Field>
                        ))}
                        <Field label="Email subject">
                          <input
                            className={input}
                            maxLength={160}
                            value={config.subject || ""}
                            onChange={(e) => change("subject", e.target.value)}
                          />
                        </Field>
                      </div>
                      {(key === "winback" || key === "birthday") && (
                        <div className="space-y-4 rounded-lg border border-orange-200 bg-orange-50/40 p-4">
                          <h4 className="text-sm font-semibold text-slate-900">Discount reward</h4>
                          <p className="text-xs text-slate-600">
                            Each eligible customer receives a unique code for one online order.
                            Discounts are enforced by the ordering API.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Discount type">
                              <select
                                className={input}
                                value={config.rewardType || "percent"}
                                onChange={(e) => change("rewardType", e.target.value)}
                              >
                                <option value="percent">Percentage off</option>
                                <option value="fixed">Fixed amount off</option>
                              </select>
                            </Field>
                            {config.rewardType === "fixed" ? (
                              <Field label="Discount amount ($)">
                                <input
                                  className={input}
                                  type="number"
                                  min="0.01"
                                  max="1000"
                                  step="0.01"
                                  value={
                                    Number(
                                      config.discountAmountCents ??
                                        (key === "birthday" ? 500 : 700),
                                    ) / 100
                                  }
                                  onChange={(e) =>
                                    change(
                                      "discountAmountCents",
                                      Math.max(1, Math.round(Number(e.target.value || 0) * 100)),
                                    )
                                  }
                                />
                              </Field>
                            ) : (
                              <>
                                <Field label="Discount (%)">
                                  <input
                                    className={input}
                                    type="number"
                                    min="1"
                                    max="100"
                                    step="1"
                                    value={config.discountPercent ?? (key === "birthday" ? 10 : 15)}
                                    onChange={(e) =>
                                      change(
                                        "discountPercent",
                                        Math.max(1, Math.min(100, Number(e.target.value || 1))),
                                      )
                                    }
                                  />
                                </Field>
                                <Field label="Maximum discount ($; 0 = no cap)">
                                  <input
                                    className={input}
                                    type="number"
                                    min="0"
                                    max="1000"
                                    step="0.01"
                                    value={
                                      Number(
                                        config.maxDiscountAmountCents ??
                                          (key === "birthday" ? 500 : 700),
                                      ) / 100
                                    }
                                    onChange={(e) =>
                                      change(
                                        "maxDiscountAmountCents",
                                        Math.max(0, Math.round(Number(e.target.value || 0) * 100)),
                                      )
                                    }
                                  />
                                </Field>
                              </>
                            )}
                            <Field label="Minimum food subtotal ($)">
                              <input
                                className={input}
                                type="number"
                                min="0"
                                max="10000"
                                step="0.01"
                                value={
                                  Number(
                                    config.minSubtotalCents ?? (key === "birthday" ? 1500 : 2000),
                                  ) / 100
                                }
                                onChange={(e) =>
                                  change(
                                    "minSubtotalCents",
                                    Math.max(0, Math.round(Number(e.target.value || 0) * 100)),
                                  )
                                }
                              />
                            </Field>
                            <Field label="Promo validity (days)">
                              <input
                                className={input}
                                type="number"
                                min="1"
                                max="90"
                                step="1"
                                value={config.validDays ?? 7}
                                onChange={(e) =>
                                  change(
                                    "validDays",
                                    Math.max(1, Math.min(90, Number(e.target.value || 1))),
                                  )
                                }
                              />
                            </Field>
                          </div>
                        </div>
                      )}
                      <Field label="Email message">
                        <textarea
                          className={input}
                          rows={3}
                          maxLength={2000}
                          value={config.message || ""}
                          onChange={(e) => change("message", e.target.value)}
                        />
                      </Field>
                    </div>
                  );
                })}
                <p className="text-xs text-slate-500">
                  Only customers subscribed to marketing emails at this restaurant location receive
                  abandoned-cart reminders. Transactional order emails are unaffected.
                </p>
              </fieldset>
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
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
                {!staffMode && !entitlements.smartUpsell && (
                  <div className="mb-4 rounded-lg border border-orange-300 bg-white p-3 text-sm text-orange-900">
                    <strong>Smart Upsell · Growth+</strong> — Preview available. Upgrade to Growth
                    or Pro to enable recommendations for customers.
                    <a className="ml-2 underline" href={billingUrl}>
                      View plans &amp; upgrade
                    </a>
                  </div>
                )}
                {staffMode && !entitlements.smartUpsell && (
                  <p className="mb-3 text-sm text-orange-900">
                    Staff can prepare upsell settings for onboarding, but recommendations are only
                    shown publicly on Growth or Pro.
                  </p>
                )}
                <label className="flex items-center gap-3 font-semibold">
                  <input
                    type="checkbox"
                    checked={org.smartUpsell?.enabled === true}
                    disabled={!staffMode && !entitlements.smartUpsell}
                    onChange={(e) =>
                      setOrg((prev) => ({
                        ...prev,
                        smartUpsell: { ...prev.smartUpsell, enabled: e.target.checked },
                      }))
                    }
                  />
                  Enable Smart Upsell
                </label>
                <p className="mt-2 text-sm text-slate-600">
                  Recommend complementary items without interrupting customers after Add to Cart.
                  Configure recommendations per item in Menu Manager.
                </p>
                <div className="mt-4 space-y-3 border-t border-orange-200 pt-4">
                  <p className="text-sm font-semibold text-slate-800">
                    Where to show recommendations
                  </p>
                  {[
                    ["showInItemModal", "Item Modal", "Up to 2 suggestions below modifiers"],
                    ["showInCart", "Shopping Cart", "Up to 3 suggestions inside cart"],
                    ["showInCheckout", "Checkout", "Coming soon; currently disabled"],
                  ].map(([field, label, help]) => (
                    <label key={field} className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1"
                        disabled={
                          field === "showInCheckout" || (!staffMode && !entitlements.smartUpsell)
                        }
                        checked={org.smartUpsell?.[field] ?? field !== "showInCheckout"}
                        onChange={(e) =>
                          setOrg((prev) => ({
                            ...prev,
                            smartUpsell: { ...prev.smartUpsell, [field]: e.target.checked },
                          }))
                        }
                      />
                      <span>
                        <span className="font-medium">{label}</span>
                        <span className="block text-slate-500">{help}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <PrintableOrderingQR
                organizationId={organizationId}
                customDomain={org.customDomainStatus === "verified" ? org.customDomain : ""}
                orderxoDomain={org.orderxoDomainStatus === "verified" ? org.orderxoDomain : ""}
                restaurantName={org.name}
                logoUrl={org.branding?.logoUrl}
                poster={org.ordering?.qrPoster || emptyOrg.ordering.qrPoster}
                onChange={(qrPoster) => setOrgPart("ordering", "qrPoster", qrPoster)}
              />
              <div className="max-w-xl">
                <div className="mt-5 space-y-4 rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold">Online Service Fee</h3>
                  <p className="text-sm text-gray-500">
                    Charged once per online order (fixed) or as a percentage of discounted food
                    subtotal. Tax and tips are excluded from the percentage base. Review local fee
                    disclosure and tax rules before enabling.
                  </p>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={org.ordering?.serviceFee?.enabled === true}
                      onChange={(e) =>
                        setOrgPart("ordering", "serviceFee", {
                          ...org.ordering.serviceFee,
                          enabled: e.target.checked,
                        })
                      }
                    />
                    Enable online service fee
                  </label>
                  <Field label="Fee type">
                    <select
                      className={input}
                      value={org.ordering?.serviceFee?.type || "fixed"}
                      onChange={(e) =>
                        setOrgPart("ordering", "serviceFee", {
                          ...org.ordering.serviceFee,
                          type: e.target.value,
                        })
                      }
                    >
                      <option value="fixed">Fixed amount per order</option>
                      <option value="per_item">Fixed amount per item</option>
                      <option value="percentage">Percentage of discounted food subtotal</option>
                    </select>
                  </Field>
                  {org.ordering?.serviceFee?.type === "percentage" ? (
                    <Field label="Fee percentage (%)">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.01"
                        className={input}
                        value={(org.ordering.serviceFee.percentageBps / 100).toFixed(2)}
                        onChange={(e) =>
                          setOrgPart("ordering", "serviceFee", {
                            ...org.ordering.serviceFee,
                            percentageBps: Math.max(
                              0,
                              Math.min(1000, Math.round(Number(e.target.value || 0) * 100)),
                            ),
                          })
                        }
                      />
                    </Field>
                  ) : org.ordering?.serviceFee?.type === "per_item" ? (
                    <Field label="Fixed fee per item ($)">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        className={input}
                        value={((org.ordering.serviceFee.perItemCents ?? 100) / 100).toFixed(2)}
                        onChange={(e) =>
                          setOrgPart("ordering", "serviceFee", {
                            ...org.ordering.serviceFee,
                            perItemCents: Math.max(
                              0,
                              Math.min(10000, Math.round(Number(e.target.value || 0) * 100)),
                            ),
                          })
                        }
                      />
                    </Field>
                  ) : (
                    <Field label="Fixed fee per order ($)">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        className={input}
                        value={(org.ordering.serviceFee.fixedCents / 100).toFixed(2)}
                        onChange={(e) =>
                          setOrgPart("ordering", "serviceFee", {
                            ...org.ordering.serviceFee,
                            fixedCents: Math.max(
                              0,
                              Math.min(10000, Math.round(Number(e.target.value || 0) * 100)),
                            ),
                          })
                        }
                      />
                    </Field>
                  )}
                  <p className="text-xs text-gray-500">
                    Example on $35 discounted food subtotal (3 items): $
                    {org.ordering?.serviceFee?.enabled
                      ? (
                          (org.ordering.serviceFee.type === "fixed"
                            ? org.ordering.serviceFee.fixedCents
                            : org.ordering.serviceFee.type === "per_item"
                              ? (org.ordering.serviceFee.perItemCents ?? 100) * 3
                              : Math.round(
                                  (3500 * org.ordering.serviceFee.percentageBps) / 10000,
                                )) / 100
                        ).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
                <div className="mt-7 grid gap-4">
                  {[
                    ["orderEmails", "Order notification emails"],
                    ["abandonedCartEmails", "Abandoned cart notification emails"],
                    ["giftCardEmails", "Gift card notification emails"],
                  ].map(([key, label]) => (
                    <Field
                      key={key}
                      label={label}
                      hint="Comma-separated email addresses. Stored per restaurant, not in server environment variables."
                    >
                      <input
                        className={input}
                        value={(org.notifications?.[key] || []).join(", ")}
                        onChange={(e) =>
                          setOrg((old) => ({
                            ...old,
                            notifications: {
                              ...old.notifications,
                              [key]: e.target.value
                                .split(",")
                                .map((v) => v.trim())
                                .filter(Boolean),
                            },
                          }))
                        }
                      />
                    </Field>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab !== "Homepage" && (
            <div className="mt-8 border-t pt-6">
              <button
                disabled={
                  saving ||
                  (!staffMode && !!entitlementError) ||
                  (tab === "Appearance" && !staffMode && !entitlements.appearanceCustomization) ||
                  (tab === "Marketing Automations" &&
                    !staffMode &&
                    !entitlements.marketingAutomations)
                }
                onClick={saveOrganization}
                className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          )}
        </section>
      </div>
      {upgradeFeature && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setUpgradeFeature(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upgrade-feature-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-orange-600">
                  Upgrade required
                </p>
                <h2 id="upgrade-feature-title" className="mt-2 text-xl font-bold">
                  Unlock {upgradeFeature}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close upgrade dialog"
                onClick={() => setUpgradeFeature(null)}
                className="rounded-lg px-2 py-1 text-xl text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>
            <p className="text-sm leading-6 text-slate-600">
              Your current {plan ? `${String(plan).toUpperCase()} ` : ""}subscription does not
              include {upgradeFeature}. Upgrade to Growth or Pro to enable this feature for your
              restaurant and its locations.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setUpgradeFeature(null)}
                className="rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700"
              >
                Not now
              </button>
              <Link
                href={billingUrl}
                className="rounded-xl bg-orange-600 px-4 py-2.5 font-semibold text-white hover:bg-orange-700"
              >
                View plans & upgrade →
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
