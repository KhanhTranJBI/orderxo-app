"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { ownerFetch } from "../../lib/ownerFetch";
import useRestaurantLocation from "./useRestaurantLocation";
import useRestaurantPermissions from "./useRestaurantPermissions";

const THEMES = {
  classic: { bg: "#fffaf0", ink: "#33281f", accent: "#9c6337" },
  modern: { bg: "#ffffff", ink: "#172033", accent: "#c45724" },
  dark: { bg: "#22272b", ink: "#ffffff", accent: "#e8b66a" },
};
const SIZES = { LETTER: [8.5, 11], A4: [8.27, 11.69], TABLOID: [11, 17] };
const clean = (s) =>
  String(s || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const id = (v) => String(v?._id || v?.id || v || "");
const money = (v) => `$${(Number(v || 0) / 100).toFixed(2)}`;
export default function MenuBookDesigner({ organizationId }) {
  const location = useRestaurantLocation(organizationId);
  const permissions = useRestaurantPermissions(organizationId);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("Restaurant Menu");
  const [titleMode, setTitleMode] = useState("first-page");
  const [template, setTemplate] = useState("classic");
  const [size, setSize] = useState("LETTER");
  const [orientation, setOrientation] = useState("portrait");
  const [background, setBackground] = useState("");
  const [logo, setLogo] = useState("");
  const [showPhotos, setShowPhotos] = useState(true);
  const [showDescriptions, setShowDescriptions] = useState(true);
  const [categorySettings, setCategorySettings] = useState({});
  const [perPage, setPerPage] = useState(6);
  const [manualBreaks, setManualBreaks] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [restoredKey, setRestoredKey] = useState(null);
  const [draftName, setDraftName] = useState("Main Menu");
  const storageKey = `orderxo:menu-books:${organizationId}:${location.locationId || "default"}`;
  const canManage = permissions.can("menu.manage");
  const fetchMenu = useCallback(async () => {
    if (!location.locationId) return;
    setLoading(true);
    try {
      const q = new URLSearchParams({
        organizationId,
        locationId: location.locationId,
        menuScope: "default",
      });
      const [c, m] = await Promise.all(
        ["categories", "menu"].map(async (path) => {
          const r = await ownerFetch(`/api/owner/manage/admin/${path}?${q}`, { cache: "no-store" });
          const body = await r.json();
          if (!r.ok) throw new Error(body.error || "Unable to load menu");
          return body;
        }),
      );
      setCategories(c.categories || []);
      setItems(m.items || []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [organizationId, location.locationId]);
  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);
  // The restaurant's logo is managed centrally in Restaurant Settings.
  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await ownerFetch(
          `/api/owner/organizations/settings?organizationId=${encodeURIComponent(organizationId)}`,
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error("Unable to load restaurant branding");
        const data = await response.json();
        if (!cancelled) setLogo(data.settings?.branding?.logoUrl || "");
      } catch (error) {
        if (!cancelled) toast.error(error.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);
  // Restore the newest saved design for the selected restaurant location.
  // Wait for the actual location ID so a temporary "default" key cannot override it.
  useEffect(() => {
    if (!location.locationId) return;
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const valid = Array.isArray(stored) ? stored.filter((v) => v && typeof v === "object") : [];
      const sorted = [...valid].sort(
        (a, b) => (b.updatedAt || b.id || 0) - (a.updatedAt || a.id || 0),
      );
      setDrafts(sorted);
      if (sorted.length) {
        loadDraftSettings(sorted[0]);
        setActiveDraftId(sorted[0].id);
      } else {
        setActiveDraftId(null);
      }
    } catch {
      setDrafts([]);
      setActiveDraftId(null);
      toast.error("Unable to restore saved menu book");
    } finally {
      setRestoredKey(storageKey);
    }
  }, [storageKey, location.locationId]);
  const loadDraftSettings = (v) => {
    setDraftName(v.draftName || "Main Menu");
    setTitle(v.title || "Restaurant Menu");
    setTitleMode(v.titleMode === "every-page" ? "every-page" : "first-page");
    setTemplate(THEMES[v.template] ? v.template : "classic");
    setSize(SIZES[v.size] ? v.size : "LETTER");
    setOrientation(v.orientation === "landscape" ? "landscape" : "portrait");
    setBackground(v.background || "");
    setShowPhotos(v.showPhotos !== false);
    setShowDescriptions(v.showDescriptions !== false);
    setCategorySettings(v.categorySettings || {});
    setPerPage(v.perPage || 6);
    setManualBreaks(v.manualBreaks || []);
  };
  const categoryGroups = useMemo(() => {
    const active = items.filter((item) => item.isActive !== false);
    const groups = categories.map((category) => ({
      categoryId: id(category),
      categoryLabel: category.name,
      columns: categorySettings[id(category)]?.columns || 1,
      visible: categorySettings[id(category)]?.visible !== false,
      items: active
        .filter((item) => id(item.category) === id(category))
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    }));
    const uncategorized = active.filter(
      (item) => !categories.some((category) => id(category) === id(item.category)),
    );
    if (uncategorized.length)
      groups.push({
        categoryId: "uncategorized",
        categoryLabel: "Other",
        columns: categorySettings.uncategorized?.columns || 1,
        visible: categorySettings.uncategorized?.visible !== false,
        items: uncategorized,
      });
    return groups;
  }, [items, categories, categorySettings]);
  const visibleGroups = categoryGroups.filter((group) => group.visible && group.items.length);
  const visibleItemCount = visibleGroups.reduce((sum, group) => sum + group.items.length, 0);
  const pages = useMemo(() => {
    const result = [];
    let page = [];
    let usedRows = 0;
    const flush = () => {
      if (page.length) result.push(page);
      page = [];
      usedRows = 0;
    };
    for (const group of visibleGroups) {
      const columns = group.columns;
      let chunk = [];
      const pushChunk = () => {
        if (chunk.length) page.push({ ...group, items: chunk });
        chunk = [];
      };
      for (const item of group.items) {
        if (manualBreaks.includes(id(item)) && (page.length || chunk.length)) {
          pushChunk();
          flush();
        }
        if (usedRows >= perPage) {
          pushChunk();
          flush();
        }
        chunk.push(item);
        if (chunk.length % columns === 1) usedRows += 1;
      }
      pushChunk();
    }
    flush();
    return result.length ? result : [[]];
  }, [visibleGroups, perPage, manualBreaks]);
  const updateCategory = (categoryId, patch) => {
    setCategorySettings((current) => ({
      ...current,
      [categoryId]: { ...current[categoryId], ...patch },
    }));
  };
  const save = () => {
    if (!location.locationId || restoredKey !== storageKey) {
      toast.error("Wait for the restaurant menu book to finish loading");
      return;
    }
    const now = Date.now();
    const entry = {
      id: activeDraftId || now,
      updatedAt: now,
      draftName: (() => {
        const base = (draftName || "Main Menu").trim() || "Main Menu";
        const existing = new Set(
          drafts
            .filter((v) => v.id !== (activeDraftId || now))
            .map((v) => String(v.draftName || "").toLowerCase()),
        );
        if (!existing.has(base.toLowerCase())) return base;
        let number = 2;
        while (existing.has(`${base} (${number})`.toLowerCase())) number += 1;
        return `${base} (${number})`;
      })(),
      title,
      titleMode,
      template,
      size,
      orientation,
      background,
      showPhotos,
      showDescriptions,
      categorySettings,
      perPage,
      manualBreaks,
    };
    const next = [entry, ...drafts.filter((v) => v.id !== entry.id)].slice(0, 20);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setDrafts(next);
      setActiveDraftId(entry.id);
      setDraftName(entry.draftName);
      toast.success("Menu book saved. It will load automatically on refresh.");
    } catch {
      toast.error("Unable to save design");
    }
  };
  const loadDraft = (v) => {
    loadDraftSettings(v);
    setActiveDraftId(v.id);
  };
  const colors = THEMES[template];
  const dims = SIZES[size];
  const pageWidth = orientation === "portrait" ? dims[0] : dims[1];
  const pageHeight = orientation === "portrait" ? dims[1] : dims[0];
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <style>{`@media print { @page { margin: 0; } body * { visibility: hidden !important; } #menu-book-print, #menu-book-print * { visibility: visible !important; } #menu-book-print { position: absolute !important; inset: 0; width: 100%; display: block !important; } .menu-book-sheet { box-shadow: none !important; border: 0 !important; margin: 0 !important; break-after: page; page-break-after: always; print-color-adjust: exact; -webkit-print-color-adjust: exact; } .menu-book-sheet:last-child { break-after: auto; page-break-after: auto; } }`}</style>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-3xl font-bold mt-2">Menu Book Designer</h1>
              <p className="text-slate-500">
                Multi-page printed menus synchronized with your live menu.
              </p>
            </div>
            <div className="flex gap-2">
              <button className="rounded-lg border px-4 py-2" onClick={fetchMenu}>
                Refresh menu
              </button>
              <button
                disabled={!canManage}
                className="rounded-lg border px-4 py-2 disabled:opacity-40"
                onClick={save}
              >
                Save design
              </button>
              <button
                className="rounded-lg bg-orange-700 text-white px-4 py-2"
                onClick={() => window.print()}
              >
                Print / Save PDF
              </button>
            </div>
          </div>
          <div className="grid lg:grid-cols-[300px_minmax(0,1fr)] gap-6">
            <aside className="space-y-4 bg-white rounded-xl border p-4 self-start">
              <label className="block text-sm font-semibold">
                Design name
                <input
                  className="w-full border rounded p-2 mt-1"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                />
              </label>
              <label className="block text-sm font-semibold">
                Printed title
                <input
                  className="w-full border rounded p-2 mt-1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label className="block text-sm font-semibold">
                Title placement
                <select
                  className="w-full border rounded p-2 mt-1"
                  value={titleMode}
                  onChange={(e) => setTitleMode(e.target.value)}
                >
                  <option value="first-page">One title for the whole book (first page only)</option>
                  <option value="every-page">Show title on every page</option>
                </select>
              </label>
              <label className="block text-sm font-semibold">
                Template
                <select
                  className="w-full border rounded p-2 mt-1"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                >
                  <option value="classic">Classic</option>
                  <option value="modern">Modern</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-sm font-semibold">
                  Paper
                  <select
                    className="w-full border rounded p-2 mt-1"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                  >
                    {Object.keys(SIZES).map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  Orientation
                  <select
                    className="w-full border rounded p-2 mt-1"
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value)}
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </label>
              </div>
              <label className="block text-sm font-semibold">
                Background color
                <input
                  type="color"
                  className="block mt-1"
                  value={background || colors.bg}
                  onChange={(e) => setBackground(e.target.value)}
                />
              </label>
              <label className="flex gap-2 items-center">
                <input
                  type="checkbox"
                  checked={showPhotos}
                  onChange={(e) => setShowPhotos(e.target.checked)}
                />{" "}
                Food photos
              </label>
              <label className="flex gap-2 items-center">
                <input
                  type="checkbox"
                  checked={showDescriptions}
                  onChange={(e) => setShowDescriptions(e.target.checked)}
                />{" "}
                Descriptions
              </label>
              <label className="block text-sm font-semibold">
                Maximum grid rows per page
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="w-full border rounded p-2 mt-1"
                  value={perPage}
                  onChange={(e) =>
                    setPerPage(Math.max(1, Math.min(20, Number(e.target.value) || 1)))
                  }
                />
              </label>
              <div className="border-t pt-3 space-y-3">
                <strong>Categories & layouts</strong>
                <p className="text-xs text-slate-500">
                  Hide a whole category or choose 1, 2, or 3 columns for its printed items.
                </p>
                {categoryGroups.map((group) => (
                  <div key={group.categoryId} className="rounded-lg border p-3 space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={group.visible}
                        onChange={(e) =>
                          updateCategory(group.categoryId, { visible: e.target.checked })
                        }
                      />
                      <span className="flex-1">{group.categoryLabel}</span>
                      <span className="text-xs text-slate-500">{group.items.length} items</span>
                    </label>
                    <label className="block text-xs text-slate-600">
                      Grid columns
                      <select
                        disabled={!group.visible}
                        className="mt-1 w-full rounded border p-2 text-sm disabled:opacity-40"
                        value={group.columns}
                        onChange={(e) =>
                          updateCategory(group.categoryId, { columns: Number(e.target.value) })
                        }
                      >
                        <option value={1}>1 column</option>
                        <option value={2}>2 columns</option>
                        <option value={3}>3 columns</option>
                      </select>
                    </label>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3">
                <strong>Saved designs (this browser)</strong>
                <div className="space-y-1 mt-2">
                  {drafts.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => loadDraft(v)}
                      className={`block text-left w-full text-sm border rounded p-2 transition-colors ${activeDraftId === v.id ? "border-orange-600 bg-orange-100 text-orange-900 font-semibold" : "hover:bg-slate-50"}`}
                      aria-current={activeDraftId === v.id ? "true" : undefined}
                    >
                      {v.draftName}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
            <div>
              {loading ? (
                <p>Loading menu…</p>
              ) : (
                <>
                  <p className="mb-3 text-sm text-slate-600">
                    {pages.length} page(s) · {visibleItemCount} item(s). Use “Start new page” below
                    an item to insert a manual break.
                  </p>
                  <div id="menu-book-print" className="space-y-6">
                    {pages.map((group, index) => (
                      <div
                        key={index}
                        className="menu-book-sheet relative mx-auto border shadow-md overflow-hidden"
                        style={{
                          width: `${pageWidth}in`,
                          minHeight: `${pageHeight}in`,
                          background: background || colors.bg,
                          color: colors.ink,
                          padding: "0.55in",
                          boxSizing: "border-box",
                          maxWidth: "100%",
                        }}
                      >
                        <header
                          className="text-center border-b pb-4 mb-6"
                          style={{ borderColor: colors.accent }}
                        >
                          {logo && (
                            <img
                              src={logo}
                              alt="Restaurant logo"
                              className="h-20 w-20 mx-auto mb-2 object-contain"
                            />
                          )}
                          {(titleMode === "every-page" || index === 0) && (
                            <>
                              <h2
                                className="text-3xl font-bold tracking-wide"
                                style={{ color: colors.accent }}
                              >
                                {title}
                              </h2>
                              <div className="text-xs mt-2 tracking-widest uppercase">
                                Freshly prepared · Made to order
                              </div>
                            </>
                          )}
                        </header>
                        <div className="space-y-4">
                          {group.map((section, sectionIndex) => (
                            <section key={`${section.categoryId}-${sectionIndex}`} className="mb-5">
                              <h3
                                className="text-xl font-bold mt-5 mb-3 pb-1 border-b"
                                style={{ color: colors.accent, borderColor: colors.accent }}
                              >
                                {section.categoryLabel}
                              </h3>
                              <div
                                className="grid gap-3"
                                style={{
                                  gridTemplateColumns: `repeat(${section.columns}, minmax(0, 1fr))`,
                                }}
                              >
                                {section.items.map((item) => (
                                  <>
                                    <div
                                      key={id(item)}
                                      className={`min-w-0 break-inside-avoid ${section.columns === 1 ? "flex items-start gap-3" : ""}`}
                                    >
                                      {showPhotos && item.image && (
                                        <img
                                          src={item.image}
                                          alt=""
                                          className={`${section.columns === 1 ? "w-24 h-24 shrink-0" : "w-full aspect-square mb-2"} rounded object-cover`}
                                          style={
                                            section.columns === 1
                                              ? { width: "1in", height: "1in" }
                                              : { aspectRatio: "1 / 1" }
                                          }
                                        />
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline justify-between gap-3 font-semibold text-sm">
                                          <span className="min-w-0">{item.name}</span>
                                          <span className="whitespace-nowrap">
                                            {money(item.priceCents)}
                                          </span>
                                        </div>
                                        {showDescriptions && (
                                          <p className="text-xs mt-1 opacity-80">
                                            {clean(item.description)}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      className="print:hidden block w-fit text-left text-xs underline opacity-60 mt-1"
                                      onClick={() =>
                                        setManualBreaks((old) =>
                                          old.includes(id(item))
                                            ? old.filter((x) => x !== id(item))
                                            : [...old, id(item)],
                                        )
                                      }
                                    >
                                      {manualBreaks.includes(id(item))
                                        ? "Remove page break"
                                        : "Start new page before this item"}
                                    </button>
                                  </>
                                ))}
                              </div>
                            </section>
                          ))}
                        </div>
                        <footer className="absolute bottom-5 left-0 right-0 text-center text-xs opacity-70">
                          {index + 1} / {pages.length}
                        </footer>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <p className="mt-5 text-sm text-slate-500">
            For accurate output, select the same paper size and orientation in your browser print
            dialog, turn on background graphics, and use Save as PDF. Designs are stored locally in
            this browser; they are not yet shared across devices.
          </p>
        </div>
      </div>
    </main>
  );
}
