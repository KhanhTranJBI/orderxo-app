"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SupportWorkspace() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const router = useRouter();
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const token = window.location.hash.slice(1);
        if (token) {
          window.history.replaceState(null, "", window.location.pathname);
          if (!/^[a-f0-9]{64}$/.test(token)) throw Error("Invalid setup link");
          const redeemed = await fetch("/api/support/redeem", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          const result = await redeemed.json();
          if (!redeemed.ok) throw Error(result.error || "Unable to redeem link");
        }
        const response = await fetch("/api/support/workspace", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw Error(result.error || "Unable to load workspace");
        if (active) setData(result);
      } catch (e) { if (active) setError(e.message); }
      finally { if (active) setBusy(false); }
    }
    load();
    return () => { active = false; };
  }, []);
  async function endSession() {
    await fetch("/api/support/end", { method: "POST" });
    router.replace("/login");
  }
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-sm font-bold uppercase tracking-widest text-orange-600">OrderXO Staff Workspace</p>
            <h1 className="mt-2 text-3xl font-bold">{data?.organization?.name || "Setup Mode"}</h1></div>
          {data && <button onClick={endSession} className="rounded-lg border border-slate-300 bg-white px-4 py-3 font-semibold hover:bg-slate-100">End Support Session</button>}
        </div>
        {busy && <div role="status" className="rounded-xl bg-white p-6">Loading secure workspace…</div>}
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>}
        {data && <>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
            <strong>{data.session.mode === "setup" ? "Setup Mode" : "Support Access"} · Read-only</strong>
            <p className="mt-1">Access expires {new Date(data.session.expiresAt).toLocaleString()}. This workspace is restricted to the selected restaurant. Menu and website editing are not yet authorized; owner credentials are never shared.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">Restaurant</p><p className="mt-2 text-xl font-bold">{data.organization.name}</p><p className="text-sm text-slate-500">{data.organization.status}</p></div>
            <div className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">Locations</p><p className="mt-2 text-3xl font-bold">{data.locations.length}</p></div>
            <div className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">Homepage</p><p className="mt-2 text-xl font-bold">{data.homepage.publishedExists ? "Published" : "Not published"}</p><p className="text-sm text-slate-500">{data.homepage.draftExists ? "Draft available" : "No draft"}</p></div>
          </div>
          <section className="rounded-xl border bg-white p-6"><h2 className="mb-4 text-xl font-bold">Restaurant locations</h2>
            {data.locations.length ? <div className="divide-y">{data.locations.map((loc) => <div key={loc.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><h3 className="font-semibold">{loc.name}</h3><p className="text-sm text-slate-500">{[loc.city,loc.state].filter(Boolean).join(", ") || loc.slug}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{loc.domainStatus.replaceAll("_", " ")}</span></div>)}</div> : <p className="text-slate-500">No active locations found.</p>}
          </section>
          <section className="rounded-xl border bg-white p-6"><h2 className="text-xl font-bold">Setup checklist</h2><p className="mt-2 text-sm text-slate-600">The following steps require scoped editing permissions before staff can complete them inside this workspace.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">{["Restaurant profile & locations","Menu, categories & modifiers","Homepage design & slides","Business hours & ordering","Stripe connection (owner approval)","Preview & go-live readiness"].map((item) => <div key={item} className="rounded-lg border bg-slate-50 p-4 text-sm font-medium">{item}</div>)}</div>
          </section>
        </>}
      </div>
    </main>
  );
}
