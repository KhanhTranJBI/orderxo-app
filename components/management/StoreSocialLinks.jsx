"use client";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ownerFetch } from "../../lib/ownerFetch";
const FIELDS = [["facebook","Facebook"],["instagram","Instagram"],["google","Google Business Profile"],["googleReview","Google Review Link"],["yelp","Yelp"],["tiktok","TikTok"],["youtube","YouTube"]];
export default function StoreSocialLinks({ organizationId, locationId, canManage }) {
  const [data,setData] = useState(null);
  const [draft,setDraft] = useState({});
  const [modes,setModes] = useState({});
  const [busy,setBusy] = useState(false);
  const query = new URLSearchParams({ organizationId, ...(locationId ? { locationId } : {}) });
  useEffect(() => {
    let cancelled = false;
    setData(null);
    ownerFetch(`/api/owner/locations/social-links?${query}`, { cache:"no-store" }).then(async r => {
      const d = await r.json(); if (!r.ok) throw Error(d.error || "Unable to load links");
      if (!cancelled) { setData(d); setDraft(locationId ? d.overrides : d.defaults); setModes(Object.fromEntries(FIELDS.map(([k]) => [k, !locationId ? "custom" : !Object.prototype.hasOwnProperty.call(d.overrides || {},k) ? "inherit" : d.overrides[k] === null ? "hidden" : "custom"]))); }
    }).catch(e => { if (!cancelled) toast.error(e.message); });
    return () => { cancelled = true; };
  },[organizationId,locationId]);
  const save = async () => {
    if (locationId && FIELDS.some(([key]) => modes[key] === "custom" && !draft[key])) { toast.error("Enter a URL for each custom link, or select Inherit/Hide."); return; }
    setBusy(true);
    try {
      const r = await ownerFetch("/api/owner/locations/social-links", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ organizationId, ...(locationId ? {locationId} : {}), social:draft }) });
      const d = await r.json(); if (!r.ok) throw Error(d.error || "Unable to save links");
      setData(d); setDraft(locationId ? d.overrides : d.defaults); toast.success("Social links saved");
    } catch(e) { toast.error(e.message); } finally { setBusy(false); }
  };
  if (!data) return <p className="text-sm text-slate-500">Loading social links…</p>;
  return <section className="mt-4 space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
    <h2 className="text-xl font-bold">Social &amp; Links</h2>
    <p className="text-sm text-slate-500">{locationId ? "Override a link for this branch, inherit the restaurant default, or hide it for this branch." : "Default social links used by all branches unless overridden."}</p>
    <div className="grid gap-5 md:grid-cols-2">{FIELDS.map(([key,label]) => {
      const hasOverride = Object.prototype.hasOwnProperty.call(draft,key);
      const mode = modes[key] || (!locationId ? "custom" : !hasOverride || draft[key] === "" ? "inherit" : draft[key] === null ? "hidden" : "custom");
      return <div key={key} className="space-y-2"><label className="block text-sm font-semibold">{label}</label>
        {locationId && <select className="field w-full" disabled={!canManage} value={mode} onChange={e => { setModes(v => ({...v,[key]:e.target.value})); setDraft(v => ({...v,[key]:e.target.value === "inherit" ? "" : e.target.value === "hidden" ? null : (data.effective[key] || "")})); }}>
          <option value="inherit">Use restaurant default</option><option value="custom">Custom link</option><option value="hidden">Hide at this location</option>
        </select>}
        {mode === "custom" ? <input className="field w-full" type="url" disabled={!canManage} placeholder="https://..." value={draft[key] || ""} onChange={e => setDraft(v => ({...v,[key]:e.target.value}))}/> : <p className="text-xs text-slate-500">{mode === "hidden" ? "Hidden for this location" : data.defaults[key] || "No default link configured"}</p>}
      </div>;
    })}</div>
    {canManage && <button type="button" className="primary" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save social links"}</button>}
  </section>;
}
