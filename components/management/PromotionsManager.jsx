"use client";
import { useEffect, useState } from "react";
import LocationPageShell from "./LocationPageShell";
export default function PromotionsManager({ organizationId }) {
  return (
    <LocationPageShell
      organizationId={organizationId}
      title="Promotions"
      description="Promotion codes for the selected location."
    >
      {({ locationId }) => <Promos organizationId={organizationId} locationId={locationId} />}
    </LocationPageShell>
  );
}
function Promos({ organizationId, locationId }) {
  const [items, setItems] = useState([]),
    [open, setOpen] = useState(false),
    [edit, setEdit] = useState(null),
    [err, setErr] = useState("");
  const load = async () => {
    if (!locationId) return;
    let r = await fetch(
        `/api/owner/manage/admin/promotions?organizationId=${organizationId}&locationId=${locationId}`,
        { cache: "no-store" },
      ),
      d = await r.json();
    if (r.ok) {
      setItems(d.promotions || []);
      setErr("");
    } else setErr(d.error || "Unable to load promotions");
  };
  useEffect(() => {
    load();
  }, [locationId]);
  const toggle = async (p) => {
    await fetch(
      `/api/owner/manage/admin/promotions/update-active?organizationId=${organizationId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, locationId, id: p._id, isActive: !p.active }),
      },
    );
    load();
  };
  return (
    <section className="mt-8">
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => {
            setEdit(null);
            setOpen(true);
          }}
          className="rounded-xl bg-orange-600 px-4 py-2 font-semibold text-white"
        >
          + Add promotion
        </button>
      </div>
      {err && <p className="rounded-xl bg-red-50 p-4 text-red-700">{err}</p>}
      <div className="space-y-3">
        {items.map((p) => (
          <div
            key={p._id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-5"
          >
            <div>
              <b className="text-lg">{p.code}</b>
              <p className="text-sm text-slate-500">{p.description || "No description"}</p>
              <p className="mt-1 text-sm">
                {p.discountType === "percent"
                  ? `${(p.discountRateBps || 0) / 100}% off`
                  : `$${((p.discountAmountCents || 0) / 100).toFixed(2)} off`}{" "}
                · Used {p.usageCount || 0}
                {p.usageLimit ? ` / ${p.usageLimit}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toggle(p)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${p.active ? "bg-green-100 text-green-700" : "bg-slate-100"}`}
              >
                {p.active ? "Active" : "Inactive"}
              </button>
              <button
                onClick={() => {
                  setEdit(p);
                  setOpen(true);
                }}
                className="rounded-lg border px-3 py-2 text-sm font-semibold"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
      {open && (
        <PromoModal
          p={edit}
          organizationId={organizationId}
          locationId={locationId}
          close={() => setOpen(false)}
          saved={() => {
            setOpen(false);
            load();
          }}
        />
      )}
    </section>
  );
}
function PromoModal({ p, organizationId, locationId, close, saved }) {
  const [code, setCode] = useState(p?.code || ""),
    [description, setDescription] = useState(p?.description || ""),
    [type, setType] = useState(p?.discountType || "percent"),
    [value, setValue] = useState(
      p
        ? p.discountType === "percent"
          ? (p.discountRateBps || 0) / 100
          : (p.discountAmountCents || 0) / 100
        : 10,
    ),
    [busy, setBusy] = useState(false),
    [err, setErr] = useState("");
  async function save() {
    setBusy(true);
    let body = {
      organizationId,
      locationId,
      code,
      description,
      discountType: type,
      discountRateBps: type === "percent" ? Math.round(Number(value) * 100) : null,
      discountAmountCents: type === "fixed" ? Math.round(Number(value) * 100) : null,
    };
    if (p) body.id = p._id;
    let path = p ? "update" : "create";
    let r = await fetch(
        `/api/owner/manage/admin/promotions/${path}?organizationId=${organizationId}`,
        {
          method: p ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      ),
      d = await r.json();
    setBusy(false);
    if (!r.ok) setErr(d.error || "Unable to save");
    else saved();
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6">
        <h2 className="text-xl font-bold">{p ? "Edit promotion" : "New promotion"}</h2>
        {err && <p className="mt-3 text-red-600">{err}</p>}
        <div className="mt-4 grid gap-4">
          <input
            className="rounded-lg border p-3"
            placeholder="Code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <input
            className="rounded-lg border p-3"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              className="rounded-lg border p-3"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="percent">Percent</option>
              <option value="fixed">Fixed amount</option>
            </select>
            <input
              type="number"
              className="rounded-lg border p-3"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={close} className="rounded-lg border px-4 py-2">
            Cancel
          </button>
          <button
            disabled={busy}
            onClick={save}
            className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
