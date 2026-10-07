"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
const PERMS = [
  ["orders.read", "View orders"],
  ["orders.update", "Manage orders"],
  ["menu.read", "View menu"],
  ["menu.update", "Customize menu"],
  ["promotions.manage", "Promotions"],
  ["giftcards.manage", "Gift cards"],
  ["customers.read", "Customers"],
  ["reports.read", "Financial reports"],
  ["settings.manage", "Store & homepage settings"],
];
export default function Team() {
  const { organizationId } = useParams(),
    [locations, setLocations] = useState([]),
    [team, setTeam] = useState({ members: [], invitations: [] }),
    [form, setForm] = useState({
      email: "",
      role: "manager",
      locationIds: [],
      permissions: PERMS.map((x) => x[0]),
    }),
    [msg, setMsg] = useState("");
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
  const toggle = (key, id) =>
    setForm((f) => ({
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
    setForm((f) => ({ ...f, email: "" }));
    load();
  };
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          className="text-sm font-semibold text-orange-600"
          href={`/dashboard/restaurants/${organizationId}`}
        >
          ← Restaurant workspace
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-orange-600">
          OrderXO Manager
        </p>
        <h1 className="text-3xl font-bold">Admins & Managers</h1>
        <p className="mt-1 text-slate-500">
          Admins can access every location. Managers only access assigned locations and permissions.
        </p>
        <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_420px]">
          <section className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-bold">Team</h2>
            <div className="mt-4 divide-y">
              {(team.members || []).map((m) => (
                <div key={m._id} className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-semibold">{m.userId?.name || m.userId?.email}</p>
                    <p className="text-sm text-slate-500">{m.userId?.email}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold capitalize">
                    {m.isOwner ? "Owner" : m.role}
                  </span>
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
                        onChange={() => toggle("locationIds", l._id || l.id)}
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
                        onChange={() => toggle("permissions", p)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </>
            )}{" "}
            {msg && <p className="mt-4 text-sm text-orange-700">{msg}</p>}
            <button className="primary mt-5 w-full" onClick={invite}>
              Send invitation
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}
