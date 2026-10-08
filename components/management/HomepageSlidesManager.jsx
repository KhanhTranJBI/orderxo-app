"use client";
import { ownerFetch } from "../../lib/ownerFetch";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import useRestaurantLocation from "./useRestaurantLocation";
import useRestaurantPermissions from "./useRestaurantPermissions";

async function api(path, organizationId, method = "GET", body, locationId = "") {
  const q = new URLSearchParams({ organizationId });
  if (locationId) q.set("locationId", locationId);
  const payload = body ? { ...body, ...(locationId ? { locationId } : {}) } : undefined;
  const r = await ownerFetch(`/api/owner/manage/${path}?${q}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: payload ? JSON.stringify(payload) : undefined,
    cache: "no-store",
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Request failed");
  return d;
}
function SlideRow({ slide, onEdit, onDelete, disabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide._id,
    disabled,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      className={`flex items-center gap-4 rounded-2xl border bg-white p-4 ${isDragging ? "shadow-lg opacity-80" : ""}`}
    >
      <button
        {...listeners}
        disabled={disabled}
        className={`touch-none text-slate-400 ${disabled ? "cursor-default opacity-30" : "cursor-grab active:cursor-grabbing"}`}
      >
        <GripVertical size={20} />
      </button>
      <img
        src={slide.image}
        alt=""
        className="h-16 w-24 shrink-0 rounded-lg bg-slate-100 object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold">{slide.title}</div>
        <div className="mt-1 line-clamp-2 text-sm text-slate-500">
          {slide.subtitle || "No subtitle"}
        </div>
      </div>
      <span
        className={`hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:inline ${slide.isActive !== false ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-500"}`}
      >
        {slide.isActive !== false ? "Active" : "Inactive"}
      </span>
      {!disabled && (
        <>
          <button
            onClick={() => onEdit(slide)}
            className="rounded-lg p-2 hover:bg-slate-100"
            aria-label="Edit slide"
          >
            <Pencil size={19} />
          </button>
          <button
            onClick={() => onDelete(slide)}
            className="rounded-lg p-2 text-red-500 hover:bg-red-50"
            aria-label="Delete slide"
          >
            <Trash2 size={19} />
          </button>
        </>
      )}
    </div>
  );
}
const empty = { title: "", subtitle: "", image: "", cta: "", link: "", isActive: true };
function SlideModal({ slide, onClose, onSaved, organizationId, locationId }) {
  const [form, setForm] = useState(
    slide
      ? {
          title: slide.title || "",
          subtitle: slide.subtitle || "",
          image: slide.image || "",
          cta: slide.cta || "",
          link: slide.link || "",
          isActive: slide.isActive !== false,
        }
      : empty,
  );
  const [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await api(
        "admin/hero-slides",
        organizationId,
        slide ? "PATCH" : "POST",
        { ...form, slideId: slide?._id },
        locationId,
      );
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white px-4 pb-5 shadow-2xl md:px-7"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white py-4">
          <h2 className="text-xl font-bold">{slide ? "Edit Hero Slide" : "New Hero Slide"}</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
            <X />
          </button>
        </div>
        <div className="relative h-64 w-full overflow-hidden rounded-xl border bg-slate-900 md:h-80">
          {form.image && (
            <img
              src={form.image}
              alt="Hero preview"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
            <h3 className="text-2xl font-bold">{form.title || "Hero slide title"}</h3>
            {form.subtitle && (
              <p className="mt-1 max-w-3xl text-sm md:text-base">{form.subtitle}</p>
            )}
            {form.cta && (
              <span className="mt-4 rounded-xl bg-orange-500 px-5 py-2.5 font-bold">
                {form.cta}
              </span>
            )}
          </div>
        </div>
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="mt-5 space-y-4">
          {[
            ["Title", "title", "Fresh Poke Bowls"],
            ["Subtitle", "subtitle", "Fresh, healthy poke bowls made daily..."],
            ["Image URL", "image", "/images/hero/hero-2.png"],
            ["CTA Text", "cta", "VIEW POKE BOWLS"],
            ["CTA Link", "link", "/menu"],
          ].map(([label, key, placeholder]) => (
            <label key={key} className="block">
              <span className="text-sm font-semibold text-slate-600">
                {label}
                {["title", "image"].includes(key) ? " *" : ""}
              </span>
              <input
                className="field mt-2"
                value={form[key]}
                placeholder={placeholder}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />{" "}
            Active on homepage
          </label>
        </div>
        <div className="sticky bottom-0 mt-5 flex justify-end gap-3 border-t bg-white py-4">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 font-semibold">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || !form.title.trim() || !form.image.trim()}
            className="primary flex items-center gap-2"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {slide ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
export default function HomepageSlidesManager({
  organizationId,
  embedded = false,
  scopeOverride = null,
}) {
  const loc = useRestaurantLocation(organizationId);
  const permission = useRestaurantPermissions(organizationId);
  const canManage = permission.can("homepage.manage");
  const isAdmin = permission.isAdmin;
  const [scope, setScope] = useState(scopeOverride ?? "default"),
    [items, setItems] = useState([]),
    [useDefault, setUseDefault] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [editing, setEditing] = useState(null),
    [creating, setCreating] = useState(false),
    [deleting, setDeleting] = useState(null),
    [deleteLoading, setDeleteLoading] = useState(false),
    [switching, setSwitching] = useState(false);
  useEffect(() => {
    if (scopeOverride !== null && scopeOverride !== undefined) {
      setScope(scopeOverride);
    }
  }, [scopeOverride]);
  useEffect(() => {
    if (scopeOverride !== null && scopeOverride !== undefined) return;
    if (!permission.loading && !isAdmin && scope === "default" && loc.locations[0]) {
      setScope(String(loc.locations[0]._id || loc.locations[0].id));
    }
  }, [permission.loading, isAdmin, scope, loc.locations]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const locationId = scope === "default" ? "" : scope;
  const editable = canManage && (scope === "default" || !useDefault);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const d = await api("admin/hero-slides", organizationId, "GET", undefined, locationId);
      setItems(d.slides || []);
      setUseDefault(locationId ? d.useDefault !== false : false);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [organizationId, locationId]);
  useEffect(() => {
    load();
  }, [load]);
  const customize = async () => {
    if (!canManage) return;
    setSwitching(true);
    setError("");
    try {
      const d = await api(
        "admin/hero-slides",
        organizationId,
        "POST",
        { action: "customizeLocation" },
        locationId,
      );
      setItems(d.slides || []);
      setUseDefault(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSwitching(false);
    }
  };
  const restoreDefault = async () => {
    if (!canManage) return;
    setSwitching(true);
    setError("");
    try {
      const d = await api(
        "admin/hero-slides",
        organizationId,
        "POST",
        { action: "useRestaurantDefault" },
        locationId,
      );
      setItems(d.slides || []);
      setUseDefault(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSwitching(false);
    }
  };
  const drag = async ({ active, over }) => {
    if (!canManage) return;
    if (!editable || !over || active.id === over.id) return;
    const old = items.findIndex((x) => x._id === active.id),
      next = items.findIndex((x) => x._id === over.id);
    const before = items,
      moved = arrayMove(items, old, next);
    setItems(moved);
    try {
      const d = await api(
        "admin/hero-slides/reorder",
        organizationId,
        "POST",
        { slides: moved.map((s, i) => ({ _id: s._id, order: i })) },
        locationId,
      );
      setItems(d.slides || moved);
    } catch (e) {
      setItems(before);
      setError(e.message);
    }
  };
  const del = async () => {
    if (!canManage) return;
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await api(
        "admin/hero-slides",
        organizationId,
        "DELETE",
        { slideId: deleting._id },
        locationId,
      );
      setDeleting(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleteLoading(false);
    }
  };
  return (
    <div
      className={embedded ? "text-slate-900" : "min-h-screen bg-slate-50 px-4 py-10 text-slate-900"}
    >
      <div className={embedded ? "" : "mx-auto max-w-6xl"}>
        {!embedded && (
          <Link
            href={`/dashboard/restaurants/${organizationId}`}
            className="text-sm font-semibold text-orange-600"
          >
            ← Restaurant workspace
          </Link>
        )}
        {!embedded && (
          <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-orange-600">
            OrderXO Manager
          </p>
        )}
        <div
          className={
            embedded
              ? "flex flex-wrap items-end justify-between gap-4"
              : "mt-1 flex flex-wrap items-end justify-between gap-4"
          }
        >
          <div>
            <h1 className={embedded ? "text-xl font-bold" : "text-3xl font-bold"}>
              Homepage slides
            </h1>
            <p className="mt-2 text-slate-600">
              Use restaurant default slides everywhere, or customize a location when needed.
            </p>
          </div>
          {editable && (
            <button onClick={() => setCreating(true)} className="primary flex items-center gap-2">
              <Plus size={18} /> Add Slide
            </button>
          )}
        </div>
        {scopeOverride === null || scopeOverride === undefined ? (
          <div className="mt-6 max-w-md">
            <label className="text-sm font-semibold text-slate-600">Slides for</label>
            <select className="field mt-2" value={scope} onChange={(e) => setScope(e.target.value)}>
              {isAdmin && <option value="default">Restaurant Default</option>}
              {loc.locations.map((l) => (
                <option key={l._id || l.id} value={l._id || l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {locationId && (
          <div className="mt-5 rounded-2xl border bg-white p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-bold">
                  {useDefault
                    ? "Using Restaurant Default Slides"
                    : "Custom slides for this location"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {useDefault
                    ? "Changes to Restaurant Default automatically appear at this location."
                    : "This location has its own independent slide set."}
                </p>
              </div>
              {canManage &&
                (useDefault ? (
                  <button disabled={switching} onClick={customize} className="primary shrink-0">
                    {switching ? "Preparing…" : "Customize for this location"}
                  </button>
                ) : (
                  <button
                    disabled={switching}
                    onClick={restoreDefault}
                    className="rounded-lg border px-4 py-2 font-semibold"
                  >
                    {switching ? "Switching…" : "Use Restaurant Default"}
                  </button>
                ))}
            </div>
          </div>
        )}
        {(loc.error || error) && (
          <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{loc.error || error}</p>
        )}
        {!permission.loading && !canManage && (
          <p className="mt-5 rounded-lg border bg-white p-3 text-sm text-slate-700">
            <strong>Read only.</strong> Add, edit, delete and reorder require Manage homepage
            permission.
          </p>
        )}
        {loading || loc.loading ? (
          <p className="mt-8">Loading slides…</p>
        ) : !items.length ? (
          <div className="mt-8 rounded-2xl border border-dashed bg-white p-10 text-center">
            <h2 className="font-bold">No homepage slides yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              {editable
                ? "Add your first hero slide to start building the homepage."
                : "Restaurant Default does not have any slides yet."}
            </p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={drag}>
            <SortableContext items={items.map((x) => x._id)} strategy={verticalListSortingStrategy}>
              <div className="mt-8 space-y-3">
                {items.map((s) => (
                  <SlideRow
                    key={s._id}
                    slide={s}
                    disabled={!editable}
                    onEdit={setEditing}
                    onDelete={setDeleting}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
      {(creating || editing) && (
        <SlideModal
          organizationId={organizationId}
          locationId={locationId}
          slide={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={async () => {
            setCreating(false);
            setEditing(null);
            await load();
          }}
        />
      )}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold">Delete hero slide?</h2>
            <p className="mt-2 text-sm text-slate-600">
              “{deleting.title}” will be permanently removed from this slide set.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-lg border px-4 py-2 font-semibold"
                onClick={() => setDeleting(null)}
              >
                Cancel
              </button>
              <button
                disabled={deleteLoading}
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white"
                onClick={del}
              >
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
