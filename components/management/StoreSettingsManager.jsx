"use client";
import { toast } from "react-toastify";
import LoadingSpinner from "../ui/LoadingSpinner";

import { ownerFetch } from "../../lib/ownerFetch";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Clock3, Images, Info, Pencil, Plus, Printer, Trash2, X } from "lucide-react";
import useRestaurantLocation from "./useRestaurantLocation";
import useRestaurantPermissions from "./useRestaurantPermissions";
import HomepageSlidesManager from "./HomepageSlidesManager";

const STORE_TAB_HASHES = {
  hours: "store-hours",
  notices: "notices",
  homepage: "homepage-slides",
  locationDetails: "location-details",
  printing: "printing",
};
const STORE_HASH_TABS = Object.fromEntries(
  Object.entries(STORE_TAB_HASHES).map(([tab, hash]) => [hash, tab]),
);
const storeTabFromHash = (hash) => {
  const raw = decodeURIComponent(String(hash || "").replace(/^#/, "")).toLowerCase();
  const value = raw.startsWith("tab=") ? raw.slice(4) : raw;
  return STORE_HASH_TABS[value] || null;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const defaultHours = () =>
  DAYS.map((day) => ({
    day,
    open: "11:00",
    close: "19:00",
    isClosed: false,
  }));

const emptyPrinting = {
  enabled: false,
  provider: "none",
  kitchen: {
    enabled: false,
    printerId: "",
    printerName: "",
    autoPrint: true,
  },
  receipt: {
    enabled: false,
    printerId: "",
    printerName: "",
    autoPrint: false,
  },
};

async function printerReq(org, locationId, method = "GET", body) {
  const q = new URLSearchParams({
    organizationId: org,
    locationId,
  });

  const r = await ownerFetch(`/api/owner/locations/settings?${q}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body
      ? JSON.stringify({
          ...body,
          organizationId: org,
          locationId,
        })
      : undefined,
    cache: "no-store",
  });

  const d = await r.json().catch(() => ({}));

  if (!r.ok) {
    throw new Error(d.error || "Printer settings request failed");
  }

  return d;
}

const emptyNotice = {
  title: "",
  message: "",
  type: "info",
  isActive: true,
  startsAt: "",
  endsAt: "",
};

async function req(path, org, loc, method = "GET", body) {
  const q = new URLSearchParams({
    organizationId: org,
    locationId: loc,
  });

  const r = await ownerFetch(`/api/owner/manage/${path}?${q}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body
      ? JSON.stringify({
          ...body,
          locationId: loc,
        })
      : undefined,
    cache: "no-store",
  });

  const d = await r.json();

  if (!r.ok) {
    throw new Error(d.error || "Request failed");
  }

  return d;
}

function localInput(v) {
  if (!v) return "";

  const d = new Date(v);

  if (Number.isNaN(d.getTime())) return "";

  const p = (n) => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(
    d.getDate(),
  )}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function StoreSettingsManager({ organizationId }) {
  const loc = useRestaurantLocation(organizationId);
  const searchParams = useSearchParams();
  const requestedLocationId = searchParams.get("locationId");
  const requestedTab = searchParams.get("tab");
  const permission = useRestaurantPermissions(organizationId);

  const canReadStore = permission.can("store.read");
  const canManage = permission.can("store.manage");
  const canReadHomepage = permission.can("homepage.read");
  const isAdmin = permission.isAdmin;
  // Staff with store.manage may edit restaurant-wide defaults, but does not
  // acquire owner/admin privileges elsewhere. Backend enforces this separately.
  const canEditRestaurantDefault =
    isAdmin || (permission.organization?.role === "staff" && canManage);

  const [scope, setScope] = useState("default");
  const [tab, setTab] = useState("hours");
  const isAllowedTab = useCallback(
    (candidate, currentScope) => {
      if (candidate === "homepage") return canReadHomepage;
      if (candidate === "hours" || candidate === "notices") return canReadStore;
      if (candidate === "locationDetails" || candidate === "printing") {
        return canReadStore && currentScope !== "default";
      }
      return false;
    },
    [canReadHomepage, canReadStore],
  );

  const selectStoreTab = useCallback(
    (nextTab) => {
      if (!isAllowedTab(nextTab, scope)) return;
      setTab(nextTab);
      const hash = STORE_TAB_HASHES[nextTab];
      if (hash && window.location.hash !== `#tab=${hash}`) {
        window.history.pushState(
          null,
          "",
          `${window.location.pathname}${window.location.search}#tab=${hash}`,
        );
      }
    },
    [isAllowedTab, scope],
  );

  // Deep links and browser Back/Forward navigation.
  useEffect(() => {
    if (permission.loading || loc.loading) return;
    const syncFromHash = () => {
      const requested = storeTabFromHash(window.location.hash);
      if (requested && isAllowedTab(requested, scope)) setTab(requested);
      else if (!isAllowedTab(tab, scope)) setTab(canReadStore ? "hours" : "homepage");
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener("popstate", syncFromHash);
    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("popstate", syncFromHash);
    };
  }, [permission.loading, loc.loading, isAllowedTab, scope, canReadStore]);

  const [useDefault, setUseDefault] = useState(false);

  const [manual, setManual] = useState(true);
  const [hours, setHours] = useState(defaultHours);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setErrorState] = useState("");
  const setError = (value) => {
    setErrorState(value);
    if (typeof value === "string" && value.trim()) toast.error(value);
  };
  const [message, setMessageState] = useState("");
  const setMessage = (value) => {
    setMessageState(value);
    if (typeof value === "string" && value.trim()) toast.success(value);
  };

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyNotice);
  const [noticeSaving, setNoticeSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [printing, setPrinting] = useState(emptyPrinting);
  const [printingLoading, setPrintingLoading] = useState(false);
  const [printingSaving, setPrintingSaving] = useState(false);

  const [locationDetails, setLocationDetails] = useState({
    address: { line1: "", line2: "", city: "", state: "", postalCode: "", country: "US" },
    phone: "",
    googleMapUrl: "",
    pickupInstructions: "",
  });
  const [locationOrdering, setLocationOrdering] = useState({
    taxRate: 0,
  });

  useEffect(() => {
    if (permission.loading) return;

    if (!canReadStore && canReadHomepage) {
      setTab("homepage");
    }
  }, [permission.loading, canReadStore, canReadHomepage]);

  useEffect(() => {
    if (
      !permission.loading &&
      !canEditRestaurantDefault &&
      scope === "default" &&
      loc.locations[0]
    ) {
      setScope(String(loc.locations[0]._id || loc.locations[0].id));
    }
  }, [permission.loading, canEditRestaurantDefault, scope, loc.locations]);

  useEffect(() => {
    if (
      requestedLocationId &&
      loc.locations.some((l) => String(l._id || l.id) === requestedLocationId)
    ) {
      setScope(requestedLocationId);
      if (!window.location.hash && STORE_TAB_HASHES[requestedTab]) {
        setTab(requestedTab);
      }
    }
  }, [requestedLocationId, requestedTab, loc.locations]);

  const selectedLocationId = scope === "default" ? "" : scope;

  const selectedLocation = loc.locations.find((l) => String(l._id || l.id) === selectedLocationId);

  const load = useCallback(async () => {
    if (scope !== "default" && !selectedLocationId) return;

    setLoading(true);
    setError("");

    try {
      const [a, n] = await Promise.all([
        req("store-config", organizationId, selectedLocationId),
        req("notices", organizationId, selectedLocationId),
      ]);

      const c = a.config || {};

      setUseDefault(Boolean(a.useDefault));
      setManual(c.isOpenManual !== false);

      if (Array.isArray(c.hours) && c.hours.length) {
        const map = new Map(c.hours.map((h) => [h.day, h]));

        setHours(
          DAYS.map(
            (day) =>
              map.get(day) || {
                day,
                open: "11:00",
                close: "19:00",
                isClosed: true,
              },
          ),
        );
      } else {
        setHours(defaultHours());
      }

      setNotices(n.notices || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [organizationId, scope, selectedLocationId]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!canManage) return;

    setSaving(true);
    setError("");

    try {
      await req(
        "store-config",
        organizationId,
        selectedLocationId,
        "PATCH",
        scope === "default"
          ? { hours }
          : {
              isOpenManual: manual,
              hours,
            },
      );

      setMessage(scope === "default" ? "Restaurant default hours saved" : "Store settings saved");

      setTimeout(() => setMessage(""), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const change = (i, k, v) => setHours((h) => h.map((x, n) => (n === i ? { ...x, [k]: v } : x)));

  const customize = async () => {
    if (!canManage) return;

    setSaving(true);
    setError("");

    try {
      await req("store-config", organizationId, selectedLocationId, "POST", {
        action: "customizeLocation",
      });

      setMessage(`Custom settings enabled for ${selectedLocation?.name || "location"}`);

      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const useRestaurantDefault = async () => {
    if (!canManage) return;

    setSaving(true);
    setError("");

    try {
      await req("store-config", organizationId, selectedLocationId, "POST", {
        action: "useRestaurantDefault",
      });

      setMessage(`Now using Restaurant Default for ${selectedLocation?.name || "location"}`);

      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const saveManual = async () => {
    if (!canManage) return;

    setSaving(true);
    setError("");

    try {
      await req("store-config", organizationId, selectedLocationId, "PATCH", {
        isOpenManual: manual,
      });

      setMessage("Ordering status saved");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const openNew = () => {
    if (!canManage) return;

    setEditing(null);
    setForm(emptyNotice);
    setModal(true);
  };

  const openEdit = (n) => {
    if (!canManage) return;

    setEditing(n);

    setForm({
      title: n.title || "",
      message: n.message || "",
      type: n.type || "info",
      isActive: n.isActive !== false,
      startsAt: localInput(n.startsAt),
      endsAt: localInput(n.endsAt),
    });

    setModal(true);
  };

  const saveNotice = async () => {
    if (!canManage) return;

    setNoticeSaving(true);
    setError("");

    try {
      await req("notices", organizationId, selectedLocationId, editing ? "PATCH" : "POST", {
        ...form,
        noticeId: editing?._id,
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
      });

      setModal(false);

      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setNoticeSaving(false);
    }
  };

  const toggleNotice = async (n) => {
    if (!canManage) return;

    try {
      await req("notices", organizationId, selectedLocationId, "PATCH", {
        noticeId: n._id,
        isActive: !n.isActive,
      });

      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const deleteNotice = async () => {
    if (!canManage) return;
    if (!deleting) return;

    try {
      await req("notices", organizationId, selectedLocationId, "DELETE", {
        noticeId: deleting._id,
      });

      setDeleting(null);

      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    if (scope === "default" || !selectedLocationId) return;

    let cancelled = false;

    (async () => {
      setPrintingLoading(true);

      try {
        const d = await printerReq(organizationId, selectedLocationId);

        if (cancelled) return;

        setPrinting({
          ...emptyPrinting,
          ...d.settings?.printing,
          kitchen: {
            ...emptyPrinting.kitchen,
            ...d.settings?.printing?.kitchen,
          },
          receipt: {
            ...emptyPrinting.receipt,
            ...d.settings?.printing?.receipt,
          },
        });

        setLocationDetails({
          address: d.settings?.address || {},
          phone: d.settings?.phone || "",
          googleMapUrl: d.settings?.googleMapUrl || "",
          pickupInstructions: d.settings?.pickupInstructions || "",
        });
        setLocationOrdering({
          taxRate: Number(d.settings?.ordering?.taxRate ?? 0),
        });
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
        }
      } finally {
        if (!cancelled) {
          setPrintingLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [organizationId, scope, selectedLocationId]);

  useEffect(() => {
    if (scope === "default" && tab === "printing") {
      setTab("hours");
    }
  }, [scope, tab]);

  const setPrintingField = (key, value) =>
    setPrinting((current) => ({
      ...current,
      [key]: value,
    }));

  const setPrinterField = (target, key, value) =>
    setPrinting((current) => ({
      ...current,
      [target]: {
        ...current[target],
        [key]: value,
      },
    }));

  const savePrinting = async () => {
    if (!canManage || !selectedLocationId) return;

    setPrintingSaving(true);
    setError("");

    try {
      const d = await printerReq(organizationId, selectedLocationId, "PATCH", {
        printing,
        ordering: locationOrdering,
        ...locationDetails,
      });

      setPrinting({
        ...emptyPrinting,
        ...d.settings?.printing,
        kitchen: {
          ...emptyPrinting.kitchen,
          ...d.settings?.printing?.kitchen,
        },
        receipt: {
          ...emptyPrinting.receipt,
          ...d.settings?.printing?.receipt,
        },
      });

      setLocationDetails({
        address: d.settings?.address || {},
        phone: d.settings?.phone || "",
        googleMapUrl: d.settings?.googleMapUrl || "",
        pickupInstructions: d.settings?.pickupInstructions || "",
      });
      setLocationOrdering({
        taxRate: Number(d.settings?.ordering?.taxRate ?? locationOrdering.taxRate ?? 0),
      });

      setMessage(`Location settings saved for ${selectedLocation?.name || "location"}.`);

      setTimeout(() => setMessage(""), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setPrintingSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-orange-600">
          OrderXO Manager
        </p>

        <h1 className="mt-1 text-3xl font-bold">Store settings</h1>

        <p className="mt-2 text-slate-600">
          Control business hours, notices, homepage slides, ordering status, and physical printer
          configuration.
        </p>

        <div className="mt-5 max-w-sm">
          <label className="mb-2 block text-sm font-semibold text-slate-700">Settings for</label>

          <select className="field" value={scope} onChange={(e) => setScope(e.target.value)}>
            {canEditRestaurantDefault && <option value="default">Restaurant Default</option>}

            {loc.locations.map((l) => (
              <option key={l._id || l.id} value={String(l._id || l.id)}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {(loc.error || error) && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{loc.error || error}</p>
        )}

        {!permission.loading && canReadStore && !canManage && (
          <p className="mt-4 rounded-lg border bg-white p-3 text-sm text-slate-700">
            <strong>Read only.</strong> Editing, deleting, status changes and customization require
            Manage store settings permission.
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-x-7 border-b border-slate-200">
          {canReadStore && (
            <>
              <button
                onClick={() => selectStoreTab("hours")}
                className={`flex items-center gap-2 border-b-[3px] px-2 py-4 text-base font-semibold transition-colors ${
                  tab === "hours"
                    ? "border-orange-600 text-orange-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Clock3 size={18} />
                Store Hours
              </button>

              <button
                onClick={() => selectStoreTab("notices")}
                className={`flex items-center gap-2 border-b-[3px] px-2 py-4 text-base font-semibold transition-colors ${
                  tab === "notices"
                    ? "border-orange-600 text-orange-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Info size={18} />
                Notices
              </button>
            </>
          )}

          {canReadHomepage && (
            <button
              onClick={() => selectStoreTab("homepage")}
              className={`flex items-center gap-2 border-b-[3px] px-2 py-4 text-base font-semibold transition-colors ${
                tab === "homepage"
                  ? "border-orange-600 text-orange-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Images size={18} />
              Homepage Slides
            </button>
          )}

          {canReadStore && scope !== "default" && (
            <button
              onClick={() => selectStoreTab("locationDetails")}
              className={`flex items-center gap-2 border-b-[3px] px-2 py-4 text-base font-semibold transition-colors ${tab === "locationDetails" ? "border-orange-600 text-orange-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              <Info size={18} /> Location Details
            </button>
          )}

          {canReadStore && scope !== "default" && (
            <button
              onClick={() => selectStoreTab("printing")}
              className={`flex items-center gap-2 border-b-[3px] px-2 py-4 text-base font-semibold transition-colors ${
                tab === "printing"
                  ? "border-orange-600 text-orange-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Printer size={18} />
              Printing
            </button>
          )}
        </div>

        {loading || loc.loading ? (
          <LoadingSpinner label="Loading store settings…" />
        ) : (
          (scope === "default" || selectedLocationId) && (
            <>
              {tab === "hours" && (
                <>
                  {scope !== "default" && (
                    <section className="mt-5 rounded-2xl border bg-white p-6">
                      <div className="flex flex-wrap items-center justify-between gap-5">
                        <div>
                          <h2 className="text-xl font-bold">Manual ordering status</h2>

                          <p className="mt-1 text-sm text-slate-500">
                            Always specific to {selectedLocation?.name || "this location"}. It never
                            inherits from Restaurant Default.
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setManual((v) => !v)}
                            className={`rounded-full px-5 py-2 font-semibold ${
                              manual ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {manual ? "Open" : "Closed"}
                          </button>

                          <button
                            disabled={!canManage || saving}
                            onClick={saveManual}
                            className="rounded-lg border px-3 py-2 text-sm font-semibold"
                          >
                            Save status
                          </button>
                        </div>
                      </div>
                    </section>
                  )}

                  {scope !== "default" && (
                    <section className="mt-4 rounded-2xl border bg-white p-5">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <h2 className="font-bold">Store configuration</h2>

                          <p className="mt-1 text-sm text-slate-500">
                            {useDefault
                              ? `${
                                  selectedLocation?.name || "This location"
                                } is using Restaurant Default hours and notices.`
                              : `${
                                  selectedLocation?.name || "This location"
                                } has custom hours and notices.`}
                          </p>
                        </div>

                        {useDefault ? (
                          <button
                            disabled={!canManage || saving}
                            onClick={customize}
                            className="primary"
                          >
                            Customize for this location
                          </button>
                        ) : (
                          <button
                            disabled={!canManage || saving}
                            onClick={useRestaurantDefault}
                            className="rounded-lg border px-4 py-2 font-semibold"
                          >
                            Use Restaurant Default
                          </button>
                        )}
                      </div>
                    </section>
                  )}

                  <section className="mt-4 rounded-2xl border bg-white p-6">
                    <h2 className="text-xl font-bold">Weekly hours</h2>

                    <div className="mt-5 space-y-3">
                      {hours.map((h, i) => (
                        <div
                          key={h.day}
                          className="grid items-center gap-3 border-b pb-3 last:border-0 md:grid-cols-[130px_110px_1fr_1fr]"
                        >
                          <strong>{h.day}</strong>

                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={h.isClosed}
                              disabled={!canManage || useDefault}
                              onChange={(e) => change(i, "isClosed", e.target.checked)}
                            />{" "}
                            Closed
                          </label>

                          <input
                            type="time"
                            disabled={!canManage || h.isClosed || useDefault}
                            className="field"
                            value={h.open}
                            onChange={(e) => change(i, "open", e.target.value)}
                          />

                          <input
                            type="time"
                            disabled={!canManage || h.isClosed || useDefault}
                            className="field"
                            value={h.close}
                            onChange={(e) => change(i, "close", e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </section>

                  <button
                    disabled={!canManage || saving || useDefault}
                    onClick={save}
                    className="primary mt-5"
                  >
                    {saving
                      ? "Saving…"
                      : scope === "default"
                        ? "Save default hours"
                        : "Save store hours"}
                  </button>
                </>
              )}

              {tab === "notices" && (
                <section className="mt-5 rounded-2xl border bg-white p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold">Notices</h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {scope === "default"
                          ? "Default announcements inherited by locations that use Restaurant Default."
                          : useDefault
                            ? `Inherited from Restaurant Default for ${
                                selectedLocation?.name || "this location"
                              }.`
                            : `Custom announcements for ${
                                selectedLocation?.name || "this location"
                              }.`}
                      </p>
                    </div>

                    <button
                      disabled={!canManage || useDefault}
                      onClick={openNew}
                      className="primary flex shrink-0 items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus size={17} />
                      Add notice
                    </button>
                  </div>

                  <div className="mt-5 space-y-3">
                    {!notices.length ? (
                      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">
                        No notices yet.
                      </div>
                    ) : (
                      notices.map((n) => (
                        <div key={n._id} className="rounded-xl border p-4">
                          <div className="flex flex-col justify-between gap-3 sm:flex-row">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <strong>{n.title || "Notice"}</strong>

                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    n.isActive
                                      ? "bg-green-100 text-green-800"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {n.isActive ? "Active" : "Inactive"}
                                </span>

                                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs capitalize text-orange-700">
                                  {n.type}
                                </span>
                              </div>

                              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                                {n.message}
                              </p>

                              {(n.startsAt || n.endsAt) && (
                                <p className="mt-2 text-xs text-slate-400">
                                  {n.startsAt
                                    ? `Starts ${new Date(n.startsAt).toLocaleString()}`
                                    : "Starts immediately"}{" "}
                                  ·{" "}
                                  {n.endsAt
                                    ? `Ends ${new Date(n.endsAt).toLocaleString()}`
                                    : "No end date"}
                                </p>
                              )}
                            </div>

                            {canManage && (
                              <div className="flex shrink-0 items-center gap-2">
                                <button
                                  disabled={!canManage || useDefault}
                                  className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-40"
                                  onClick={() => toggleNotice(n)}
                                >
                                  {n.isActive ? "Deactivate" : "Activate"}
                                </button>

                                <button
                                  disabled={!canManage || useDefault}
                                  className="rounded-lg border p-2 disabled:opacity-40"
                                  onClick={() => openEdit(n)}
                                  aria-label="Edit notice"
                                >
                                  <Pencil size={17} />
                                </button>

                                <button
                                  disabled={!canManage || useDefault}
                                  className="rounded-lg border p-2 text-red-600 disabled:opacity-40"
                                  onClick={() => setDeleting(n)}
                                  aria-label="Delete notice"
                                >
                                  <Trash2 size={17} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              )}

              {tab === "homepage" && canReadHomepage && (
                <section className="mt-5 rounded-2xl border bg-white p-6">
                  <HomepageSlidesManager
                    organizationId={organizationId}
                    embedded
                    scopeOverride={scope}
                  />
                </section>
              )}

              {(tab === "printing" || tab === "locationDetails") && scope !== "default" && (
                <section className="mt-5 rounded-2xl border bg-white p-6">
                  <div>
                    <h2 className="text-xl font-bold">
                      {tab === "locationDetails" ? "Location Details & Pickup Address" : "Printing"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {tab === "locationDetails"
                        ? "Set the address, phone, directions and pickup instructions customers see on your website and at checkout."
                        : `Printer settings for ${selectedLocation?.name || "this location"}. API credentials remain server-side.`}
                    </p>
                  </div>

                  {printingLoading ? (
                    <LoadingSpinner compact label="Loading printer settings…" />
                  ) : (
                    <>
                      {tab === "printing" && (
                        <>
                          {" "}
                          <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <label className="flex items-center gap-3 font-medium">
                              <input
                                disabled={!canManage}
                                type="checkbox"
                                checked={!!printing.enabled}
                                onChange={(e) => setPrintingField("enabled", e.target.checked)}
                              />
                              Enable printing
                            </label>

                            <div>
                              <label className="mb-2 block text-sm font-semibold">
                                Printer provider
                              </label>

                              <select
                                disabled={!canManage}
                                className="field"
                                value={printing.provider || "none"}
                                onChange={(e) => setPrintingField("provider", e.target.value)}
                              >
                                <option value="none">None</option>
                                <option value="printnode">PrintNode</option>
                                <option value="orderxo_agent">OrderXO Agent</option>
                              </select>
                            </div>
                          </div>
                          {["kitchen", "receipt"].map((target) => (
                            <div key={target} className="mt-6 rounded-xl border p-5">
                              <h3 className="font-bold capitalize">{target} printer</h3>

                              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <div>
                                  <label className="mb-2 block text-sm font-semibold">
                                    Printer ID
                                  </label>

                                  <input
                                    disabled={!canManage}
                                    className="field"
                                    placeholder="PrintNode printer ID"
                                    value={printing[target]?.printerId || ""}
                                    onChange={(e) =>
                                      setPrinterField(target, "printerId", e.target.value)
                                    }
                                  />
                                </div>

                                <div>
                                  <label className="mb-2 block text-sm font-semibold">
                                    Printer name
                                  </label>

                                  <input
                                    disabled={!canManage}
                                    className="field"
                                    placeholder="Kitchen printer"
                                    value={printing[target]?.printerName || ""}
                                    onChange={(e) =>
                                      setPrinterField(target, "printerName", e.target.value)
                                    }
                                  />
                                </div>

                                <label className="flex items-center gap-2 font-medium">
                                  <input
                                    disabled={!canManage}
                                    type="checkbox"
                                    checked={!!printing[target]?.enabled}
                                    onChange={(e) =>
                                      setPrinterField(target, "enabled", e.target.checked)
                                    }
                                  />
                                  Enabled
                                </label>

                                <label className="flex items-center gap-2 font-medium">
                                  <input
                                    disabled={!canManage}
                                    type="checkbox"
                                    checked={!!printing[target]?.autoPrint}
                                    onChange={(e) =>
                                      setPrinterField(target, "autoPrint", e.target.checked)
                                    }
                                  />
                                  Auto print
                                </label>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                      {/* FIXED: Fragment wraps tax + save button */}
                      {canManage && (
                        <>
                          {tab === "locationDetails" && (
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <h3 className="md:col-span-2 font-semibold text-lg">
                                Location Details & Pickup Address
                              </h3>
                              {[
                                ["line1", "Street address"],
                                ["line2", "Suite / unit"],
                                ["city", "City"],
                                ["state", "State"],
                                ["postalCode", "ZIP / postal code"],
                                ["country", "Country"],
                              ].map(([key, label]) => (
                                <label key={key} className="text-sm font-medium text-slate-700">
                                  {label}
                                  <input
                                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                                    value={locationDetails.address?.[key] || ""}
                                    onChange={(e) =>
                                      setLocationDetails((v) => ({
                                        ...v,
                                        address: { ...v.address, [key]: e.target.value },
                                      }))
                                    }
                                  />
                                </label>
                              ))}
                              {[
                                ["phone", "Phone number"],
                                ["googleMapUrl", "Google Maps directions URL"],
                                ["pickupInstructions", "Pickup instructions"],
                              ].map(([key, label]) => (
                                <label key={key} className="text-sm font-medium text-slate-700">
                                  {label}
                                  <input
                                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                                    value={locationDetails[key] || ""}
                                    onChange={(e) =>
                                      setLocationDetails((v) => ({ ...v, [key]: e.target.value }))
                                    }
                                  />
                                </label>
                              ))}
                            </div>
                          )}
                          {tab === "printing" && (
                            <div className="mt-6 max-w-sm">
                              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Sales tax rate (%)
                              </label>

                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.001"
                                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm"
                                value={(Number(locationOrdering.taxRate || 0) * 100).toString()}
                                onChange={(e) =>
                                  setLocationOrdering((current) => ({
                                    ...current,
                                    taxRate: Math.max(
                                      0,
                                      Math.min(1, Number(e.target.value || 0) / 100),
                                    ),
                                  }))
                                }
                              />

                              <p className="mt-1 text-xs text-slate-500">
                                Location-specific tax rate used by customer checkout, e.g. 9.2 for
                                9.2%.
                              </p>
                            </div>
                          )}

                          <button
                            disabled={printingSaving}
                            onClick={savePrinting}
                            className="primary mt-6"
                          >
                            {printingSaving
                              ? "Saving…"
                              : tab === "locationDetails"
                                ? "Save location details"
                                : "Save printing & tax"}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </section>
              )}
            </>
          )
        )}
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={() => setModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{editing ? "Edit notice" : "Add notice"}</h2>

              <button onClick={() => setModal(false)} className="rounded-lg p-2">
                <X />
              </button>
            </div>

            <label className="mt-5 block text-sm font-semibold">Title</label>

            <input
              className="field mt-2"
              maxLength={120}
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                })
              }
              placeholder="Special hours"
            />

            <label className="mt-4 block text-sm font-semibold">Message *</label>

            <textarea
              className="field mt-2 min-h-28"
              maxLength={1000}
              value={form.message}
              onChange={(e) =>
                setForm({
                  ...form,
                  message: e.target.value,
                })
              }
              placeholder="We will close at 5 PM today."
            />

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold">Type</label>

                <select
                  className="field mt-2"
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value,
                    })
                  }
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="important">Important</option>
                </select>
              </div>

              <label className="flex items-end gap-2 pb-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      isActive: e.target.checked,
                    })
                  }
                />{" "}
                Active
              </label>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold">Starts</label>

                <input
                  type="datetime-local"
                  className="field mt-2"
                  value={form.startsAt}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      startsAt: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold">Ends</label>

                <input
                  type="datetime-local"
                  className="field mt-2"
                  value={form.endsAt}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      endsAt: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-lg border px-4 py-2 font-semibold"
                onClick={() => setModal(false)}
              >
                Cancel
              </button>

              <button
                className="primary"
                disabled={!canManage || noticeSaving || !form.message.trim()}
                onClick={saveNotice}
              >
                {noticeSaving ? "Saving…" : editing ? "Save changes" : "Add notice"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold">Delete notice?</h2>

            <p className="mt-2 text-sm text-slate-600">
              This permanently removes “{deleting.title || "Notice"}”.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-lg border px-4 py-2 font-semibold"
                onClick={() => setDeleting(null)}
              >
                Cancel
              </button>

              <button
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white"
                onClick={deleteNotice}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
