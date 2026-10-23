"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserRound,
  X,
  Store,
  LogOut,
  LogIn,
  ArrowUpRight,
  Globe,
  ClipboardList,
} from "lucide-react";

export default function OwnerAccountNavigation({ signedIn = true, staffMode = false, email = "" }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = oldOverflow;
    };
  }, [open]);

  async function signOut() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(staffMode ? "/api/support/end" : "/api/owner/logout", {
        method: "POST",
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Could not sign out. Please try again.");
      setOpen(false);
      router.replace("/login");
      router.refresh();
    } catch (err) {
      setError(err.message || "Could not sign out.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50"
      >
        <UserRound size={20} /> Account
      </button>
      {open && (
        <div className="fixed inset-0 z-[100]">
          <button
            type="button"
            aria-label="Close account navigation"
            className="absolute inset-0 bg-slate-950/50"
            onClick={() => setOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Account and navigation"
            className="absolute right-0 top-0 flex h-full w-full max-w-[410px] flex-col bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-8 py-7">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">OrderXO Owner Portal</h2>
                <p className="mt-1 text-base text-slate-500">Account &amp; navigation</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close sidebar"
                className="rounded-xl border-2 border-slate-200 p-3 text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                <X size={25} />
              </button>
            </div>
            <div className="flex items-center gap-4 border-b border-slate-200 px-8 py-7">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xl font-extrabold text-orange-600">
                {email ? email.charAt(0).toUpperCase() : <UserRound size={25} />}
              </div>
              <div className="min-w-0">
                <div className="text-lg font-bold text-slate-900">
                  {signedIn ? (staffMode ? "Staff support session" : "Signed in") : "Not signed in"}
                </div>
                {email && <div className="break-all text-sm text-slate-500">{email}</div>}
              </div>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-6 py-6">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-4 rounded-xl px-4 py-4 text-base font-semibold text-slate-800 hover:bg-slate-100"
              >
                <Store size={22} /> Your restaurants <ArrowUpRight className="ml-auto" size={19} />
              </Link>
              <a
                href="https://orders.orderxo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-xl px-4 py-4 text-base font-semibold text-slate-800 hover:bg-slate-100"
              >
                <ClipboardList size={22} /> OrderXO Operations{" "}
                <ArrowUpRight className="ml-auto" size={19} />
              </a>
            </nav>
            <div className="border-t border-slate-200 p-6">
              {error && (
                <p role="alert" className="mb-3 text-sm text-red-700">
                  {error}
                </p>
              )}
              {signedIn ? (
                <button
                  type="button"
                  onClick={signOut}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 p-4 text-base font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  <LogOut size={20} />{" "}
                  {busy ? "Signing out…" : staffMode ? "End support session" : "Sign out"}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 p-4 font-semibold text-white"
                >
                  <LogIn size={20} /> Sign in
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
