"use client";
import { useEffect, useState } from "react";
const areas = ["menu", "website", "settings"];
export default function SupportEditors({ workspace }) {
  const [area, setArea] = useState("menu");
  const [locationId, setLocationId] = useState(workspace.locations?.[0]?.id || "");
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState("");
  const [form, setForm] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const permissions = workspace.session.permissions || [];
  const canEdit = permissions.includes(`setup:${area}`);
  useEffect(() => {
    let active = true;
    setData(null);
    setSelected("");
    setMessage("");
    const params = new URLSearchParams({ area, ...(area === "website" ? {} : { locationId }) });
    fetch(`/api/support/manage?${params}`, { cache: "no-store" })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw Error(body.error || "Unable to load");
        return body;
      })
      .then((body) => {
        if (active) {
          setData(body);
          setForm(
            area === "settings"
              ? body.settings
              : area === "website"
                ? { draft: JSON.stringify(body.draft || { sections: [] }, null, 2) }
                : {},
          );
        }
      })
      .catch((e) => {
        if (active) setMessage(e.message);
      });
    return () => {
      active = false;
    };
  }, [area, locationId]);
  const editItem = (item) => {
    setSelected(item._id);
    setForm({
      name: item.name,
      description: item.description || "",
      priceCents: item.priceCents,
      isActive: item.isActive !== false,
    });
    setMessage("");
  };
  async function save() {
    setLoading(true);
    setMessage("");
    try {
      const body =
        area === "website"
          ? { area, draft: JSON.parse(form.draft) }
          : area === "settings"
            ? {
                area,
                locationId,
                phone: form.phone || "",
                pickupInstructions: form.pickupInstructions || "",
              }
            : { area, locationId, itemId: selected, ...form, priceCents: Number(form.priceCents) };
      const response = await fetch("/api/support/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || "Unable to save");
      setMessage("Saved successfully. Change recorded in audit log.");
      if (area === "menu")
        setData((prev) => ({
          ...prev,
          items: prev.items.map((item) => (item._id === selected ? result.item : item)),
        }));
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }
  const field = (label, key, type = "text") => (
    <label className="block space-y-1 text-sm font-semibold" key={key}>
      <span>{label}</span>
      <input
        className="w-full rounded-lg border p-3 font-normal"
        type={type}
        value={form[key] ?? ""}
        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
      />
    </label>
  );
  return (
    <section className="rounded-xl border bg-white p-6 space-y-5">
      <h2 className="text-xl font-bold">Restaurant setup editors</h2>
      <div className="flex flex-wrap gap-2">
        {areas.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setArea(a)}
            className={`rounded-lg px-4 py-2 font-semibold ${a === area ? "bg-orange-600 text-white" : "bg-slate-100"}`}
          >
            {a === "menu" ? "Menu" : a === "website" ? "Website draft" : "Location settings"}
          </button>
        ))}
      </div>
      {area !== "website" && (
        <label className="block text-sm font-semibold">
          Location
          <select
            className="mt-1 block w-full rounded-lg border p-3"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
          >
            {workspace.locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {!canEdit && (
        <p className="rounded-lg bg-amber-50 p-3 text-amber-900">
          This session does not have editing permission for {area}.
        </p>
      )}
      {area === "menu" && data?.items && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="max-h-80 overflow-auto rounded-lg border">
            {data.items.map((item) => (
              <button
                type="button"
                key={item._id}
                onClick={() => editItem(item)}
                className={`block w-full border-b p-3 text-left ${selected === item._id ? "bg-orange-50" : ""}`}
              >
                {item.name} · ${(Number(item.priceCents || 0) / 100).toFixed(2)}
              </button>
            ))}
          </div>
          {selected && (
            <div className="space-y-3">
              {field("Item name", "name")}
              {field("Price in cents", "priceCents", "number")}
              <label className="block text-sm font-semibold">
                Description
                <textarea
                  className="mt-1 w-full rounded-lg border p-3 font-normal"
                  rows={3}
                  value={form.description || ""}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </label>
              <label className="flex gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive !== false}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                />{" "}
                Active
              </label>
            </div>
          )}
        </div>
      )}
      {area === "settings" && data?.settings && (
        <div className="space-y-3">
          {field("Phone", "phone")}
          <label className="block text-sm font-semibold">
            Pickup instructions
            <textarea
              className="mt-1 w-full rounded-lg border p-3 font-normal"
              value={form.pickupInstructions || ""}
              onChange={(e) => setForm((p) => ({ ...p, pickupInstructions: e.target.value }))}
            />
          </label>
        </div>
      )}
      {area === "website" && data && (
        <div>
          <p className="mb-2 text-sm text-slate-600">
            Edit the homepage draft JSON. Publishing is intentionally disabled for staff access.
          </p>
          <textarea
            spellCheck={false}
            className="w-full rounded-lg border p-3 font-mono text-sm"
            rows={12}
            value={form.draft || ""}
            onChange={(e) => setForm((p) => ({ ...p, draft: e.target.value }))}
          />
        </div>
      )}
      {message && (
        <p role="status" className="rounded-lg bg-slate-100 p-3 text-sm">
          {message}
        </p>
      )}
      <button
        type="button"
        onClick={save}
        disabled={!canEdit || loading || !data || (area === "menu" && !selected)}
        className="rounded-lg bg-orange-600 px-5 py-3 font-bold text-white disabled:opacity-40"
      >
        {loading ? "Saving…" : "Save changes"}
      </button>
    </section>
  );
}
