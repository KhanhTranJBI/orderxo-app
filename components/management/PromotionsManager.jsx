"use client";
import { ownerFetch } from "../../lib/ownerFetch";
import { useEffect, useState } from "react";
import { Plus, Pencil, Power, X, Tag } from "lucide-react";
import LocationPageShell from "./LocationPageShell";
const dt = (v) => (v ? new Date(v).toISOString().slice(0, 16) : "");
const money = (c) => `$${((Number(c) || 0) / 100).toFixed(2)}`;
export default function PromotionsManager({ organizationId }) {
  return (
    <LocationPageShell
      organizationId={organizationId}
      title="Promotions"
      description="Create and manage promo codes for the selected location."
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
    const r = await ownerFetch(
        `/api/owner/manage/admin/promotions?organizationId=${organizationId}&locationId=${locationId}`,
        { cache: "no-store" },
      ),
      d = await r.json();
    r.ok
      ? (setItems(d.promotions || []), setErr(""))
      : setErr(d.error || "Unable to load promotions");
  };
  useEffect(() => {
    load();
  }, [locationId]);
  const toggle = async (p) => {
    await ownerFetch(
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
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => {
            setEdit(null);
            setOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 font-bold text-white shadow-sm hover:bg-orange-700"
        >
          <Plus size={18} /> Add Promotion
        </button>
      </div>
      {err && <p className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">{err}</p>}
      <div className="space-y-4">
        {items.map((p) => (
          <div
            key={p._id}
            className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <Tag />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <b className="text-xl">{p.code}</b>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.active ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}
                  >
                    {p.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="mt-1 text-slate-500">{p.description || "No description"}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                  <b className="text-slate-900">
                    {p.discountType === "percent"
                      ? `${(p.discountRateBps || 0) / 100}% off`
                      : `${money(p.discountAmountCents)} off`}
                  </b>
                  <span>Min {money(p.minSubtotalCents)}</span>
                  <span>{(p.channels || []).join(", ")}</span>
                  <span>
                    Usage {p.usageCount || 0}
                    {p.usageLimit ? ` / ${p.usageLimit}` : " / ∞"}
                  </span>
                </div>
                {p.startsAt && (
                  <p className="mt-2 text-xs text-slate-400">
                    Starts {new Date(p.startsAt).toLocaleString()}
                    {p.endsAt ? ` • Ends ${new Date(p.endsAt).toLocaleString()}` : ""}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setEdit(p);
                  setOpen(true);
                }}
                className="flex items-center gap-1.5 font-semibold text-slate-700"
              >
                <Pencil size={17} /> Edit
              </button>
              <button
                onClick={() => toggle(p)}
                className={`flex items-center gap-1.5 font-semibold ${p.active ? "text-red-600" : "text-green-600"}`}
              >
                <Power size={17} />
                {p.active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        ))}
      </div>
      {!err && !items.length && (
        <p className="py-12 text-center text-slate-500">No promotions found</p>
      )}
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
  const [f, setF] = useState({
      code: p?.code || "",
      description: p?.description || "",
      discountType: p?.discountType || "percent",
      discountValue: p
        ? p.discountType === "percent"
          ? (p.discountRateBps || 0) / 100
          : (p.discountAmountCents || 0) / 100
        : "",
      maxDiscountAmount: p?.maxDiscountAmountCents != null ? p.maxDiscountAmountCents / 100 : "",
      minSubtotal: p?.minSubtotalCents ? p.minSubtotalCents / 100 : "",
      channels: p?.channels?.length ? p.channels : ["online"],
      usageLimit: p?.usageLimit ?? "",
      perCustomerLimit: p?.perCustomerLimit ?? 1,
      startsAt: dt(p?.startsAt),
      endsAt: dt(p?.endsAt),
      active: p?.active !== false,
    }),
    [busy, setBusy] = useState(false),
    [err, setErr] = useState("");
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const channel = (c) =>
    set(
      "channels",
      f.channels.includes(c)
        ? f.channels.length === 1
          ? f.channels
          : f.channels.filter((x) => x !== c)
        : [...f.channels, c],
    );
  async function save() {
    setBusy(true);
    setErr("");
    const body = {
      organizationId,
      locationId,
      code: f.code.trim().toUpperCase(),
      description: f.description.trim(),
      discountType: f.discountType,
      discountRateBps:
        f.discountType === "percent" ? Math.round(Number(f.discountValue) * 100) : null,
      discountAmountCents:
        f.discountType === "fixed" ? Math.round(Number(f.discountValue) * 100) : null,
      maxDiscountAmountCents:
        f.discountType === "percent" && f.maxDiscountAmount !== ""
          ? Math.round(Number(f.maxDiscountAmount) * 100)
          : null,
      minSubtotalCents: f.minSubtotal !== "" ? Math.round(Number(f.minSubtotal) * 100) : 0,
      channels: f.channels,
      usageLimit: f.usageLimit !== "" ? Number(f.usageLimit) : null,
      perCustomerLimit: Number(f.perCustomerLimit || 1),
      startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : null,
      endsAt: f.endsAt ? new Date(f.endsAt).toISOString() : null,
      active: f.active,
    };
    if (p) body.id = p._id;
    const r = await ownerFetch(
        `/api/owner/manage/admin/promotions/${p ? "update" : "create"}?organizationId=${organizationId}`,
        {
          method: p ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      ),
      d = await r.json();
    setBusy(false);
    r.ok ? saved() : setErr(d.error || "Unable to save promotion");
  }
  const input =
    "w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
      <div className="flex max-h-[96vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold">{p ? "Edit Promotion" : "Create Promotion"}</h2>
            <p className="text-slate-500">
              {p ? "Update this promo code" : "Create a new promo code"}
            </p>
          </div>
          <button onClick={close} className="rounded-lg p-2 hover:bg-slate-100">
            <X />
          </button>
        </div>
        <div className="space-y-5 overflow-y-auto p-6">
          {err && <p className="rounded-lg bg-red-50 p-3 text-red-700">{err}</p>}
          <label className="block">
            <b>Promo Code</b>
            <input
              className={`${input} mt-2`}
              placeholder="SAVE10"
              value={f.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
            />
            <span className="mt-1 block text-xs text-slate-500">Example: SAVE10, WELCOME5</span>
          </label>
          <label className="block">
            <b>Description</b>
            <input
              className={`${input} mt-2`}
              placeholder="10% off your order"
              value={f.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <b>Discount Type</b>
              <select
                className={`${input} mt-2`}
                value={f.discountType}
                onChange={(e) => set("discountType", e.target.value)}
              >
                <option value="percent">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </label>
            <label>
              <b>Discount Value</b>
              <div className="relative mt-2">
                <input
                  type="number"
                  min="0"
                  step=".01"
                  className={`${input} pr-10`}
                  value={f.discountValue}
                  onChange={(e) => set("discountValue", e.target.value)}
                />
                <span className="absolute right-4 top-3 text-slate-500">
                  {f.discountType === "percent" ? "%" : "$"}
                </span>
              </div>
            </label>
          </div>
          {f.discountType === "percent" && (
            <label className="block">
              <b>
                Maximum Discount <span className="font-normal text-slate-500">(optional)</span>
              </b>
              <div className="relative mt-2">
                <span className="absolute left-4 top-3 text-slate-500">$</span>
                <input
                  type="number"
                  min="0"
                  step=".01"
                  className={`${input} pl-8`}
                  placeholder="10.00"
                  value={f.maxDiscountAmount}
                  onChange={(e) => set("maxDiscountAmount", e.target.value)}
                />
              </div>
              <span className="mt-1 block text-xs text-slate-500">
                Example: 20% off, maximum $10.
              </span>
            </label>
          )}
          <label className="block">
            <b>
              Minimum Subtotal <span className="font-normal text-slate-500">(optional)</span>
            </b>
            <div className="relative mt-2">
              <span className="absolute left-4 top-3 text-slate-500">$</span>
              <input
                type="number"
                min="0"
                step=".01"
                className={`${input} pl-8`}
                placeholder="20.00"
                value={f.minSubtotal}
                onChange={(e) => set("minSubtotal", e.target.value)}
              />
            </div>
          </label>
          <div>
            <b>Available On</b>
            <div className="mt-2 flex gap-3">
              {[
                ["online", "Online Ordering"],
                ["terminal", "Terminal"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => channel(id)}
                  className={`rounded-xl border px-4 py-2.5 font-semibold ${f.channels.includes(id) ? "border-orange-600 bg-orange-600 text-white" : "border-slate-300 bg-white text-slate-600"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <b>
                Total Usage Limit <span className="font-normal text-slate-500">(optional)</span>
              </b>
              <input
                type="number"
                min="1"
                className={`${input} mt-2`}
                placeholder="100"
                value={f.usageLimit}
                onChange={(e) => set("usageLimit", e.target.value)}
              />
              <span className="mt-1 block text-xs text-slate-500">Leave empty for unlimited.</span>
            </label>
            <label>
              <b>Per Customer Limit</b>
              <input
                type="number"
                min="1"
                className={`${input} mt-2`}
                value={f.perCustomerLimit}
                onChange={(e) => set("perCustomerLimit", e.target.value)}
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <b>Starts</b>
              <input
                type="datetime-local"
                className={`${input} mt-2`}
                value={f.startsAt}
                onChange={(e) => set("startsAt", e.target.value)}
              />
            </label>
            <label>
              <b>Ends</b>
              <input
                type="datetime-local"
                className={`${input} mt-2`}
                value={f.endsAt}
                onChange={(e) => set("endsAt", e.target.value)}
              />
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t bg-white px-6 py-4">
          <button onClick={close} className="rounded-xl bg-slate-100 px-5 py-3 font-bold">
            Cancel
          </button>
          <button
            disabled={busy}
            onClick={save}
            className="rounded-xl bg-orange-600 px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : p ? "Save Promotion" : "Create Promotion"}
          </button>
        </div>
      </div>
    </div>
  );
}
