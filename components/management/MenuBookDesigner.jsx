"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { ownerFetch } from "../../lib/ownerFetch";
import useRestaurantLocation from "./useRestaurantLocation";
import useRestaurantPermissions from "./useRestaurantPermissions";

const THEMES = { classic: { bg: "#fffaf0", ink: "#33281f", accent: "#9c6337" }, modern: { bg: "#ffffff", ink: "#172033", accent: "#c45724" }, dark: { bg: "#22272b", ink: "#ffffff", accent: "#e8b66a" } };
const SIZES = { LETTER: [8.5, 11], A4: [8.27, 11.69], TABLOID: [11, 17] };
const clean = (s) => String(s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const id = (v) => String(v?._id || v?.id || v || "");
const money = (v) => `$${(Number(v || 0) / 100).toFixed(2)}`;
export default function MenuBookDesigner({ organizationId }) {
  const location = useRestaurantLocation(organizationId);
  const permissions = useRestaurantPermissions(organizationId);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("Restaurant Menu");
  const [template, setTemplate] = useState("classic");
  const [size, setSize] = useState("LETTER");
  const [orientation, setOrientation] = useState("portrait");
  const [background, setBackground] = useState("");
  const [logo, setLogo] = useState("");
  const [showPhotos, setShowPhotos] = useState(true);
  const [showDescriptions, setShowDescriptions] = useState(true);
  const [selected, setSelected] = useState(null);
  const [perPage, setPerPage] = useState(6);
  const [manualBreaks, setManualBreaks] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [draftName, setDraftName] = useState("Main Menu");
  const storageKey = `orderxo:menu-books:${organizationId}:${location.locationId || "default"}`;
  const canManage = permissions.can("menu.manage");
  const fetchMenu = useCallback(async () => {
    if (!location.locationId) return;
    setLoading(true);
    try {
      const q = new URLSearchParams({ organizationId, locationId: location.locationId, menuScope: "default" });
      const [c, m] = await Promise.all(["categories", "menu"].map(async (path) => {
        const r = await ownerFetch(`/api/owner/manage/admin/${path}?${q}`, { cache: "no-store" });
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || "Unable to load menu");
        return body;
      }));
      setCategories(c.categories || []);
      setItems(m.items || []);
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }, [organizationId, location.locationId]);
  useEffect(() => { fetchMenu(); }, [fetchMenu]);
  useEffect(() => { try { setDrafts(JSON.parse(localStorage.getItem(storageKey) || "[]")); } catch { setDrafts([]); } }, [storageKey]);
  const ordered = useMemo(() => {
    const active = items.filter(x => x.isActive !== false && (selected === null || selected.includes(id(x))));
    return [...active].sort((a, b) => {
      const ca = categories.findIndex(c => id(c) === id(a.category));
      const cb = categories.findIndex(c => id(c) === id(b.category));
      return (ca < 0 ? 999 : ca) - (cb < 0 ? 999 : cb) || (a.sortOrder || 0) - (b.sortOrder || 0);
    });
  }, [items, categories, selected]);
  const pages = useMemo(() => {
    const result = []; let page = []; let previous = "";
    ordered.forEach(item => {
      const category = id(item.category);
      if (page.length && (page.length >= perPage || manualBreaks.includes(id(item)))) { result.push(page); page = []; previous = ""; }
      page.push({ ...item, categoryLabel: categories.find(c => id(c) === category)?.name || "Menu", showCategory: previous !== category });
      previous = category;
    });
    if (page.length) result.push(page);
    return result.length ? result : [[]];
  }, [ordered, categories, perPage, manualBreaks]);
  const save = () => {
    const entry = { id: Date.now(), draftName, title, template, size, orientation, background, logo, showPhotos, showDescriptions, selected, perPage, manualBreaks };
    const next = [entry, ...drafts].slice(0, 20);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setDrafts(next); toast.success("Design saved in this browser"); } catch { toast.error("Unable to save design"); }
  };
  const loadDraft = (v) => { setDraftName(v.draftName); setTitle(v.title); setTemplate(v.template); setSize(v.size); setOrientation(v.orientation); setBackground(v.background); setLogo(v.logo); setShowPhotos(v.showPhotos); setShowDescriptions(v.showDescriptions); setSelected(v.selected); setPerPage(v.perPage); setManualBreaks(v.manualBreaks || []); };
  const colors = THEMES[template];
  const dims = SIZES[size];
  const pageWidth = orientation === "portrait" ? dims[0] : dims[1];
  const pageHeight = orientation === "portrait" ? dims[1] : dims[0];
  return <div className="p-5 md:p-8 max-w-7xl mx-auto text-slate-900">
    <style>{`@media print { @page { margin: 0; } body * { visibility: hidden !important; } #menu-book-print, #menu-book-print * { visibility: visible !important; } #menu-book-print { position: absolute !important; inset: 0; width: 100%; display: block !important; } .menu-book-sheet { box-shadow: none !important; border: 0 !important; margin: 0 !important; break-after: page; page-break-after: always; print-color-adjust: exact; -webkit-print-color-adjust: exact; } .menu-book-sheet:last-child { break-after: auto; page-break-after: auto; } }`}</style>
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6"><div><Link className="text-orange-700 text-sm" href={`/dashboard/restaurants/${organizationId}/menu`}>← Menu Management</Link><h1 className="text-3xl font-bold mt-2">Menu Book Designer</h1><p className="text-slate-500">Multi-page printed menus synchronized with your live menu.</p></div><div className="flex gap-2"><button className="rounded-lg border px-4 py-2" onClick={fetchMenu}>Refresh menu</button><button disabled={!canManage} className="rounded-lg border px-4 py-2 disabled:opacity-40" onClick={save}>Save design</button><button className="rounded-lg bg-orange-700 text-white px-4 py-2" onClick={() => window.print()}>Print / Save PDF</button></div></div>
    <div className="grid lg:grid-cols-[300px_minmax(0,1fr)] gap-6"><aside className="space-y-4 bg-white rounded-xl border p-4 self-start">
      <label className="block text-sm font-semibold">Design name<input className="w-full border rounded p-2 mt-1" value={draftName} onChange={e => setDraftName(e.target.value)} /></label>
      <label className="block text-sm font-semibold">Printed title<input className="w-full border rounded p-2 mt-1" value={title} onChange={e => setTitle(e.target.value)} /></label>
      <label className="block text-sm font-semibold">Template<select className="w-full border rounded p-2 mt-1" value={template} onChange={e => setTemplate(e.target.value)}><option value="classic">Classic</option><option value="modern">Modern</option><option value="dark">Dark</option></select></label>
      <div className="grid grid-cols-2 gap-2"><label className="text-sm font-semibold">Paper<select className="w-full border rounded p-2 mt-1" value={size} onChange={e => setSize(e.target.value)}>{Object.keys(SIZES).map(x => <option key={x}>{x}</option>)}</select></label><label className="text-sm font-semibold">Orientation<select className="w-full border rounded p-2 mt-1" value={orientation} onChange={e => setOrientation(e.target.value)}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label></div>
      <label className="block text-sm font-semibold">Background color<input type="color" className="block mt-1" value={background || colors.bg} onChange={e => setBackground(e.target.value)} /></label>
      <label className="block text-sm font-semibold">Logo URL<input className="w-full border rounded p-2 mt-1" value={logo} onChange={e => setLogo(e.target.value)} placeholder="https://..." /></label>
      <label className="flex gap-2 items-center"><input type="checkbox" checked={showPhotos} onChange={e => setShowPhotos(e.target.checked)} /> Food photos</label>
      <label className="flex gap-2 items-center"><input type="checkbox" checked={showDescriptions} onChange={e => setShowDescriptions(e.target.checked)} /> Descriptions</label>
      <label className="block text-sm font-semibold">Maximum items per page<input type="number" min="1" max="20" className="w-full border rounded p-2 mt-1" value={perPage} onChange={e => setPerPage(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} /></label>
      <div className="border-t pt-3"><div className="flex justify-between items-center"><strong>Include items</strong><button className="text-orange-700 text-sm" onClick={() => setSelected(null)}>All</button></div><div className="max-h-56 overflow-auto space-y-2 mt-2">{items.map(item => <label className="flex items-center gap-2 text-sm" key={id(item)}><input type="checkbox" checked={selected === null || selected.includes(id(item))} onChange={e => { const current = selected === null ? items.map(id) : selected; setSelected(e.target.checked ? [...current, id(item)] : current.filter(x => x !== id(item))); }} />{item.name}</label>)}</div></div>
      <div className="border-t pt-3"><strong>Saved designs (this browser)</strong><div className="space-y-1 mt-2">{drafts.map(v => <button key={v.id} onClick={() => loadDraft(v)} className="block text-left w-full text-sm border rounded p-2 hover:bg-slate-50">{v.draftName}</button>)}</div></div>
    </aside><div>{loading ? <p>Loading menu…</p> : <><p className="mb-3 text-sm text-slate-600">{pages.length} page(s) · {ordered.length} item(s). Use “Start new page” below an item to insert a manual break.</p><div id="menu-book-print" className="space-y-6">{pages.map((group, index) => <div key={index} className="menu-book-sheet relative mx-auto border shadow-md overflow-hidden" style={{ width: `${pageWidth}in`, minHeight: `${pageHeight}in`, background: background || colors.bg, color: colors.ink, padding: "0.55in", boxSizing: "border-box", maxWidth: "100%" }}><header className="text-center border-b pb-4 mb-6" style={{ borderColor: colors.accent }}>{logo && <img src={logo} alt="Restaurant logo" className="max-h-20 mx-auto mb-2 object-contain" />}<h2 className="text-3xl font-bold tracking-wide" style={{ color: colors.accent }}>{title}</h2><div className="text-xs mt-2 tracking-widest uppercase">Freshly prepared · Made to order</div></header><div className="space-y-4">{group.map((item, i) => <div key={id(item)}>{item.showCategory && <h3 className="text-xl font-bold mt-5 mb-3 pb-1 border-b" style={{ color: colors.accent, borderColor: colors.accent }}>{item.categoryLabel}</h3>}<div className="flex gap-3 items-start break-inside-avoid">{showPhotos && item.image && <img src={item.image} alt="" className="w-20 h-20 object-cover rounded" />}<div className="flex-1"><div className="flex justify-between gap-3 font-semibold"><span>{item.name}</span><span className="whitespace-nowrap">{money(item.priceCents)}</span></div>{showDescriptions && <p className="text-sm mt-1 opacity-80">{clean(item.description)}</p>}</div></div><button className="print:hidden text-xs underline opacity-60 mt-1" onClick={() => setManualBreaks(old => old.includes(id(item)) ? old.filter(x => x !== id(item)) : [...old, id(item)])}>{manualBreaks.includes(id(item)) ? "Remove page break" : "Start new page before this item"}</button></div>)}</div><footer className="absolute bottom-5 left-0 right-0 text-center text-xs opacity-70">{index + 1} / {pages.length}</footer></div>)}</div></>}</div></div>
    <p className="mt-5 text-sm text-slate-500">For accurate output, select the same paper size and orientation in your browser print dialog, turn on background graphics, and use Save as PDF. Designs are stored locally in this browser; they are not yet shared across devices.</p>
  </div>;
}
