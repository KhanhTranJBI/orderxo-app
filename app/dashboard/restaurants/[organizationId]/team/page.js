"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { LockKeyhole, Pencil, X } from "lucide-react";

const PERMS = [
  ["orders.read", "View orders"],
  ["orders.manage", "Manage orders"],
  ["menu.read", "View menu"],
  ["menu.manage", "Customize menu"],
  ["promotions.read", "View promotions"],
  ["promotions.manage", "Manage promotions"],
  ["giftcards.read", "View gift cards"],
  ["giftcards.manage", "Manage gift cards"],
  ["customers.read", "View customers"],
  ["customers.manage", "Manage customers"],
  ["financials.read", "View financial reports"],
  ["store.read", "View store settings"],
  ["store.manage", "Manage store settings"],
  ["homepage.read", "View homepage"],
  ["homepage.manage", "Manage homepage"],
];
const defaultPermissions = PERMS.map((x) => x[0]);
const normalizePermissions = (ps = []) => {
  const s = new Set(ps);
  if (s.has("orders.update")) s.add("orders.manage");
  if (s.has("menu.update") || s.has("menu.create") || s.has("menu.delete")) s.add("menu.manage");
  if (s.has("reports.read")) s.add("financials.read");
  if (s.has("settings.read")) {
    s.add("store.read");
    s.add("homepage.read");
  }
  if (s.has("settings.manage")) {
    s.add("store.manage");
    s.add("homepage.manage");
  }
  return [...s];
};
const blank = { email: "", role: "manager", locationIds: [], permissions: defaultPermissions };

export default function Team() {
  const { organizationId } = useParams();
  const [locations, setLocations] = useState([]),
    [team, setTeam] = useState({ members: [], invitations: [] }),
    [form, setForm] = useState(blank),
    [msg, setMsg] = useState(""),
    [editing, setEditing] = useState(null),
    [saving, setSaving] = useState(false);
  const load = async () => {
    const [a, b] = await Promise.all([
      fetch(`/api/owner/team?organizationId=${organizationId}`),
      fetch(`/api/owner/locations?organizationId=${organizationId}`),
    ]);
    if (a.status === 401) {
      location.href = "/login?message=session_expired";
      return;
    }
    const ad = await a.json(),
      bd = await b.json();
    setTeam(ad);
    setLocations(bd.locations || []);
  };
  useEffect(() => {
    load();
  }, [organizationId]);
  const toggle = (setter, key, id) =>
    setter((f) => ({
      ...f,
      [key]: f[key].includes(id) ? f[key].filter((x) => x !== id) : [...f[key], id],
    }));
  const invite = async () => {
    setMsg("");
    const r = await fetch("/api/owner/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, organizationId }),
    });
    const d = await r.json();
    if (!r.ok) return setMsg(d.error || "Unable to invite");
    setMsg("Invitation email sent.");
    setForm(blank);
    load();
  };
  const isProtectedOwner = (m) => Boolean(m?.isOwner || m?.role === "owner");
  const openEdit = (m) => {
    if (isProtectedOwner(m)) return;
    setEditing({
      _id: m._id,
      name: m.userId?.name || "",
      email: m.userId?.email || "",
      role: m.role,
      locationIds: (m.locationIds || []).map(String),
      permissions:
        m.role === "admin" ? defaultPermissions : normalizePermissions(m.permissions || []),
      status: m.status || "active",
      isOwner: false,
    });
  };
  const saveEdit = async () => {
    setSaving(true);
    setMsg("");
    const r = await fetch("/api/owner/team/member", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        memberId: editing._id,
        role: editing.role,
        locationIds: editing.locationIds,
        permissions: editing.permissions,
        status: editing.status,
      }),
    });
    const d = await r.json();
    setSaving(false);
    if (!r.ok) {
      setMsg(d.error || "Unable to update team member");
      return;
    }
    setEditing(null);
    setMsg("Team member updated.");
    load();
  };
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <Link className="text-sm font-semibold text-orange-600" href={`/dashboard`}>
          ← Dashboard
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-orange-600">
          OrderXO Manager
        </p>
        <h1 className="text-3xl font-bold">Admins & Managers</h1>
        <p className="mt-1 text-slate-500">
          Admins can access every location. Managers only access assigned locations and permissions.
        </p>
        {msg && (
          <p className="mt-4 rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-800">{msg}</p>
        )}
        <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_420px]">
          <section className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-bold">Team</h2>
            <div className="mt-4 divide-y">
              {(team.members || []).map((m) => (
                <div key={m._id} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{m.userId?.name || m.userId?.email}</p>
                    <p className="truncate text-sm text-slate-500">{m.userId?.email}</p>
                    {m.role === "manager" && (
                      <p className="mt-1 text-xs text-slate-400">
                        {(m.locationIds || []).length} location(s) · {(m.permissions || []).length}{" "}
                        permission(s)
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold capitalize">
                      {isProtectedOwner(m) ? "Owner" : m.role}
                    </span>
                    {isProtectedOwner(m) ? (
                      <span className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-50 px-3 text-xs font-semibold text-slate-500">
                        <LockKeyhole size={14} /> Primary owner · Protected
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openEdit(m)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil size={15} /> Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {(team.invitations || []).map((i) => (
                <div key={i._id} className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-semibold">{i.email}</p>
                    <p className="text-sm text-slate-500">Invitation pending</p>
                  </div>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold capitalize text-orange-700">
                    {i.role}
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-bold">Invite team member</h2>
            <input
              className="field mt-4"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <label className="mt-4 block text-sm font-semibold">Role</label>
            <select
              className="field mt-1"
              value={form.role}
              onChange={(e) =>
                setForm({
                  ...form,
                  role: e.target.value,
                  locationIds: e.target.value === "admin" ? [] : form.locationIds,
                })
              }
            >
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            {form.role === "manager" && (
              <>
                <p className="mt-4 text-sm font-semibold">Locations</p>
                <div className="mt-2 space-y-2">
                  {locations.map((l) => (
                    <label key={l._id || l.id} className="flex gap-2">
                      <input
                        type="checkbox"
                        checked={form.locationIds.includes(l._id || l.id)}
                        onChange={() => toggle(setForm, "locationIds", l._id || l.id)}
                      />
                      {l.name}
                    </label>
                  ))}
                </div>
                <p className="mt-4 text-sm font-semibold">Permissions</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {PERMS.map(([p, label]) => (
                    <label key={p} className="flex gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.permissions.includes(p)}
                        onChange={() => toggle(setForm, "permissions", p)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </>
            )}
            <button className="primary mt-5 w-full" onClick={invite}>
              Send invitation
            </button>
          </section>
        </div>
      </div>
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={() => setEditing(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">Edit team member</h2>
                <p className="mt-1 text-sm text-slate-500">{editing.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>
            <label className="mt-5 block text-sm font-semibold">Role</label>
            <select
              className="field mt-1"
              value={editing.role}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  role: e.target.value,
                  locationIds: e.target.value === "admin" ? [] : editing.locationIds,
                })
              }
            >
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            {editing.role === "admin" ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                Admins have full access to all restaurant locations and management features.
              </div>
            ) : (
              <>
                <p className="mt-5 text-sm font-semibold">Locations</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {locations.map((l) => {
                    const id = String(l._id || l.id);
                    return (
                      <label key={id} className="flex gap-2">
                        <input
                          type="checkbox"
                          checked={editing.locationIds.includes(id)}
                          onChange={() => toggle(setEditing, "locationIds", id)}
                        />
                        {l.name}
                      </label>
                    );
                  })}
                </div>
                <p className="mt-5 text-sm font-semibold">Permissions</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {PERMS.map(([p, label]) => (
                    <label key={p} className="flex gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editing.permissions.includes(p)}
                        onChange={() => toggle(setEditing, "permissions", p)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </>
            )}
            <label className="mt-5 block text-sm font-semibold">Access status</label>
            <select
              className="field mt-1"
              value={editing.status}
              onChange={(e) => setEditing({ ...editing, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-xl border px-4 py-2 font-semibold"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button type="button" className="primary px-5" disabled={saving} onClick={saveEdit}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
