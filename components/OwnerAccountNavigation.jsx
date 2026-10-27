"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ChevronRight,
  ArrowUpRight,
  ClipboardList,
  LogIn,
  LogOut,
  Store,
  UserRound,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function OwnerAccountNavigation({
  email = "",
  signedIn = false,
  staffMode = false,
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
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
      if (!response.ok) throw new Error("Unable to sign out. Please try again.");
      setOpen(false);
      router.replace("/login");
      router.refresh();
    } catch (err) {
      setError(err.message || "Unable to sign out.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 hover:bg-slate-50"
      >
        <UserRound size={21} aria-hidden="true" /> Account
      </button>
      <style>{`
        @keyframes orderxoPanelEnter { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes orderxoBackdropEnter { from { opacity: 0; } to { opacity: 1; } }
        .account-panel { animation: orderxoPanelEnter 240ms ease-out both; }
        .account-backdrop { animation: orderxoBackdropEnter 240ms ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .account-panel, .account-backdrop { animation: none; }
        }
      `}</style>
      {mounted &&
        open &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999]"
            style={{ position: "fixed", inset: 0, zIndex: 9999 }}
          >
            <button
              type="button"
              aria-label="Close account menu"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-slate-900/50 account-backdrop"
            />
            <aside
              role="dialog"
              aria-modal="true"
              aria-label="Account and navigation"
              className="absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col overflow-hidden bg-white text-slate-900 shadow-2xl account-panel"
            >
              <header className="flex items-start justify-between border-b border-slate-200 px-7 py-7">
                <div>
                  <h2 className="text-2xl font-bold">{staffMode ? "OrderXO Staff Portal" : "OrderXO Owner Portal"}</h2>
                  <p className="mt-1 text-slate-500">Account &amp; navigation</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="rounded-xl border border-slate-200 p-3 hover:bg-slate-50"
                >
                  <X />
                </button>
              </header>
              <div className="flex items-center gap-4 border-b border-slate-200 px-7 py-7">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-orange-50 font-bold text-2xl text-orange-600">
                  {email?.charAt(0)?.toUpperCase() || (staffMode ? "S" : "U")}
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold">{staffMode ? "Staff support session" : signedIn ? "Signed in" : "Not signed in"}</p>
                  {email ? (
                    <p className="break-all text-sm text-slate-500">{email}</p>
                  ) : staffMode ? (
                    <p className="text-sm text-slate-500">Staff email unavailable in this session</p>
                  ) : null}
                </div>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto px-5 py-5">
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 px-4 py-4 font-semibold hover:bg-slate-50"
                >
                  <Store size={23} />
                  <span className="flex-1">Your restaurants</span>
                  <ChevronRight size={19} />
                </Link>
                <a
                  href="https://orders.orderxo.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 px-4 py-4 font-semibold hover:bg-slate-50"
                >
                  <ClipboardList size={23} />
                  <span className="flex-1">OrderXO Operations</span>
                  <ArrowUpRight size={19} />
                </a>
              </nav>
              <footer className="border-t border-slate-200 p-5">
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
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 px-5 py-3 font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    <LogOut size={19} />
                    {busy ? "Signing out…" : staffMode ? "End support session" : "Sign out"}
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-bold"
                  >
                    <LogIn size={19} /> Sign in
                  </Link>
                )}
              </footer>
            </aside>
          </div>,
          document.body,
        )}
    </>
  );
}
