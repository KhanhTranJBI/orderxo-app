"use client";
import { useEffect, useState } from "react";
const defaultSections = ["hero", "featuredMenu", "about", "gallery"].map((type, i) => ({
  id: `${type}-${i}`,
  type,
  enabled: true,
  title: {
    hero: "Welcome to our restaurant",
    featuredMenu: "Customer Favorites",
    about: "Our Story",
    gallery: "Gallery",
  }[type],
  subtitle: "",
  imageUrl: "",
  images: [],
  itemIds: [],
}));
const defaultPage = {
  template: "modern",
  sections: defaultSections,
};
export default function HomepageBuilder({ organizationId }) {
  const [draft, setDraft] = useState(defaultPage),
    [published, setPublished] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [mobile, setMobile] = useState(false),
    [branding, setBranding] = useState({
      primaryColor: "#111827",
      secondaryColor: "#ffffff",
      backgroundColor: "#ffffff",
    });
  useEffect(() => {
    if (!organizationId) return;
    fetch(`/api/owner/organizations/settings?organizationId=${encodeURIComponent(organizationId)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error || "Unable to load");
        setDraft(d.settings?.homepageDraft || d.settings?.homepagePublished || defaultPage);
        setPublished(d.settings?.homepagePublished || null);
        setBranding(d.settings?.branding || {});
      })
      .catch((e) => setError(e.message));
  }, [organizationId]);
  const edit = (i, key, value) =>
    setDraft((old) => ({
      ...old,
      sections: old.sections.map((s, n) => (n === i ? { ...s, [key]: value } : s)),
    }));
  const move = (i, dir) =>
    setDraft((old) => {
      const sections = [...old.sections];
      const j = i + dir;
      if (j < 0 || j >= sections.length) return old;
      [sections[i], sections[j]] = [sections[j], sections[i]];
      return { ...old, sections };
    });
  async function save(publish = false) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch("/api/owner/organizations/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, homepageDraft: draft, publishHomepage: publish }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "Save failed");
      setDraft(d.settings.homepageDraft);
      if (publish) setPublished(d.settings.homepagePublished);
      setMessage(
        publish
          ? "Homepage published successfully."
          : "Draft saved. Customers still see the published homepage.",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Homepage Builder</h2>
          <p className="text-sm text-gray-500">Save a draft, preview, then publish when ready.</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded border px-3 py-2" disabled={busy} onClick={() => save(false)}>
            Save draft
          </button>
          <button
            className="rounded bg-orange-600 px-3 py-2 text-white"
            disabled={busy}
            onClick={() => save(true)}
          >
            Publish homepage
          </button>
        </div>
      </div>
      {error && <p className="text-red-600">{error}</p>}
      {message && <p className="text-green-700">{message}</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <label className="block text-sm font-medium">
            Template
            <select
              className="mt-1 w-full rounded border p-2"
              value={draft.template}
              onChange={(e) => setDraft({ ...draft, template: e.target.value })}
            >
              {["modern", "premium", "bold", "minimal"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-slate-500">Theme colors are managed in General settings.</p>
          {draft.sections.map((s, i) => (
            <div key={s.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <strong className="capitalize">{s.type.replace(/([A-Z])/g, " $1")}</strong>
                <div className="flex gap-2">
                  <button type="button" onClick={() => move(i, -1)} aria-label="Move up">
                    ↑
                  </button>
                  <button type="button" onClick={() => move(i, 1)} aria-label="Move down">
                    ↓
                  </button>
                  <label className="text-sm">
                    <input
                      type="checkbox"
                      checked={s.enabled}
                      onChange={(e) => edit(i, "enabled", e.target.checked)}
                    />{" "}
                    Visible
                  </label>
                </div>
              </div>
              <input
                className="w-full rounded border p-2"
                placeholder="Section title"
                value={s.title}
                onChange={(e) => edit(i, "title", e.target.value)}
              />
              <textarea
                className="w-full rounded border p-2"
                placeholder="Description"
                value={s.subtitle}
                onChange={(e) => edit(i, "subtitle", e.target.value)}
              />
              {["hero", "about"].includes(s.type) && (
                <input
                  className="w-full rounded border p-2"
                  placeholder="HTTPS image URL or /images/..."
                  value={s.imageUrl}
                  onChange={(e) => edit(i, "imageUrl", e.target.value)}
                />
              )}
              {s.type === "gallery" && (
                <textarea
                  className="w-full rounded border p-2"
                  placeholder="Image URLs, one per line"
                  value={(s.images || []).join("\n")}
                  onChange={(e) => edit(i, "images", e.target.value.split("\n").filter(Boolean))}
                />
              )}
              {s.type === "featuredMenu" && (
                <p className="text-xs text-gray-500">
                  Displays your restaurant bestsellers from the menu automatically.
                </p>
              )}
            </div>
          ))}
        </div>
        <div>
          <div className="mb-3 flex justify-end">
            <button className="rounded border px-3 py-1" onClick={() => setMobile(!mobile)}>
              {mobile ? "Desktop preview" : "Mobile preview"}
            </button>
          </div>
          <div
            className={`mx-auto overflow-hidden rounded-xl border shadow ${mobile ? "max-w-xs" : "w-full"}`}
            style={{ background: branding.backgroundColor || "#ffffff" }}
          >
            {draft.sections
              .filter((s) => s.enabled)
              .map((s) => (
                <section
                  key={s.id}
                  className="p-6 text-center"
                  style={
                    s.type === "hero"
                      ? { background: branding.primaryColor || "#111827", color: "white" }
                      : {}
                  }
                >
                  {s.imageUrl && (
                    <img src={s.imageUrl} alt="" className="mb-3 h-32 w-full object-cover" />
                  )}
                  <h3 className="text-xl font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm">{s.subtitle}</p>
                  {s.type === "featuredMenu" && (
                    <p className="mt-3 text-xs">Featured menu items appear on the live site.</p>
                  )}
                  {s.type === "gallery" && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {(s.images || []).map((url, i) => (
                        <img key={i} src={url} alt="Gallery" className="h-20 w-full object-cover" />
                      ))}
                    </div>
                  )}
                </section>
              ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Preview is a draft approximation. Publishing updates the public homepage.
          </p>
        </div>
      </div>
    </div>
  );
}
