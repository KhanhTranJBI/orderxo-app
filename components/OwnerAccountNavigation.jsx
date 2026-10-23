"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserRound, X, Store, LogOut, LogIn, ArrowUpRight } from "lucide-react";

export default function OwnerAccountNavigation({ signedIn = true, staffMode = false }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = oldOverflow; };
  }, [open]);

  async function signOut() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(staffMode ? "/api/support/end" : "/api/owner/logout", { method: "POST", cache: "no-store" });
      if (!response.ok) throw new Error("Could not sign out. Please try again.");
      setOpen(false);
      router.replace("/login");
      router.refresh();
    } catch (error) {
      alert(error.message || "Could not sign out.");
    } finally { setBusy(false); }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50">
        <UserRound size={20} /> Account
      </button>
      {open && (
        <div className="fixed inset-0 z-[100]">
          <button aria-label="Close account navigation" className="absolute inset-0 bg-slate-950/50" onClick={() => setOpen(false)} />
          <aside role="dialog" aria-modal="true" aria-label="Account and navigation" className="absolute right-0 top-0 flex h-full w-full max-w-[390px] flex-col bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div><h2 className="text-xl font-bold text-slate-900">OrderXO Owner Portal</h2><p className="text-sm text-slate-500">Account & navigation</p></div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close sidebar" className="rounded-lg border p-2 hover:bg-slate-50"><X size={23} /></button>
            </div>
            <div className="border-b border-slate-200 px-6 py-5 font-semibold text-slate-800">{signedIn ? (staffMode ? "Staff support session" : "Signed in") : "Not signed in"}</div>
            <nav className="flex-1 p-4">
              <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-4 font-semibold text-slate-800 hover:bg-slate-100"><Store size={20} /> Your restaurants <ArrowUpRight className="ml-auto" size={18} /></Link>
            </nav>
            <div className="border-t border-slate-200 p-5">
              {signedIn ? <button type="button" onClick={signOut} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"><LogOut size={19}/>{busy ? "Signing out…" : staffMode ? "End support session" : "Sign out"}</button> : <Link href="/login" className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 p-3 font-semibold text-white"><LogIn size={19}/>Sign in</Link>}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
