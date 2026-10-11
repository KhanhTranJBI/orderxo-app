"use client";
import { ownerFetch } from "../lib/ownerFetch";
import { useState } from "react";

const clean = (s) => String(s || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
export default function DomainsManager({ organization, locations }) {
  const [custom, setCustom] = useState(organization.customDomain || "");
  const [value, setValue] = useState(custom);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const organizationId = String(organization._id || organization.id);
  const hostname = `${organization.slug}.orderxo.com`;
  const origin = `https://${custom || hostname}`;
  const copy = async (s) => { try { await navigator.clipboard.writeText(s); setMessage("Link copied."); } catch { setMessage(s); } };
  async function save() {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await ownerFetch("/api/owner/domains", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId, domain: clean(value) || null }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to update custom domain");
      setCustom(result.domain || ""); setValue(result.domain || ""); setEditing(false);
      setMessage(result.message || "Domain settings saved.");
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <div className="mt-8 space-y-5">
    {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}
    {message && <p className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">{message}</p>}
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Restaurant website</h2>
      <p className="mt-2 text-sm text-slate-600">One website and one custom domain for all locations. Customers select their pickup location before ordering.</p>
      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">OrderXO address</p>
      <div className="mt-1 flex flex-wrap items-center gap-3"><a className="break-all font-mono text-orange-700" href={`https://${hostname}`} target="_blank" rel="noreferrer">{hostname}</a><button className="rounded-lg border px-3 py-1 text-sm" onClick={() => copy(`https://${hostname}`)}>Copy</button></div>
      <div className="mt-5 border-t pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Restaurant custom domain</p>
        <p className="mt-1 font-mono">{custom || "Not connected"}</p>
        {editing ? <div className="mt-3 flex flex-wrap gap-2"><input className="min-w-0 flex-1 rounded-xl border px-3 py-2" placeholder="www.myrestaurant.com" value={value} onChange={e => setValue(e.target.value)} /><button disabled={busy} onClick={save} className="rounded-xl bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-60">{busy ? "Saving…" : "Save domain"}</button><button onClick={() => {setEditing(false);setValue(custom);}} className="rounded-xl border px-4 py-2">Cancel</button></div> : <button className="mt-3 rounded-xl border border-orange-200 px-4 py-2 font-semibold text-orange-700" onClick={() => setEditing(true)}>{custom ? "Change custom domain" : "Connect custom domain"}</button>}
        <p className="mt-3 text-sm text-slate-500">Configure DNS and verify the domain before redirecting customers. Changes apply to the whole restaurant, not one location.</p>
      </div>
    </section>
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Location ordering links</h2>
      <p className="mt-2 text-sm text-slate-600">Share a direct link to a location's menu. All links stay on the restaurant's website.</p>
      <div className="mt-4 divide-y">{locations.filter(l => l.status !== "archived").map(l => { const link = `${origin}/locations/${encodeURIComponent(l.slug)}`; return <div key={String(l._id || l.id)} className="py-4"><div className="flex flex-wrap justify-between gap-2"><strong>{l.name}</strong><span className="text-sm text-slate-500">{l.status || "pending"}</span></div><div className="mt-2 flex flex-wrap items-center gap-3"><a className="min-w-0 break-all font-mono text-sm text-orange-700" href={link} target="_blank" rel="noreferrer">{link}</a><button className="rounded-lg border px-3 py-1 text-sm" onClick={() => copy(link)}>Copy link</button></div></div>; })}</div>
    </section>
  </div>;
}
