"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ownerFetch } from "../lib/ownerFetch";
import ImageUploadButton from "./ui/ImageUploadButton";

const types = ["hero", "text", "image", "textImage", "cta", "faq"];
const emptyPage = () => ({ title: "New page", slug: `page-${Date.now()}`, description: "", seoTitle: "", published: false, showInNav: false, sections: [] });
const newSection = (type) => ({ id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type, heading: "", body: "", imageUrl: "", buttonLabel: "", buttonUrl: "" });
const inputClass = "w-full rounded-lg border border-slate-300 p-2 text-slate-900";
export default function CustomPagesBuilder({ organizationId }) {
  const [pages, setPages] = useState([]), [selected, setSelected] = useState(0);
  const [allowed, setAllowed] = useState(false), [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [message, setMessage] = useState("");
  const [drag, setDrag] = useState(null);
  useEffect(() => {
    Promise.all([
      ownerFetch(`/api/owner/organizations/settings?organizationId=${encodeURIComponent(organizationId)}`).then(r => r.json()),
      ownerFetch(`/api/owner/website-plus/entitlement?organizationId=${encodeURIComponent(organizationId)}`).then(r => r.json()),
    ]).then(([settings, ent]) => {
      setPages(settings.settings?.website?.customPages || []);
      setAllowed(Boolean(ent.websitePlus || ent.paidPlan));
    }).catch(() => setMessage("Unable to load custom pages.")).finally(() => setLoading(false));
  }, [organizationId]);
  const page = pages[selected];
  const patch = (change) => setPages(old => old.map((p, i) => i === selected ? { ...p, ...change } : p));
  const patchSection = (index, change) => patch({ sections: page.sections.map((s, i) => i === index ? { ...s, ...change } : s) });
  const reorder = (from, to) => {
    if (from === null || from === to || from < 0 || to < 0) return;
    const list = [...page.sections]; const [item] = list.splice(from, 1); list.splice(to, 0, item); patch({ sections: list });
  };
  const save = async () => {
    setSaving(true); setMessage("");
    try {
      const response = await ownerFetch("/api/owner/organizations/settings", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, website: { customPages: pages } }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save pages");
      setMessage("Pages saved successfully.");
    } catch (error) { setMessage(error.message); } finally { setSaving(false); }
  };
  if (loading) return <p className="p-6">Loading page builder...</p>;
  if (!allowed) return <div className="rounded-xl border border-orange-200 bg-orange-50 p-6"><p className="font-semibold">Custom Pages are available with Website Plus or an active ordering plan.</p><Link className="mt-3 inline-block text-orange-700 underline" href={`/dashboard/settings/billing?organizationId=${organizationId}`}>View Plans & Upgrade</Link></div>;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center gap-3"><h1 className="mr-auto text-2xl font-bold">Custom Page Builder</h1><button className="rounded-lg border px-4 py-2" onClick={() => { setPages([...pages, emptyPage()]); setSelected(pages.length); }}>+ New page</button><button disabled={saving} onClick={save} className="rounded-lg bg-orange-600 px-5 py-2 font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save pages"}</button></div>
    {message && <p role="status" className="rounded-lg bg-slate-100 p-3">{message}</p>}
    <div className="flex flex-wrap gap-2">{pages.map((p, i) => <button key={i} onClick={() => setSelected(i)} className={`rounded-lg border px-3 py-2 ${selected === i ? "border-orange-500 bg-orange-50" : ""}`}>{p.title || p.slug} {p.published ? "●" : "○"}</button>)}</div>
    {page && <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="space-y-4 rounded-xl border bg-white p-5">
        <label className="block">Page name<input className={inputClass} value={page.title} onChange={e => patch({ title: e.target.value })}/></label>
        <label className="block">URL slug (/pages/...)<input className={inputClass} value={page.slug} onChange={e => patch({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}/></label>
        <label className="block">SEO title<input className={inputClass} maxLength={70} value={page.seoTitle || ""} onChange={e => patch({ seoTitle: e.target.value })}/></label>
        <label className="block">Meta description<textarea className={inputClass} maxLength={320} value={page.description || ""} onChange={e => patch({ description: e.target.value })}/></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(page.showInNav)} onChange={e => patch({ showInNav: e.target.checked })}/> Add to website navigation</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={page.published} onChange={e => patch({ published: e.target.checked })}/> Published</label>
        <p className="text-sm text-slate-500">Drag sections to reorder. Click fields to edit text and add images using HTTPS image URLs.</p>
        <div className="flex flex-wrap gap-2">{types.map(t => <button key={t} className="rounded-lg border px-3 py-2 capitalize hover:border-orange-500" onClick={() => patch({ sections: [...page.sections, newSection(t)] })}>+ {t}</button>)}</div>
        {page.sections.map((s, i) => <div key={s.id} draggable onDragStart={() => setDrag(i)} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); reorder(drag, i); setDrag(null); }} onDragEnd={() => setDrag(null)} className="space-y-2 rounded-lg border bg-slate-50 p-3">
          <div className="flex items-center justify-between"><strong className="capitalize">⠿ {s.type}</strong><div className="flex gap-2"><button onClick={() => reorder(i, i-1)} disabled={i === 0}>↑</button><button onClick={() => reorder(i, i+1)} disabled={i === page.sections.length-1}>↓</button><button className="text-red-600" onClick={() => patch({ sections: page.sections.filter((_, j) => j !== i) })}>Remove</button></div></div>
          {s.type !== "image" && <input className={inputClass} placeholder="Heading" value={s.heading} onChange={e => patchSection(i, { heading: e.target.value })}/>}
          {!["image"].includes(s.type) && <textarea className={inputClass} rows={3} placeholder="Text / description" value={s.body} onChange={e => patchSection(i, { body: e.target.value })}/>}
          {["hero", "image", "textImage"].includes(s.type) && <input className={inputClass} placeholder="Image URL (https://...)" value={s.imageUrl} onChange={e => patchSection(i, { imageUrl: e.target.value })}/>}
          {["hero", "image", "textImage"].includes(s.type) && <ImageUploadButton organizationId={organizationId} label="Upload section image" onUploaded={url => patchSection(i, { imageUrl: url })}/>}
          {["hero", "cta"].includes(s.type) && <><input className={inputClass} placeholder="Button label" value={s.buttonLabel} onChange={e => patchSection(i, { buttonLabel: e.target.value })}/><input className={inputClass} placeholder="Button URL" value={s.buttonUrl} onChange={e => patchSection(i, { buttonUrl: e.target.value })}/></>}
        </div>)}
        <button className="text-red-600 underline" onClick={() => { if (confirm("Delete this page?")) { setPages(pages.filter((_, i) => i !== selected)); setSelected(0); } }}>Delete page</button>
      </div>
      <div className="rounded-xl border bg-white p-5"><h2 className="mb-4 font-bold">Live preview</h2><div className="overflow-hidden rounded-lg border">{page.sections.map(s => <section key={s.id} className={`space-y-3 p-6 ${s.type === "hero" ? "bg-slate-100 text-center" : ""}`}>
        {s.heading && <h2 className="text-2xl font-bold">{s.heading}</h2>}
        {s.body && <p className="whitespace-pre-wrap">{s.body}</p>}
        {s.imageUrl && /^https:\/\//.test(s.imageUrl) && <img src={s.imageUrl} alt={s.heading || "Page image"} className="max-h-72 w-full rounded object-cover"/>}
        {s.buttonLabel && <span className="inline-block rounded bg-orange-600 px-4 py-2 text-white">{s.buttonLabel}</span>}
      </section>)}</div><p className="mt-3 text-sm text-slate-500">Preview only. Save to publish changes at /pages/{page.slug}.</p></div>
    </div>}
  </div>;
}
