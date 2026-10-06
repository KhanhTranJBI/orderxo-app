"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
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
async function api(path, org, loc, method = "GET", body) {
  const q = new URLSearchParams({ organizationId: org, locationId: loc });
  const r = await fetch(`/api/owner/manage/admin/${path}?${q}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body:
      method === "GET"
        ? undefined
        : JSON.stringify({ ...body, organizationId: org, locationId: loc }),
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

export default function MenuManager({ organizationId }) {
  const loc = useRestaurantLocation(organizationId);
  const [categories, setCategories] = useState([]),
    [items, setItems] = useState([]),
    [groups, setGroups] = useState([]),
    [collapsed, setCollapsed] = useState({}),
    [query, setQuery] = useState(""),
    [tab, setTab] = useState("items"),
    [editing, setEditing] = useState(null),
    [newFor, setNewFor] = useState(null),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!loc.locationId) return;
    try {
      setError("");
      const [c, m, g] = await Promise.all([
        api("categories", organizationId, loc.locationId),
        api("menu", organizationId, loc.locationId),
        api("modifiers", organizationId, loc.locationId),
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
  }, [organizationId, loc.locationId]);
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
  const saveItem = async (f) => {
    const body = { ...f, modifierGroups: f.modifierGroups };
    if (editing?.item) body.menuItemId = editing.item._id;
    await api(
      editing?.item ? "menu/update" : "menu/create",
      organizationId,
      loc.locationId,
      "POST",
      body,
    );
    setEditing(null);
    setNewFor(null);
    await load();
  };
  const saveGroup = async (g, id) => {
    const d = await api("modifiers/upsert", organizationId, loc.locationId, "POST", {
      ...g,
      _id: id,
    });
    await load();
    return d.group;
  };
  const catDrag = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const ids = categories
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((c) => String(c._id));
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    setCategories(
      next.map((id, i) => ({ ...categories.find((c) => String(c._id) === id), order: i })),
    );
    await api("categories/reorder", organizationId, loc.locationId, "POST", {
      orders: next.map((id, order) => ({ id, order })),
    });
  };
  const itemDrag = async (cat, its, { active, over }) => {
    if (!over || active.id === over.id) return;
    const ids = its.map((i) => String(i._id));
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    setItems((v) =>
      v.map((i) =>
        next.includes(String(i._id)) ? { ...i, order: next.indexOf(String(i._id)) } : i,
      ),
    );
    await api("menu/reorder", organizationId, loc.locationId, "POST", {
      categorySlug: cat.slug,
      orders: next.map((id, order) => ({ id, order })),
    });
  };
  if (loc.loading) return <p>Loading locations…</p>;
  if (loc.error || !loc.locationId)
    return <p className="text-red-600">{loc.error || "No location found"}</p>;
  return (
    <div>
      <div className="flex flex-wrap justify-between gap-3 items-center">
        <div>
          <h1 className="text-3xl font-bold">Menu Manager</h1>
          <p className="text-slate-500 mt-1">Manage categories, items and modifiers.</p>
        </div>
        <select
          className="field max-w-xs"
          value={loc.locationId}
          onChange={(e) => loc.setLocationId(e.target.value)}
        >
          {loc.locations.map((l) => (
            <option key={l._id || l.id} value={l._id || l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
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
      {error && <p className="mt-4 text-red-600">{error}</p>}
      {tab === "items" ? (
        <>
          <div className="mt-5 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                className="field pl-10"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search menu items..."
              />
            </div>
            <button
              className="primary"
              onClick={async () => {
                const name = prompt("Category name");
                if (name) {
                  await api("categories/create", organizationId, loc.locationId, "POST", { name });
                  await load();
                }
              }}
            >
              <Plus size={17} className="inline" /> Category
            </button>
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
                      <section {...attrs} className="rounded-2xl border bg-white overflow-hidden">
                        <div className="p-4 flex items-center justify-between bg-slate-50">
                          <div className="flex items-center gap-3">
                            <span {...listeners} className="cursor-grab text-gray-400">
                              <GripVertical />
                            </span>
                            <button
                              className="flex items-center gap-2 font-bold text-lg"
                              onClick={() => setCollapsed((v) => ({ ...v, [c.slug]: !v[c.slug] }))}
                            >
                              {collapsed[c.slug] ? <ChevronDown /> : <ChevronUp />}
                              {c.name}
                              <span className="text-sm font-normal text-gray-400">
                                ({its.length})
                              </span>
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button className="secondary" onClick={() => setNewFor(c._id)}>
                              + Item
                            </button>
                            <button
                              className="danger"
                              onClick={async () => {
                                if (confirm(`Delete ${c.name}?`)) {
                                  await api(
                                    "categories/delete",
                                    organizationId,
                                    loc.locationId,
                                    "POST",
                                    { id: c._id },
                                  );
                                  await load();
                                }
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
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
                                              );
                                              await load();
                                            }}
                                          >
                                            {i.isActive === false ? "Activate" : "Deactivate"}
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
                                            onClick={async () => {
                                              if (confirm(`Delete ${i.name}?`)) {
                                                await api(
                                                  "menu/delete",
                                                  organizationId,
                                                  loc.locationId,
                                                  "POST",
                                                  { menuItemId: i._id },
                                                );
                                                await load();
                                              }
                                            }}
                                          >
                                            <Trash2 size={16} />
                                          </button>
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
        <div className="mt-5 space-y-3">
          <div className="flex justify-end">
            <button className="primary" onClick={() => setEditing({ group: {} })}>
              + New Modifier
            </button>
          </div>
          {groups.map((g) => (
            <div key={g._id} className="rounded-xl border bg-white p-4 flex justify-between">
              <div>
                <b>{g.title}</b>
                <p className="text-sm text-gray-500">
                  {g.required ? "Required" : "Optional"} · {(g.options || []).length} options
                </p>
              </div>
              <div className="flex gap-2">
                <button className="secondary" onClick={() => setEditing({ group: g })}>
                  <Pencil size={16} />
                </button>
                <button
                  className="danger"
                  onClick={async () => {
                    if (confirm(`Delete ${g.title}?`)) {
                      await api("modifiers/delete", organizationId, loc.locationId, "POST", {
                        id: g._id,
                      });
                      await load();
                    }
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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
    </div>
  );
}
