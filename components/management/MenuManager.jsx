"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  SlidersHorizontal,
  Menu as MenuIcon,
} from "lucide-react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import useRestaurantLocation from "./useRestaurantLocation";

const money = (c) => `$${((Number(c) || 0) / 100).toFixed(2)}`;
async function api(path, org, loc, method = "GET", body, menuScope = "location") {
  const q = new URLSearchParams({ organizationId: org, locationId: loc, menuScope });
  const r = await fetch(`/api/owner/manage/admin/${path}?${q}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body:
      method === "GET"
        ? undefined
        : JSON.stringify({ ...body, organizationId: org, locationId: loc, menuScope }),
    cache: "no-store",
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Request failed");
  return d;
}
function Sortable({ id, children }) {
  const s = useSortable({ id });
  return (
    <div
      ref={s.setNodeRef}
      style={{ transform: CSS.Transform.toString(s.transform), transition: s.transition }}
    >
      {children(s.listeners, s.attributes)}
    </div>
  );
}

function ModifierEditor({ group, onClose, onSave }) {
  const [f, setF] = useState(
    group
      ? {
          ...group,
          options: (group.options || []).map((o) => ({
            ...o,
            price: String((o.priceCents || 0) / 100),
          })),
        }
      : {
          title: "",
          required: false,
          min: 0,
          max: 1,
          displayType: "checkbox",
          isActive: true,
          options: [],
        },
  );
  const add = () =>
    setF({ ...f, options: [...f.options, { name: "", price: "0", isActive: true }] });
  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6">
        <div className="flex justify-between">
          <h2 className="text-xl font-bold">{group ? "Edit Modifier" : "New Modifier"}</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-3 mt-5">
          <input
            className="field"
            placeholder="Modifier title"
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
          />
          <select
            className="field"
            value={f.displayType}
            onChange={(e) => setF({ ...f, displayType: e.target.value })}
          >
            <option value="checkbox">Multiple choice</option>
            <option value="radio">Single choice</option>
          </select>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={f.required}
              onChange={(e) => setF({ ...f, required: e.target.checked })}
            />{" "}
            Required
          </label>
          <div className="flex gap-2">
            <input
              className="field"
              type="number"
              min="0"
              value={f.min}
              onChange={(e) => setF({ ...f, min: +e.target.value })}
              placeholder="Min"
            />
            <input
              className="field"
              type="number"
              min="0"
              value={f.max}
              onChange={(e) => setF({ ...f, max: +e.target.value })}
              placeholder="Max"
            />
          </div>
        </div>
        <div className="mt-5 flex justify-between">
          <h3 className="font-semibold">Options</h3>
          <button className="secondary" onClick={add}>
            + Add option
          </button>
        </div>
        <div className="space-y-2 mt-2">
          {f.options.map((o, i) => (
            <div className="grid grid-cols-[1fr_120px_40px] gap-2" key={o._id || i}>
              <input
                className="field"
                value={o.name}
                placeholder="Option name"
                onChange={(e) => {
                  const a = [...f.options];
                  a[i] = { ...o, name: e.target.value };
                  setF({ ...f, options: a });
                }}
              />
              <input
                className="field"
                type="number"
                step=".01"
                min="0"
                value={o.price}
                onChange={(e) => {
                  const a = [...f.options];
                  a[i] = { ...o, price: e.target.value };
                  setF({ ...f, options: a });
                }}
              />
              <button onClick={() => setF({ ...f, options: f.options.filter((_, x) => x !== i) })}>
                <Trash2 className="text-red-500" size={18} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary"
            onClick={() =>
              onSave({
                ...f,
                options: f.options
                  .filter((o) => o.name.trim())
                  .map((o, i) => ({
                    ...o,
                    priceCents: Math.round(Number(o.price || 0) * 100),
                    order: i,
                  })),
              })
            }
          >
            Save modifier
          </button>
        </div>
      </div>
    </div>
  );
}

function ItemModal({ item, categoryId, categories, groups, onClose, onSave, onSaveGroup }) {
  const [f, setF] = useState(() => ({
    name: item?.name || "",
    price: String((item?.priceCents || 0) / 100),
    description: item?.description || "",
    image: item?.image || "",
    bestSeller: !!item?.bestSeller,
    newItem: !!item?.newItem,
    isActive: item?.isActive !== false,
    categoryId: String(
      item?.category?._id || item?.category || categoryId || categories[0]?._id || "",
    ),
    modifierGroups: (item?.modifierGroups || []).map((m, i) => ({
      group: m.group?._id || m.group,
      order: m.order ?? i,
    })),
  }));
  const [search, setSearch] = useState("");
  const [editGroup, setEditGroup] = useState(null);
  const attached = new Set(f.modifierGroups.map((x) => String(x.group)));
  const available = groups.filter(
    (g) => !attached.has(String(g._id)) && g.title.toLowerCase().includes(search.toLowerCase()),
  );
  const groupMap = Object.fromEntries(groups.map((g) => [String(g._id), g]));
  const drag = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const ids = f.modifierGroups.map((x) => String(x.group));
    const a = arrayMove(
      f.modifierGroups,
      ids.indexOf(String(active.id)),
      ids.indexOf(String(over.id)),
    ).map((x, i) => ({ ...x, order: i }));
    setF({ ...f, modifierGroups: a });
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2">
      <div className="bg-white w-full max-w-4xl rounded-2xl px-3 md:px-6 max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center py-4">
          <h2 className="text-xl font-bold">{item ? "Edit Menu Item" : "New Menu Item"}</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-48 h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
            {f.image ? (
              <img src={f.image} className="w-full h-full object-cover" alt="" />
            ) : (
              <span className="text-gray-400">No Image</span>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <input
              className="field text-lg font-bold"
              placeholder="Item name"
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
            />
            <div className="flex gap-2">
              <input
                className="field"
                type="number"
                min="0"
                step=".01"
                placeholder="Price"
                value={f.price}
                onChange={(e) => setF({ ...f, price: e.target.value })}
              />
              <select
                className="field"
                value={f.categoryId}
                onChange={(e) => setF({ ...f, categoryId: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              className="field min-h-[80px]"
              placeholder="Description"
              value={f.description}
              onChange={(e) => setF({ ...f, description: e.target.value })}
            />
            <input
              className="field"
              placeholder="Image URL"
              value={f.image}
              onChange={(e) => setF({ ...f, image: e.target.value })}
            />
            <div className="flex flex-wrap gap-2">
              {[
                ["bestSeller", "Best Seller"],
                ["newItem", "New"],
                ["isActive", f.isActive ? "Active" : "Inactive"],
              ].map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  className={`px-3 py-1 rounded-full ${f[k] ? "bg-orange-100 text-orange-700" : "bg-gray-200 text-gray-500"}`}
                  onClick={() => setF({ ...f, [k]: !f[k] })}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Modifiers</h3>
          <DndContext collisionDetection={closestCenter} onDragEnd={drag}>
            <SortableContext
              items={f.modifierGroups.map((x) => String(x.group))}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {f.modifierGroups.map((m) => {
                  const g = groupMap[String(m.group)];
                  if (!g) return null;
                  return (
                    <Sortable key={g._id} id={String(g._id)}>
                      {(listeners, attrs) => (
                        <div
                          {...attrs}
                          className="border rounded-lg p-3 flex justify-between bg-white"
                        >
                          <div className="flex gap-3 items-center">
                            <span {...listeners} className="cursor-grab text-gray-400">
                              <GripVertical size={16} />
                            </span>
                            <span className="font-medium">{g.title}</span>
                            {g.required && <span className="text-xs text-red-500">Required</span>}
                          </div>
                          <div className="flex gap-3">
                            <button onClick={() => setEditGroup(g)}>
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() =>
                                setF({
                                  ...f,
                                  modifierGroups: f.modifierGroups
                                    .filter((x) => String(x.group) !== String(g._id))
                                    .map((x, i) => ({ ...x, order: i })),
                                })
                              }
                            >
                              <Trash2 size={18} className="text-red-500" />
                            </button>
                          </div>
                        </div>
                      )}
                    </Sortable>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </div>
        <div className="mt-5 border-t pt-4">
          <div className="flex justify-between">
            <h4 className="font-semibold text-gray-600">Available Modifiers</h4>
            <button className="primary" onClick={() => setEditGroup({})}>
              + Add Modifier
            </button>
          </div>
          <input
            className="field mt-3"
            placeholder="Search modifiers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="space-y-2 mt-2">
            {available.map((g) => (
              <div
                key={g._id}
                className="flex justify-between border rounded-lg px-3 py-2 bg-gray-50"
              >
                <span>{g.title}</span>
                <button
                  className="text-green-700"
                  onClick={() =>
                    setF({
                      ...f,
                      modifierGroups: [
                        ...f.modifierGroups,
                        { group: g._id, order: f.modifierGroups.length },
                      ],
                    })
                  }
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="sticky bottom-0 bg-white py-4 flex justify-end gap-2">
          <button className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary"
            onClick={() => onSave({ ...f, priceCents: Math.round(Number(f.price || 0) * 100) })}
          >
            {item ? "Save Item" : "Add Item"}
          </button>
        </div>
      </div>
      {editGroup && (
        <ModifierEditor
          group={editGroup._id ? editGroup : null}
          onClose={() => setEditGroup(null)}
          onSave={async (g) => {
            const saved = await onSaveGroup(g, editGroup._id);
            setEditGroup(null);
            if (saved?._id && !editGroup._id)
              setF((v) => ({
                ...v,
                modifierGroups: [
                  ...v.modifierGroups,
                  { group: saved._id, order: v.modifierGroups.length },
                ],
              }));
          }}
        />
      )}
    </div>
  );
}

function LocationItemOverrideModal({ item, locationName, onClose, onSave, onReset }) {
  const fields = ["name", "priceCents", "description", "image", "isActive"];
  const initial = new Set(item?.overriddenFields || []);
  const [enabled, setEnabled] = useState(
    Object.fromEntries(fields.map((k) => [k, initial.has(k)])),
  );
  const [f, setF] = useState({
    name: item?.name || "",
    priceCents: item?.priceCents || 0,
    description: item?.description || "",
    image: item?.image || "",
    isActive: item?.isActive !== false,
  });
  const toggle = (k) => setEnabled((v) => ({ ...v, [k]: !v[k] }));
  const row = (k, label, child) => (
    <div className="rounded-xl border p-3">
      <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={!!enabled[k]} onChange={() => toggle(k)} /> Override {label}
      </label>
      <div className={!enabled[k] ? "pointer-events-none opacity-45" : ""}>{child}</div>
    </div>
  );
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h2 className="text-xl font-bold">Customize for {locationName}</h2>
            <p className="text-sm text-slate-500">
              Unchecked fields continue using Restaurant Default.
            </p>
          </div>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="space-y-3 p-6">
          {row(
            "name",
            "name",
            <input
              className="field"
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
            />,
          )}
          {row(
            "priceCents",
            "price",
            <input
              className="field"
              type="number"
              min="0"
              step=".01"
              value={(f.priceCents || 0) / 100}
              onChange={(e) =>
                setF({ ...f, priceCents: Math.round(Number(e.target.value || 0) * 100) })
              }
            />,
          )}
          {row(
            "description",
            "description",
            <textarea
              className="field min-h-[90px]"
              value={f.description}
              onChange={(e) => setF({ ...f, description: e.target.value })}
            />,
          )}
          {row(
            "image",
            "image",
            <input
              className="field"
              value={f.image}
              onChange={(e) => setF({ ...f, image: e.target.value })}
            />,
          )}
          {row(
            "isActive",
            "availability",
            <button
              type="button"
              className={f.isActive ? "primary" : "secondary"}
              onClick={() => setF({ ...f, isActive: !f.isActive })}
            >
              {f.isActive ? "Available" : "Unavailable"}
            </button>,
          )}
        </div>
        <div className="sticky bottom-0 flex justify-between border-t bg-white px-6 py-4">
          <button className="secondary" onClick={onReset}>
            Reset to Restaurant Default
          </button>
          <div className="flex gap-2">
            <button className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="primary"
              onClick={() => onSave({ ...f, overriddenFields: fields.filter((k) => enabled[k]) })}
            >
              Save customization
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryModal({ category, onClose, onSave }) {
  const slugify = (v) =>
    v
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  const [name, setName] = useState(category?.name || "");
  const [slug, setSlug] = useState(category?.slug || "");
  const [image, setImage] = useState(category?.image || "");
  const [isActive, setIsActive] = useState(category?.isActive !== false);
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async () => {
    if (!name.trim()) return setError("Category name is required.");
    setSaving(true);
    setError("");
    try {
      await onSave({
        name: name.trim(),
        slug: slugify(slug || name),
        image: image.trim(),
        isActive,
      });
      onClose();
    } catch (e) {
      setError(e.message || "Unable to save category");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-bold">{category ? "Edit Category" : "New Category"}</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
            <X size={22} />
          </button>
        </div>
        <div className="space-y-4 p-6">
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">Category Name</span>
            <input
              className="field"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              placeholder="Poke Bowls"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">Slug</span>
            <input
              className="field"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder="poke-bowls"
            />
          </label>
          <div className="flex items-end gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-slate-50">
              {image ? (
                <img src={image} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-slate-400">
                  No Image
                </div>
              )}
            </div>
            <label className="block flex-1">
              <span className="mb-1 block text-sm font-medium text-slate-600">Image URL</span>
              <input
                className="field"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
              />
            </label>
          </div>
          {category && (
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />{" "}
              Active category
            </label>
          )}
        </div>
        <div className="flex justify-end gap-3 border-t bg-slate-50 px-6 py-4">
          <button className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" disabled={saving} onClick={submit}>
            {saving ? "Saving…" : category ? "Save changes" : "Create category"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({
  title,
  description,
  confirmLabel = "Delete",
  loading,
  onClose,
  onConfirm,
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-5 text-slate-600">{description}</div>
        <div className="flex justify-end gap-3 border-t bg-slate-50 px-6 py-4">
          <button className="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function MenuManagerSkeleton() {
  return (
    <div className="mt-6 animate-pulse space-y-5" aria-hidden="true">
      <div className="flex gap-2">
        <div className="h-10 w-32 rounded-xl bg-slate-200" />
        <div className="h-10 w-28 rounded-xl bg-slate-200" />
      </div>
      <div className="h-11 w-full rounded-xl bg-slate-200" />
      {[0, 1, 2].map((row) => (
        <div key={row} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between bg-slate-50 p-4">
            <div className="h-6 w-40 rounded bg-slate-200" />
            <div className="h-9 w-24 rounded-xl bg-slate-200" />
          </div>
          <div className="space-y-3 p-4">
            <div className="h-16 rounded-xl bg-slate-100" />
            <div className="h-16 rounded-xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MenuManager({ organizationId }) {
  const loc = useRestaurantLocation(organizationId);
  const [categories, setCategories] = useState([]),
    [items, setItems] = useState([]),
    [groups, setGroups] = useState([]),
    [collapsed, setCollapsed] = useState({}),
    [query, setQuery] = useState(""),
    [modifierQuery, setModifierQuery] = useState(""),
    [expandedModifierUsage, setExpandedModifierUsage] = useState({}),
    [tab, setTab] = useState("items"),
    [editing, setEditing] = useState(null),
    [newFor, setNewFor] = useState(null),
    [categoryModal, setCategoryModal] = useState(null),
    [deleteTarget, setDeleteTarget] = useState(null),
    [deleting, setDeleting] = useState(false),
    [error, setError] = useState(""),
    [menuScope, setMenuScope] = useState("default"),
    [overrideItem, setOverrideItem] = useState(null),
    [importingDefault, setImportingDefault] = useState(false);
  const load = useCallback(async () => {
    if (!loc.locationId) return;
    try {
      setError("");
      const [c, m, g] = await Promise.all([
        api("categories", organizationId, loc.locationId, "GET", undefined, menuScope),
        api("menu", organizationId, loc.locationId, "GET", undefined, menuScope),
        api("modifiers", organizationId, loc.locationId, "GET", undefined, menuScope),
      ]);
      const cs = c.categories || [];
      setCategories(cs);
      setItems(m.items || []);
      setGroups(g.groups || []);
      setCollapsed((x) =>
        Object.keys(x).length ? x : Object.fromEntries(cs.map((c, i) => [c.slug, i !== 0])),
      );
    } catch (e) {
      setError(e.message);
    }
  }, [organizationId, loc.locationId, menuScope]);
  useEffect(() => {
    load();
  }, [load]);
  const grouped = useMemo(
    () =>
      [...categories]
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((c) => ({
          c,
          items: items
            .filter((i) => String(i.category?._id || i.category) === String(c._id))
            .filter((i) => !query || i.name.toLowerCase().includes(query.toLowerCase()))
            .sort((a, b) => (a.order || 0) - (b.order || 0)),
        })),
    [categories, items, query],
  );
  const modifierUsage = useMemo(() => {
    const usage = new Map();
    for (const group of groups) usage.set(String(group._id), []);
    for (const item of items) {
      for (const entry of item.modifierGroups || []) {
        const raw = entry?.group ?? entry;
        const id = String(raw?._id ?? raw ?? "");
        if (!id) continue;
        if (!usage.has(id)) usage.set(id, []);
        const list = usage.get(id);
        if (!list.some((x) => String(x._id) === String(item._id))) {
          list.push({ _id: item._id, name: item.name });
        }
      }
    }
    return usage;
  }, [groups, items]);
  const filteredGroups = useMemo(
    () =>
      groups.filter(
        (g) => !modifierQuery || g.title.toLowerCase().includes(modifierQuery.toLowerCase()),
      ),
    [groups, modifierQuery],
  );

  const saveItem = async (f) => {
    const body = { ...f, modifierGroups: f.modifierGroups };
    if (editing?.item) body.menuItemId = editing.item._id;
    await api(
      editing?.item ? "menu/update" : "menu/create",
      organizationId,
      loc.locationId,
      "POST",
      body,
      "default",
    );
    setEditing(null);
    setNewFor(null);
    await load();
  };
  const saveGroup = async (g, id) => {
    const d = await api(
      "modifiers/upsert",
      organizationId,
      loc.locationId,
      "POST",
      {
        ...g,
        _id: id,
      },
      "default",
    );
    await load();
    return d.group;
  };
  const catDrag = async ({ active, over }) => {
    if (menuScope !== "default") return;
    if (!over || active.id === over.id) return;
    const ids = categories
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((c) => String(c._id));
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    setCategories(
      next.map((id, i) => ({ ...categories.find((c) => String(c._id) === id), order: i })),
    );
    await api(
      "categories/reorder",
      organizationId,
      loc.locationId,
      "POST",
      {
        orders: next.map((id, order) => ({ id, order })),
      },
      "default",
    );
  };
  const itemDrag = async (cat, its, { active, over }) => {
    if (menuScope !== "default") return;
    if (!over || active.id === over.id) return;
    const ids = its.map((i) => String(i._id));
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    setItems((v) =>
      v.map((i) =>
        next.includes(String(i._id)) ? { ...i, order: next.indexOf(String(i._id)) } : i,
      ),
    );
    await api(
      "menu/reorder",
      organizationId,
      loc.locationId,
      "POST",
      {
        categorySlug: cat.slug,
        orders: next.map((id, order) => ({ id, order })),
      },
      "default",
    );
  };
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <Link
          href={`/dashboard/restaurants/${organizationId}`}
          className="text-sm font-semibold text-orange-600"
        >
          ← Restaurant workspace
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-orange-600">
          OrderXO Manager
        </p>
        <div className="mt-1 flex flex-wrap justify-between gap-3 items-center">
          <div>
            <h1 className="text-3xl font-bold">Menu Manager</h1>
            <p className="text-slate-500 mt-1">Manage categories, items and modifiers.</p>
          </div>
          <div className="min-w-[260px]">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Menu for
            </label>
            {loc.loading ? (
              <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200" />
            ) : (
              <select
                className="field"
                value={menuScope === "default" ? "default" : loc.locationId || "default"}
                disabled={!loc.locationId}
                onChange={(e) => {
                  if (e.target.value === "default") setMenuScope("default");
                  else {
                    loc.setLocationId(e.target.value);
                    setMenuScope("location");
                  }
                }}
              >
                <option value="default">Restaurant Default</option>
                {loc.locations.map((l) => (
                  <option key={l._id || l.id} value={l._id || l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        {loc.error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {loc.error}
          </div>
        )}
        {!loc.loading && !loc.error && !loc.locationId && (
          <div className="mt-6 rounded-2xl border bg-white p-8 text-center">
            <p className="font-semibold text-slate-900">No location found</p>
            <p className="mt-1 text-sm text-slate-500">Add a location before managing your menu.</p>
          </div>
        )}
        {loc.loading ? (
          <MenuManagerSkeleton />
        ) : loc.locationId && !loc.error ? (
          <>
            <div className="flex gap-2 mt-6">
              <button
                className={tab === "items" ? "primary" : "secondary"}
                onClick={() => setTab("items")}
              >
                <MenuIcon size={16} className="inline mr-2" />
                Menu Items
              </button>
              <button
                className={tab === "modifiers" ? "primary" : "secondary"}
                onClick={() => setTab("modifiers")}
              >
                <SlidersHorizontal size={16} className="inline mr-2" />
                Modifiers
              </button>
            </div>
            {menuScope === "location" && (
              <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
                <strong>
                  {
                    loc.locations.find((l) => String(l._id || l.id) === String(loc.locationId))
                      ?.name
                  }
                </strong>{" "}
                inherits categories, modifiers and items from Restaurant Default. Edit an item to
                override only the fields that differ for this location.
              </div>
            )}
            {menuScope === "default" && items.length === 0 && (
              <div className="mt-4 rounded-xl border bg-white p-4">
                <p className="font-semibold">Restaurant Default menu is empty.</p>
                <p className="mt-1 text-sm text-slate-500">
                  If your existing menu is stored under {loc.location?.name || "this location"},
                  import it once to create the master menu.
                </p>
                <button
                  className="primary mt-3"
                  disabled={importingDefault}
                  onClick={async () => {
                    try {
                      setImportingDefault(true);
                      await api(
                        "menu/default/import",
                        organizationId,
                        loc.locationId,
                        "POST",
                        {},
                        "location",
                      );
                      await load();
                    } catch (e) {
                      setError(e.message);
                    } finally {
                      setImportingDefault(false);
                    }
                  }}
                >
                  {importingDefault
                    ? "Importing…"
                    : "Import current location as Restaurant Default"}
                </button>
              </div>
            )}
            {error && <p className="mt-4 text-red-600">{error}</p>}
            {tab === "items" ? (
              <>
                <div className="mt-5 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      className={`field pl-10 ${query ? "pr-10" : ""}`}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search menu items..."
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="absolute right-3 top-2.5 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        aria-label="Clear search"
                        title="Clear search"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  {menuScope === "default" && (
                    <button
                      className="primary"
                      onClick={() => setCategoryModal({ mode: "create" })}
                    >
                      <Plus size={17} className="inline" /> Category
                    </button>
                  )}
                </div>
                <DndContext collisionDetection={closestCenter} onDragEnd={catDrag}>
                  <SortableContext
                    items={grouped.map((x) => String(x.c._id))}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4 mt-5">
                      {grouped.map(({ c, items: its }) => (
                        <Sortable key={c._id} id={String(c._id)}>
                          {(listeners, attrs) => (
                            <section
                              {...attrs}
                              className="rounded-2xl border bg-white overflow-hidden"
                            >
                              <div className="p-4 flex items-center justify-between bg-slate-50">
                                <div className="flex items-center gap-3">
                                  <span {...listeners} className="cursor-grab text-gray-400">
                                    <GripVertical />
                                  </span>
                                  <button
                                    className="flex items-center gap-2 font-bold text-lg"
                                    onClick={() =>
                                      setCollapsed((v) => ({ ...v, [c.slug]: !v[c.slug] }))
                                    }
                                  >
                                    {collapsed[c.slug] ? <ChevronDown /> : <ChevronUp />}
                                    {c.name}
                                    <span className="text-sm font-normal text-gray-400">
                                      ({its.length})
                                    </span>
                                  </button>
                                </div>
                                {menuScope === "default" && (
                                  <div className="flex gap-2">
                                    <button className="secondary" onClick={() => setNewFor(c._id)}>
                                      + Item
                                    </button>
                                    <button
                                      className="secondary"
                                      title="Edit category"
                                      onClick={() =>
                                        setCategoryModal({ mode: "edit", category: c })
                                      }
                                    >
                                      <Pencil size={16} />
                                    </button>
                                    <button
                                      className="danger"
                                      title="Delete category"
                                      onClick={() =>
                                        setDeleteTarget({ type: "category", value: c })
                                      }
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                )}
                              </div>
                              {!collapsed[c.slug] && (
                                <DndContext
                                  collisionDetection={closestCenter}
                                  onDragEnd={(e) => itemDrag(c, its, e)}
                                >
                                  <SortableContext
                                    items={its.map((i) => String(i._id))}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    <div className="divide-y">
                                      {its.map((i) => (
                                        <Sortable key={i._id} id={String(i._id)}>
                                          {(il, ia) => (
                                            <div
                                              {...ia}
                                              className={`p-4 flex flex-wrap items-center justify-between gap-3 ${i.isActive === false ? "opacity-50" : ""}`}
                                            >
                                              <div className="flex items-center gap-3">
                                                <span {...il} className="cursor-grab text-gray-400">
                                                  <GripVertical size={18} />
                                                </span>
                                                {i.image && (
                                                  <img
                                                    src={i.image}
                                                    className="w-14 h-14 rounded-lg object-cover"
                                                    alt=""
                                                  />
                                                )}
                                                <div>
                                                  <div className="font-semibold">{i.name}</div>
                                                  <div className="text-sm text-gray-500">
                                                    {money(i.priceCents)} ·{" "}
                                                    {i.isActive !== false ? "Active" : "Inactive"}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="flex gap-2">
                                                {menuScope === "location" ? (
                                                  <>
                                                    {i.overriddenFields?.length > 0 && (
                                                      <span className="self-center rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">
                                                        Customized
                                                      </span>
                                                    )}
                                                    <button
                                                      className="secondary"
                                                      onClick={() => setOverrideItem(i)}
                                                    >
                                                      <Pencil size={16} className="inline mr-1" />{" "}
                                                      Customize
                                                    </button>
                                                  </>
                                                ) : (
                                                  <>
                                                    <button
                                                      className="secondary"
                                                      onClick={async () => {
                                                        await api(
                                                          "menu/update-active",
                                                          organizationId,
                                                          loc.locationId,
                                                          "POST",
                                                          {
                                                            menuItemId: i._id,
                                                            isActive: i.isActive === false,
                                                          },
                                                          "default",
                                                        );
                                                        await load();
                                                      }}
                                                    >
                                                      {i.isActive === false
                                                        ? "Activate"
                                                        : "Deactivate"}
                                                    </button>
                                                    <button
                                                      className="secondary"
                                                      onClick={() =>
                                                        setEditing({ item: i, categoryId: c._id })
                                                      }
                                                    >
                                                      <Pencil size={16} />
                                                    </button>
                                                    <button
                                                      className="danger"
                                                      onClick={() =>
                                                        setDeleteTarget({ type: "item", value: i })
                                                      }
                                                    >
                                                      <Trash2 size={16} />
                                                    </button>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </Sortable>
                                      ))}
                                    </div>
                                  </SortableContext>
                                </DndContext>
                              )}
                            </section>
                          )}
                        </Sortable>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      className={`field pl-10 ${modifierQuery ? "pr-10" : ""}`}
                      value={modifierQuery}
                      onChange={(e) => setModifierQuery(e.target.value)}
                      placeholder="Search modifiers..."
                    />
                    {modifierQuery && (
                      <button
                        type="button"
                        onClick={() => setModifierQuery("")}
                        className="absolute right-3 top-2.5 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        aria-label="Clear modifier search"
                        title="Clear search"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  {menuScope === "default" && (
                    <button className="primary shrink-0" onClick={() => setEditing({ group: {} })}>
                      <Plus size={17} className="inline" /> Add Modifier
                    </button>
                  )}
                </div>
                {filteredGroups.map((g) => {
                  const usedBy = modifierUsage.get(String(g._id)) || [];
                  const usageOpen = Boolean(expandedModifierUsage[g._id]);
                  return (
                    <div key={g._id} className="rounded-2xl border bg-white p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="font-bold text-lg">{g.title}</div>
                          <p className="text-sm text-gray-500">
                            {(g.options || []).length}{" "}
                            {(g.options || []).length === 1 ? "option" : "options"} ·{" "}
                            {g.required ? "Required" : "Optional"}
                          </p>
                          <p className="mt-1 text-sm font-medium text-orange-600">
                            {usedBy.length
                              ? `Used by ${usedBy.length} menu ${usedBy.length === 1 ? "item" : "items"}`
                              : "Not used by any menu items"}
                          </p>
                        </div>
                        {menuScope === "default" && (
                          <div className="flex gap-2">
                            <button
                              className="secondary"
                              title="Edit modifier"
                              onClick={() => setEditing({ group: g })}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="danger disabled:cursor-not-allowed disabled:opacity-40"
                              title={
                                usedBy.length
                                  ? "Remove this modifier from all menu items before deleting it"
                                  : "Delete modifier"
                              }
                              disabled={usedBy.length > 0}
                              onClick={() => setDeleteTarget({ type: "modifier", value: g })}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                      {usedBy.length > 0 && (
                        <div className="mt-4 border-t pt-3">
                          <button
                            type="button"
                            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
                            onClick={() =>
                              setExpandedModifierUsage((v) => ({ ...v, [g._id]: !v[g._id] }))
                            }
                          >
                            {usageOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                            {usageOpen ? "Hide menu items" : "Show menu items"}
                          </button>
                          {usageOpen && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {usedBy.map((item) => (
                                <span
                                  key={item._id}
                                  className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                                >
                                  {item.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {!filteredGroups.length && (
                  <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">
                    No modifiers found.
                  </div>
                )}
              </div>
            )}
          </>
        ) : null}
        {(editing?.item || newFor) && (
          <ItemModal
            item={editing?.item}
            categoryId={editing?.categoryId || newFor}
            categories={categories}
            groups={groups}
            onClose={() => {
              setEditing(null);
              setNewFor(null);
            }}
            onSave={saveItem}
            onSaveGroup={saveGroup}
          />
        )}{" "}
        {editing?.group && (
          <ModifierEditor
            group={editing.group._id ? editing.group : null}
            onClose={() => setEditing(null)}
            onSave={async (g) => {
              await saveGroup(g, editing.group._id);
              setEditing(null);
            }}
          />
        )}
        {overrideItem && (
          <LocationItemOverrideModal
            item={overrideItem}
            locationName={
              loc.locations.find((l) => String(l._id || l.id) === String(loc.locationId))?.name ||
              "location"
            }
            onClose={() => setOverrideItem(null)}
            onSave={async (data) => {
              await api(
                "menu/override",
                organizationId,
                loc.locationId,
                "POST",
                { menuItemId: overrideItem._id, ...data },
                "location",
              );
              setOverrideItem(null);
              await load();
            }}
            onReset={async () => {
              await api(
                "menu/override",
                organizationId,
                loc.locationId,
                "DELETE",
                { menuItemId: overrideItem._id },
                "location",
              );
              setOverrideItem(null);
              await load();
            }}
          />
        )}
        {categoryModal && (
          <CategoryModal
            category={categoryModal.category || null}
            onClose={() => setCategoryModal(null)}
            onSave={async (data) => {
              await api(
                categoryModal.mode === "edit" ? "categories/update" : "categories/create",
                organizationId,
                loc.locationId,
                "POST",
                categoryModal.mode === "edit" ? { ...data, id: categoryModal.category._id } : data,
                "default",
              );
              await load();
            }}
          />
        )}
        {deleteTarget && (
          <ConfirmModal
            title={
              deleteTarget.type === "category"
                ? "Delete category"
                : deleteTarget.type === "item"
                  ? "Delete menu item"
                  : "Delete modifier"
            }
            description={
              deleteTarget.type === "category"
                ? `Delete “${deleteTarget.value.name}”? Remove all items from this category before deleting it.`
                : `Delete “${deleteTarget.value.name || deleteTarget.value.title}”? This action cannot be undone.`
            }
            loading={deleting}
            onClose={() => !deleting && setDeleteTarget(null)}
            onConfirm={async () => {
              setDeleting(true);
              try {
                if (deleteTarget.type === "category")
                  await api(
                    "categories/delete",
                    organizationId,
                    loc.locationId,
                    "POST",
                    {
                      id: deleteTarget.value._id,
                    },
                    "default",
                  );
                else if (deleteTarget.type === "item")
                  await api(
                    "menu/delete",
                    organizationId,
                    loc.locationId,
                    "POST",
                    {
                      menuItemId: deleteTarget.value._id,
                    },
                    "default",
                  );
                else
                  await api(
                    "modifiers/delete",
                    organizationId,
                    loc.locationId,
                    "POST",
                    {
                      id: deleteTarget.value._id,
                    },
                    "default",
                  );
                setDeleteTarget(null);
                await load();
              } catch (e) {
                setError(e.message);
              } finally {
                setDeleting(false);
              }
            }}
          />
        )}
      </div>
    </main>
  );
}
