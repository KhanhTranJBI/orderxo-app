"use client";
import { ownerFetch } from "../../lib/ownerFetch";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Clock3, Info, Pencil, Plus, Trash2, X } from "lucide-react";
import useRestaurantLocation from "./useRestaurantLocation";
import useRestaurantPermissions from "./useRestaurantPermissions";
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const defaultHours = () =>
  DAYS.map((day) => ({ day, open: "11:00", close: "19:00", isClosed: false }));
const emptyNotice = {
  title: "",
  message: "",
  type: "info",
  isActive: true,
  startsAt: "",
  endsAt: "",
};
async function req(path, org, loc, method = "GET", body) {
  const q = new URLSearchParams({ organizationId: org, locationId: loc });
  const r = await ownerFetch(`/api/owner/manage/${path}?${q}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify({ ...body, locationId: loc }) : undefined,
    cache: "no-store",
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Request failed");
  return d;
}
function localInput(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
export default function StoreSettingsManager({ organizationId }) {
  const loc = useRestaurantLocation(organizationId);
  const permission = useRestaurantPermissions(organizationId);
  const canManage = permission.can("store.manage");
  const isAdmin = permission.isAdmin;
  const [tab, setTab] = useState("hours");
  const [scope, setScope] = useState("default"),
    [useDefault, setUseDefault] = useState(false);
  const [manual, setManual] = useState(true),
    [hours, setHours] = useState(defaultHours),
    [notices, setNotices] = useState([]),
    [loading, setLoading] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [modal, setModal] = useState(false),
    [editing, setEditing] = useState(null),
    [form, setForm] = useState(emptyNotice),
    [noticeSaving, setNoticeSaving] = useState(false),
    [deleting, setDeleting] = useState(null);
  useEffect(() => {
    if (!permission.loading && !isAdmin && scope === "default" && loc.locations[0]) {
      setScope(String(loc.locations[0]._id || loc.locations[0].id));
    }
  }, [permission.loading, isAdmin, scope, loc.locations]);
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
          DAYS.map((day) => map.get(day) || { day, open: "11:00", close: "19:00", isClosed: true }),
        );
      } else setHours(defaultHours());
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
        scope === "default" ? { hours } : { isOpenManual: manual, hours },
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
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/dashboard/restaurants/${organizationId}`}
          className="text-sm font-semibold text-orange-600"
        >
          ← Restaurant workspace
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-orange-600">
          OrderXO Manager
        </p>
        <h1 className="mt-1 text-3xl font-bold">Store settings</h1>
        <p className="mt-2 text-slate-600">
          Control ordering status, weekly business hours, and location notices.
        </p>
        <div className="mt-5 max-w-sm">
          <label className="mb-2 block text-sm font-semibold text-slate-700">Settings for</label>
          <select className="field" value={scope} onChange={(e) => setScope(e.target.value)}>
            {isAdmin && <option value="default">Restaurant Default</option>}
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
        {message && (
          <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p>
        )}
        {!permission.loading && !canManage && (
          <p className="mt-4 rounded-lg border bg-white p-3 text-sm text-slate-700">
            <strong>Read only.</strong> Editing, deleting, status changes and customization require
            Manage store settings permission.
          </p>
        )}
        <div className="mt-6 flex gap-6 border-b bg-white px-5 pt-1 rounded-t-2xl border-x border-t">
          <button
            onClick={() => setTab("hours")}
            className={`flex items-center gap-2 border-b-2 px-1 py-4 font-semibold ${tab === "hours" ? "border-orange-500 text-orange-600" : "border-transparent text-slate-500"}`}
          >
            <Clock3 size={18} /> Store Hours
          </button>
          <button
            onClick={() => setTab("notices")}
            className={`flex items-center gap-2 border-b-2 px-1 py-4 font-semibold ${tab === "notices" ? "border-orange-500 text-orange-600" : "border-transparent text-slate-500"}`}
          >
            <Info size={18} /> Notices
          </button>
        </div>
        {loading || loc.loading ? (
          <p className="mt-6">Loading settings…</p>
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
                            className={`rounded-full px-5 py-2 font-semibold ${manual ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-700"}`}
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
                              ? `${selectedLocation?.name || "This location"} is using Restaurant Default hours and notices.`
                              : `${selectedLocation?.name || "This location"} has custom hours and notices.`}
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
                            ? `Inherited from Restaurant Default for ${selectedLocation?.name || "this location"}.`
                            : `Custom announcements for ${selectedLocation?.name || "this location"}.`}
                      </p>
                    </div>
                    <button
                      disabled={!canManage || useDefault}
                      onClick={openNew}
                      className="primary flex shrink-0 items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus size={17} /> Add notice
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
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${n.isActive ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}
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
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Special hours"
            />
            <label className="mt-4 block text-sm font-semibold">Message *</label>
            <textarea
              className="field mt-2 min-h-28"
              maxLength={1000}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="We will close at 5 PM today."
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold">Type</label>
                <select
                  className="field mt-2"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
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
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
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
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold">Ends</label>
                <input
                  type="datetime-local"
                  className="field mt-2"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
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
