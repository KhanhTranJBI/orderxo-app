"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useRestaurantLocation from "./useRestaurantLocation";

const money = (c) => `$${((Number(c) || 0) / 100).toFixed(2)}`;
async function request(path, organizationId, locationId, method = "GET", body) {
  const q = new URLSearchParams({ organizationId, locationId });
  const r = await fetch(`/api/owner/manage/${path}?${q}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify({ ...body, locationId }) : undefined,
    cache: "no-store",
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Request failed");
  return d;
}
export default function MenuManager({ organizationId }) {
  const loc = useRestaurantLocation(organizationId);
  const [tab, setTab] = useState("items"),
    [categories, setCategories] = useState([]),
    [items, setItems] = useState([]),
    [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    isActive: true,
  });
  const [groupForm, setGroupForm] = useState({
    title: "",
    required: false,
    displayType: "checkbox",
    options: "",
  });
  const load = useCallback(async () => {
    if (!loc.locationId) return;
    setLoading(true);
    setError("");
    try {
      const [c, m, g] = await Promise.all([
        request("categories", organizationId, loc.locationId),
        request("menu", organizationId, loc.locationId),
        request("modifiers", organizationId, loc.locationId),
      ]);
      setCategories(c.categories || []);
      setItems(m.items || []);
      setGroups(g.groups || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [organizationId, loc.locationId]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!itemForm.categoryId && categories[0])
      setItemForm((f) => ({ ...f, categoryId: String(categories[0]._id) }));
  }, [categories, itemForm.categoryId]);
  const byCategory = useMemo(
    () =>
      categories.map((c) => ({
        c,
        items: items.filter((i) => String(i.category?._id || i.category) === String(c._id)),
      })),
    [categories, items],
  );
  const run = async (fn, msg) => {
    try {
      setError("");
      await fn();
      setMessage(msg);
      await load();
      setTimeout(() => setMessage(""), 2200);
    } catch (e) {
      setError(e.message);
    }
  };
  if (loc.loading)
    return (
      <Shell id={organizationId} title="Menu">
        <p>Loading locations…</p>
      </Shell>
    );
  if (loc.error || !loc.locationId)
    return (
      <Shell id={organizationId} title="Menu">
        <Error text={loc.error || "No location found for this restaurant."} />
      </Shell>
    );
  return (
    <Shell id={organizationId} title="Menu">
      <LocationPicker {...loc} />
      <div className="mt-6 flex gap-2">
        <Tab active={tab === "items"} onClick={() => setTab("items")}>
          Menu items
        </Tab>
        <Tab active={tab === "modifiers"} onClick={() => setTab("modifiers")}>
          Modifiers
        </Tab>
      </div>
      {error && <Error text={error} />}{" "}
      {message && (
        <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p>
      )}
      {loading ? (
        <p className="mt-6">Loading menu…</p>
      ) : tab === "items" ? (
        <>
          <section className="mt-6 rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-bold">Add category</h2>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!categoryName.trim()) return;
                run(
                  () =>
                    request("categories", organizationId, loc.locationId, "POST", {
                      name: categoryName.trim(),
                    }),
                  "Category added",
                );
                setCategoryName("");
              }}
            >
              <input
                className="field"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Category name"
              />
              <button className="primary">Add category</button>
            </form>
          </section>
          <section className="mt-4 rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-bold">Add menu item</h2>
            <form
              className="mt-4 grid gap-3 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                run(
                  () =>
                    request("menu/item", organizationId, loc.locationId, "POST", {
                      ...itemForm,
                      priceCents: Math.round(Number(itemForm.price) * 100),
                    }),
                  "Menu item added",
                );
                setItemForm((f) => ({ ...f, name: "", description: "", price: "" }));
              }}
            >
              <input
                required
                className="field"
                placeholder="Item name"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
              />
              <input
                required
                min="0"
                step="0.01"
                type="number"
                className="field"
                placeholder="Price"
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
              />
              <select
                className="field"
                value={itemForm.categoryId}
                onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                className="field"
                placeholder="Description"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              />
              <button disabled={!categories.length} className="primary md:col-span-2">
                Add menu item
              </button>
            </form>
          </section>
          <div className="mt-6 space-y-4">
            {byCategory.map(({ c, items }) => (
              <section key={c._id} className="rounded-2xl border bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-bold">
                    {c.name}{" "}
                    <span className="text-sm font-normal text-slate-400">({items.length})</span>
                  </h2>
                  <button
                    className="danger"
                    onClick={() =>
                      confirm(`Delete ${c.name}?`) &&
                      run(
                        () =>
                          request("categories", organizationId, loc.locationId, "DELETE", {
                            categoryId: c._id,
                          }),
                        "Category deleted",
                      )
                    }
                  >
                    Delete category
                  </button>
                </div>
                <div className="mt-4 divide-y">
                  {items.length ? (
                    items.map((i) => (
                      <div
                        key={i._id}
                        className="flex flex-wrap items-center justify-between gap-3 py-4"
                      >
                        <div>
                          <p className="font-semibold">{i.name}</p>
                          <p className="text-sm text-slate-500">
                            {money(i.priceCents)} · {i.isActive !== false ? "Active" : "Hidden"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="secondary"
                            onClick={() =>
                              run(
                                () =>
                                  request("menu/item", organizationId, loc.locationId, "PATCH", {
                                    menuItemId: i._id,
                                    isActive: i.isActive === false,
                                  }),
                                "Availability updated",
                              )
                            }
                          >
                            {i.isActive === false ? "Show" : "Hide"}
                          </button>
                          <button
                            className="danger"
                            onClick={() =>
                              confirm(`Delete ${i.name}?`) &&
                              run(
                                () =>
                                  request("menu/item", organizationId, loc.locationId, "DELETE", {
                                    menuItemId: i._id,
                                  }),
                                "Item deleted",
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="py-4 text-sm text-slate-500">No items in this category.</p>
                  )}
                </div>
              </section>
            ))}
          </div>
        </>
      ) : (
        <>
          <section className="mt-6 rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-bold">Add modifier group</h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter options separated by commas. Prices can be edited in the API-backed manager
              later.
            </p>
            <form
              className="mt-4 grid gap-3 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                run(
                  () =>
                    request("modifiers", organizationId, loc.locationId, "POST", {
                      ...groupForm,
                      options: groupForm.options
                        .split(",")
                        .map((name) => ({ name: name.trim(), priceCents: 0 }))
                        .filter((x) => x.name),
                    }),
                  "Modifier group added",
                );
                setGroupForm({ title: "", required: false, displayType: "checkbox", options: "" });
              }}
            >
              <input
                required
                className="field"
                placeholder="Group title (e.g. Protein)"
                value={groupForm.title}
                onChange={(e) => setGroupForm({ ...groupForm, title: e.target.value })}
              />
              <select
                className="field"
                value={groupForm.displayType}
                onChange={(e) => setGroupForm({ ...groupForm, displayType: e.target.value })}
              >
                <option value="checkbox">Multiple choice</option>
                <option value="radio">Single choice</option>
              </select>
              <input
                className="field md:col-span-2"
                placeholder="Tuna, Salmon, Tofu"
                value={groupForm.options}
                onChange={(e) => setGroupForm({ ...groupForm, options: e.target.value })}
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={groupForm.required}
                  onChange={(e) => setGroupForm({ ...groupForm, required: e.target.checked })}
                />{" "}
                Required
              </label>
              <button className="primary">Add modifier group</button>
            </form>
          </section>
          <div className="mt-5 space-y-3">
            {groups.map((g) => (
              <section key={g._id} className="rounded-2xl border bg-white p-5">
                <div className="flex justify-between gap-4">
                  <div>
                    <h3 className="font-bold">{g.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {g.required ? "Required" : "Optional"} · {g.displayType} ·{" "}
                      {(g.options || []).length} options
                    </p>
                    <p className="mt-2 text-sm">
                      {(g.options || [])
                        .map((o) => `${o.name}${o.priceCents ? ` (+${money(o.priceCents)})` : ""}`)
                        .join(" · ")}
                    </p>
                  </div>
                  <button
                    className="danger"
                    onClick={() =>
                      confirm(`Delete ${g.title}?`) &&
                      run(
                        () =>
                          request("modifiers", organizationId, loc.locationId, "DELETE", {
                            groupId: g._id,
                          }),
                        "Modifier deleted",
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}
function Shell({ id, title, children }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/dashboard/restaurants/${id}`}
          className="text-sm font-semibold text-orange-600"
        >
          ← Restaurant workspace
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-orange-600">
          OrderXO Manager
        </p>
        <h1 className="mt-1 text-3xl font-bold">{title}</h1>
        {children}
      </div>
    </main>
  );
}
function LocationPicker({ locations, locationId, setLocationId }) {
  return locations.length > 1 ? (
    <select
      className="field mt-5 max-w-sm"
      value={locationId}
      onChange={(e) => setLocationId(e.target.value)}
    >
      {locations.map((l) => (
        <option key={l._id} value={l._id}>
          {l.name}
        </option>
      ))}
    </select>
  ) : null;
}
function Tab({ active, ...p }) {
  return (
    <button
      {...p}
      className={`rounded-lg px-4 py-2 text-sm font-semibold ${active ? "bg-slate-900 text-white" : "border bg-white"}`}
    />
  );
}
function Error({ text }) {
  return <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{text}</p>;
}
