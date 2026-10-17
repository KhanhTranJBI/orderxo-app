"use client";
import { ownerFetch } from "../lib/ownerFetch";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { CheckCircle2, AlertTriangle, Globe, RefreshCw, X, Copy, ExternalLink } from "lucide-react";

const clean = (s) => String(s || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "").replace(/\.$/, "");
const btn = "rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50";

export default function DomainsManager({ organization, locations }) {
  const organizationId = String(organization._id || organization.id);
  const hostname = `${organization.slug}.orderxo.com`;
  const [custom, setCustom] = useState(organization.customDomain || "");
  const [draft, setDraft] = useState(organization.customDomain || "");
  const [domainInfo, setDomainInfo] = useState(null);
  const [modal, setModal] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const origin = `https://${custom || hostname}`;

  const copy = async (value) => {
    try { await navigator.clipboard.writeText(value); toast.success("Copied to clipboard"); }
    catch { toast.error("Unable to copy. Please copy the value manually."); }
  };
  const getInfo = useCallback(async (quiet = false) => {
    if (!quiet) setChecking(true);
    try {
      const response = await ownerFetch(`/api/owner/domains?organizationId=${encodeURIComponent(organizationId)}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to check domain status");
      setDomainInfo(data);
      if (data.domain !== undefined) setCustom(data.domain || "");
      if (!quiet) toast.success(data.verified ? "Domain verified" : "Domain status refreshed");
    } catch (error) { if (!quiet) toast.error(error.message); }
    finally { setChecking(false); }
  }, [organizationId]);
  useEffect(() => { getInfo(true); }, [getInfo]);

  const save = async () => {
    const domain = clean(draft);
    if (!domain) return toast.error("Enter a domain, such as www.myrestaurant.com");
    setBusy(true);
    try {
      const response = await ownerFetch("/api/owner/domains", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, domain }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to register custom domain");
      setDomainInfo(data); setCustom(data.domain || ""); setDraft(data.domain || "");
      toast.success(data.verified ? "Domain verified and connected" : "Domain registered. Complete DNS verification below.");
    } catch (error) { toast.error(error.message); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true);
    try {
      const response = await ownerFetch("/api/owner/domains", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to disconnect domain");
      setCustom(""); setDraft(""); setDomainInfo(data); setConfirmRemove(false); setModal(false);
      toast.success("OrderXO domain mapping disconnected");
    } catch (error) { toast.error(error.message); }
    finally { setBusy(false); }
  };
  const verified = domainInfo?.verified === true;
  const statusText = !custom ? "Not connected" : verified ? "Verified & active" : domainInfo?.status === "not_registered" ? "Not registered with Vercel" : "Pending verification";
  const dns = domainInfo?.dns;
  const records = Array.isArray(domainInfo?.verification) ? domainInfo.verification : [];
  const dnsHints = [
    ...((dns?.recommendedCNAME || []).map?.(r => ({ label: "CNAME", value: typeof r === "string" ? r : JSON.stringify(r) })) || []),
    ...((dns?.recommendedIPv4 || []).map?.(r => ({ label: "A / IPv4", value: typeof r === "string" ? r : JSON.stringify(r) })) || []),
  ];
  return (
    <div className="mt-8 space-y-5">
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Restaurant website</h2>
        <p className="mt-2 text-sm text-slate-600">One website and one custom domain for all locations. Customers select their pickup location before ordering.</p>
        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">OrderXO address</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <a className="break-all font-mono text-orange-700" href={`https://${hostname}`} target="_blank" rel="noreferrer">{hostname}</a>
          <button className={btn} onClick={() => copy(`https://${hostname}`)}>Copy</button>
        </div>
        <div className="mt-5 border-t pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Restaurant custom domain</p>
          <p className="mt-1 break-all font-mono">{custom || "Not connected"}</p>
          <div className="mt-2 flex items-center gap-2 text-sm">
            {verified ? <CheckCircle2 size={17} className="text-green-600"/> : <AlertTriangle size={17} className="text-amber-600"/>}
            <span className={verified ? "text-green-700" : "text-amber-700"}>{statusText}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className={`${btn} border-orange-200 text-orange-700`} onClick={() => { setDraft(custom); setModal(true); }}>
              {custom ? "Change custom domain" : "Connect custom domain"}
            </button>
            {custom && <button className={btn} disabled={checking} onClick={() => getInfo()}><RefreshCw size={15} className="mr-2 inline"/>{checking ? "Checking…" : "Verify domain"}</button>}
          </div>
          <p className="mt-3 text-sm text-slate-500">Only redirect customers after Vercel confirms domain ownership and DNS configuration.</p>
        </div>
      </section>
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Location ordering links</h2>
        <p className="mt-2 text-sm text-slate-600">Share a direct link to a location's menu. All links stay on the restaurant's website.</p>
        <div className="mt-4 divide-y">
          {locations.filter(l => l.status !== "archived").map(l => {
            const link = `${origin}/locations/${encodeURIComponent(l.slug)}`;
            return <div key={String(l._id || l.id)} className="py-4">
              <div className="flex flex-wrap justify-between gap-2"><strong>{l.name}</strong><span className="text-sm text-slate-500">{l.status || "pending"}</span></div>
              <div className="mt-2 flex flex-wrap items-center gap-3"><a className="min-w-0 break-all font-mono text-sm text-orange-700" href={link} target="_blank" rel="noreferrer">{link}</a><button className={btn} onClick={() => copy(link)}>Copy link</button></div>
            </div>;
          })}
        </div>
      </section>
      {modal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={e => { if (e.target === e.currentTarget && !busy) setModal(false); }}>
        <div role="dialog" aria-modal="true" aria-label="Connect custom domain" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-xl font-semibold"><Globe size={20}/> Custom domain</h3><button aria-label="Close" disabled={busy} onClick={() => setModal(false)}><X size={22}/></button></div>
          <p className="mt-2 text-sm text-slate-600">Connect your restaurant's domain to OrderXO. We register the hostname with Vercel and check DNS verification.</p>
          <label htmlFor="custom-domain" className="mt-5 block text-sm font-semibold">Domain hostname</label>
          <input id="custom-domain" className="mt-2 w-full rounded-xl border px-3 py-3 font-mono text-sm" placeholder="www.myrestaurant.com" value={draft} onChange={e => setDraft(e.target.value)} disabled={busy}/>
          {custom && clean(draft) !== custom && <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Changing a live domain can interrupt customers. Keep your old Vercel project active until the new domain is verified.</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <button className={`${btn} border-orange-600 bg-orange-600 text-white`} disabled={busy || !clean(draft)} onClick={save}>{busy ? "Registering…" : custom && clean(draft) !== custom ? "Register new domain" : "Register with Vercel"}</button>
            {custom && <button className={btn} disabled={checking || busy} onClick={() => getInfo()}>{checking ? "Checking…" : "Verify DNS"}</button>}
          </div>
          {custom && <div className="mt-5 rounded-xl border bg-slate-50 p-4">
            <div className="flex items-center gap-2 font-semibold">{verified ? <CheckCircle2 size={18} className="text-green-600"/> : <AlertTriangle size={18} className="text-amber-600"/>}{statusText}</div>
            {dns && <p className="mt-2 text-sm text-slate-600">DNS configuration: {dns.configured ? "Valid" : "Not yet confirmed"}</p>}
            {!verified && <p className="mt-2 text-sm text-slate-600">Use the DNS and ownership records provided by Vercel. Changes may take time to propagate. Then click Verify DNS.</p>}
            {dnsHints.map((r,i) => <div key={i} className="mt-3 rounded-lg border bg-white p-3 text-sm"><span className="font-semibold">{r.label}</span><div className="mt-1 flex items-center justify-between gap-2"><code className="break-all">{r.value}</code><button aria-label="Copy record" onClick={() => copy(r.value)}><Copy size={16}/></button></div></div>)}
            {records.map((r,i) => <div key={i} className="mt-3 rounded-lg border bg-white p-3 text-sm"><div className="font-semibold">{r.type || "Verification"} record</div><p className="mt-1 break-all">Name: <code>{r.domain || r.name || "See Vercel"}</code></p><p className="mt-1 break-all">Value: <code>{r.value || "See Vercel"}</code></p>{r.value && <button className="mt-2 text-orange-700" onClick={() => copy(r.value)}>Copy value</button>}</div>)}
            {!verified && <a className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-orange-700" href="https://vercel.com/dashboard" target="_blank" rel="noreferrer">Open Vercel to view DNS details <ExternalLink size={14}/></a>}
          </div>}
          {custom && <div className="mt-6 border-t pt-4"><button className="text-sm font-semibold text-red-600" onClick={() => setConfirmRemove(true)} disabled={busy}>Disconnect custom domain</button><p className="mt-1 text-xs text-slate-500">Disconnecting removes the OrderXO mapping only; it does not remove the domain from Vercel.</p></div>}
          {confirmRemove && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4"><p className="font-semibold text-red-900">Disconnect {custom}?</p><p className="mt-1 text-sm text-red-800">Your OrderXO subdomain remains available. This does not delete the domain from Vercel.</p><div className="mt-3 flex gap-2"><button className={`${btn} border-red-600 bg-red-600 text-white`} disabled={busy} onClick={remove}>{busy ? "Disconnecting…" : "Confirm disconnect"}</button><button className={btn} disabled={busy} onClick={() => setConfirmRemove(false)}>Cancel</button></div></div>}
        </div>
      </div>}
    </div>
  );
}
