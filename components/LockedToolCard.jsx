"use client";

import { useState } from "react";
import Link from "next/link";
import { LockKeyhole, X, ShoppingBag, Gift, ChartNoAxesCombined, Users, Utensils, BookOpen, Printer, Tags } from "lucide-react";

const icons = { orders: ShoppingBag, "gift-cards": Gift, financials: ChartNoAxesCombined, users: Users, menu: Utensils, "menu-book": BookOpen, notices: Printer, promotions: Tags };

export default function LockedToolCard({ title, description, iconName, billingHref }) {
  const [open, setOpen] = useState(false);
  const Icon = icons[iconName] || LockKeyhole;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="w-full rounded-2xl border bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600"
        aria-label={`${title}: upgrade required`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><Icon size={23} strokeWidth={1.8} aria-hidden="true" /></span>
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <LockKeyhole size={18} className="shrink-0 text-slate-500" aria-hidden="true" />
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        <p className="mt-5 text-sm font-semibold text-orange-600">Upgrade to unlock →</p>
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby={`locked-${iconName}`} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h2 id={`locked-${iconName}`} className="text-xl font-bold text-slate-900">Unlock {title}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg p-1 text-slate-600 hover:bg-slate-100"><X size={22} /></button>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{title} is available with an active Starter, Growth, or Pro subscription. Upgrade to access this feature.</p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">Maybe later</button>
              <Link href={billingHref} className="rounded-xl bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700">View plans</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
