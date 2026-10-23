"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";

const TYPES = [
  {
    id: "closed",
    name: "Closed Today",
    heading: "WE ARE CLOSED TODAY",
    message: "We apologize for the inconvenience. Thank you for your understanding!",
  },
  {
    id: "vacation",
    name: "Upcoming Closure",
    heading: "TEMPORARILY CLOSED",
    message:
      "We will be closed during the dates shown below. We look forward to serving you again!",
  },
  {
    id: "early",
    name: "Closing Early",
    heading: "CLOSING EARLY TODAY",
    message: "We are closing early today. Thank you for your understanding!",
  },
  {
    id: "hours",
    name: "Special Hours",
    heading: "SPECIAL BUSINESS HOURS",
    message: "Please see our updated hours below. Thank you!",
  },
  {
    id: "holiday",
    name: "Holiday Closure",
    heading: "HOLIDAY HOURS",
    message: "Wishing you a wonderful holiday!",
  },
  {
    id: "maintenance",
    name: "Maintenance Closure",
    heading: "CLOSED FOR MAINTENANCE",
    message: "We are making improvements and hope to welcome you back soon.",
  },
  {
    id: "soldout",
    name: "Sold Out",
    heading: "SOLD OUT TODAY",
    message: "Thank you for your support! We look forward to serving you again soon.",
  },
  {
    id: "private",
    name: "Private Event",
    heading: "CLOSED FOR A PRIVATE EVENT",
    message: "Thank you for your understanding. We look forward to welcoming you back!",
  },
  {
    id: "staffing",
    name: "Unexpected Closure",
    heading: "CLOSED UNEXPECTEDLY",
    message: "We apologize for the inconvenience and appreciate your patience.",
  },
  {
    id: "reopening",
    name: "Reopening Announcement",
    heading: "WE ARE REOPENING!",
    message: "We are excited to welcome you back!",
  },
  {
    id: "custom",
    name: "Custom Announcement",
    heading: "IMPORTANT NOTICE",
    message: "Thank you for your understanding.",
  },
];
const DATE_TYPES = new Set(["vacation", "holiday", "maintenance", "private", "reopening"]);
const formatDate = (value) => {
  if (!value) return "Date to be announced";
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};
const initial = {
  type: "closed",
  heading: TYPES[0].heading,
  message: TYPES[0].message,
  start: "",
  end: "",
  time: "",
  hours: "",
  phone: "",
  website: "",
  style: "warm",
  paper: "letter",
  orientation: "portrait",
  showRestaurant: true,
};
const palette = {
  warm: { bg: "#fff9ee", text: "#263246", accent: "#d65a1b" },
  modern: { bg: "#ffffff", text: "#14233b", accent: "#2563eb" },
  dark: { bg: "#192433", text: "#ffffff", accent: "#fbbf24" },
  botanical: { bg: "#f1f7ed", text: "#213b2a", accent: "#39744b" },
};
export default function PrintableNotices({ organizationId, restaurantName = "Our Restaurant" }) {
  const [data, setData] = useState(initial);
  const [drafts, setDrafts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [draftName, setDraftName] = useState("Closed Today");
  const [ready, setReady] = useState(false);
  const key = `orderxo:printable-notices:${organizationId}`;
  const update = (field, value) => setData((old) => ({ ...old, [field]: value }));
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "{}");
      if (Array.isArray(saved.drafts)) setDrafts(saved.drafts);
      const last = saved.drafts?.find((x) => x.id === saved.selectedId);
      if (last) {
        setData({ ...initial, ...last.data });
        setDraftName(last.name);
        setSelectedId(last.id);
      }
    } catch {
      /* ignore corrupt local data */
    }
    setReady(true);
  }, [key]);
  const save = () => {
    const name = draftName.trim() || "Untitled Notice";
    const id = selectedId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const next = [
      { id, name, data, updatedAt: new Date().toISOString() },
      ...drafts.filter((x) => x.id !== id),
    ];
    try {
      localStorage.setItem(key, JSON.stringify({ drafts: next, selectedId: id }));
      setDrafts(next);
      setSelectedId(id);
      toast.success("Notice saved in this browser");
    } catch {
      toast.error("Could not save notice");
    }
  };
  const select = (entry) => {
    setData({ ...initial, ...entry.data });
    setSelectedId(entry.id);
    setDraftName(entry.name);
    try {
      localStorage.setItem(key, JSON.stringify({ drafts, selectedId: entry.id }));
    } catch {
      /* ignore */
    }
  };
  const remove = () => {
    if (!selectedId) return;
    const next = drafts.filter((x) => x.id !== selectedId);
    setDrafts(next);
    setSelectedId(null);
    setData(initial);
    setDraftName("New Notice");
    try {
      localStorage.setItem(key, JSON.stringify({ drafts: next, selectedId: null }));
    } catch {
      toast.error("Could not update saved notices");
    }
  };
  const theme = palette[data.style] || palette.warm;
  const dateLine = useMemo(() => {
    if (!DATE_TYPES.has(data.type)) return "";
    if (!data.start && !data.end) return "";
    if (data.start && data.end && data.start !== data.end)
      return `${formatDate(data.start)} – ${formatDate(data.end)}`;
    return formatDate(data.start || data.end);
  }, [data.type, data.start, data.end]);
  const paperWidth = data.paper === "a4" ? "210mm" : "8.5in";
  const paperHeight = data.paper === "a4" ? "297mm" : "11in";
  const pageWidth = data.orientation === "landscape" ? paperHeight : paperWidth;
  const pageHeight = data.orientation === "landscape" ? paperWidth : paperHeight;
  const printPage = () => window.print();
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <style>{`
        @media print {
          @page { size: ${data.paper === "a4" ? "A4" : "letter"} ${data.orientation}; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
          body * { visibility: hidden !important; }
          #orderxo-notice-sheet, #orderxo-notice-sheet * { visibility: visible !important; }
          #orderxo-notice-sheet { position: fixed !important; left: 0 !important; top: 0 !important; margin: 0 !important; border: none !important; box-shadow: none !important; max-width: none !important; break-inside: avoid !important; print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
        }
      `}</style>
          <div>
            <h1 className="text-3xl font-bold">Printable Notices</h1>
            <p className="mt-1 text-slate-500">
              Create a professional sign for your restaurant door in minutes.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={!ready}
              className="rounded-lg border bg-white px-4 py-2 font-semibold"
            >
              Save Notice
            </button>
            <button
              onClick={printPage}
              className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white"
            >
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[340px_minmax(0,1fr)] print:block">
        <aside className="space-y-4 rounded-xl border bg-white p-5 print:hidden">
          <label className="block text-sm font-semibold">
            Notice type
            <select
              className="mt-1 w-full rounded-lg border p-2"
              value={data.type}
              onChange={(e) => {
                const type = TYPES.find((t) => t.id === e.target.value);
                setData((old) => ({
                  ...old,
                  type: type.id,
                  heading: type.heading,
                  message: type.message,
                }));
                setDraftName(type.name);
                setSelectedId(null);
              }}
            >
              {TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Saved notice name
            <input
              className="mt-1 w-full rounded-lg border p-2"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
            />
          </label>
          <label className="block text-sm font-semibold">
            Main heading
            <input
              className="mt-1 w-full rounded-lg border p-2"
              value={data.heading}
              maxLength={100}
              onChange={(e) => update("heading", e.target.value)}
            />
          </label>
          <label className="block text-sm font-semibold">
            Message
            <textarea
              className="mt-1 w-full rounded-lg border p-2"
              rows={4}
              value={data.message}
              onChange={(e) => update("message", e.target.value)}
            />
          </label>
          {DATE_TYPES.has(data.type) && (
            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm font-semibold">
                From
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border p-2"
                  value={data.start}
                  onChange={(e) => update("start", e.target.value)}
                />
              </label>
              <label className="text-sm font-semibold">
                Through
                <input
                  type="date"
                  min={data.start || undefined}
                  className="mt-1 w-full rounded-lg border p-2"
                  value={data.end}
                  onChange={(e) => update("end", e.target.value)}
                />
              </label>
            </div>
          )}
          {data.type === "early" && (
            <label className="block text-sm font-semibold">
              Closing time
              <input
                type="time"
                className="mt-1 w-full rounded-lg border p-2"
                value={data.time}
                onChange={(e) => update("time", e.target.value)}
              />
            </label>
          )}
          {data.type === "hours" && (
            <label className="block text-sm font-semibold">
              Special hours
              <textarea
                className="mt-1 w-full rounded-lg border p-2"
                rows={3}
                placeholder="Example: Saturday: 11 AM – 3 PM"
                value={data.hours}
                onChange={(e) => update("hours", e.target.value)}
              />
            </label>
          )}
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm font-semibold">
              Phone (optional)
              <input
                className="mt-1 w-full rounded-lg border p-2"
                value={data.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </label>
            <label className="text-sm font-semibold">
              Website (optional)
              <input
                className="mt-1 w-full rounded-lg border p-2"
                value={data.website}
                onChange={(e) => update("website", e.target.value)}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={data.showRestaurant}
              onChange={(e) => update("showRestaurant", e.target.checked)}
            />{" "}
            Show restaurant name
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm font-semibold">
              Style
              <select
                className="mt-1 w-full rounded-lg border p-2"
                value={data.style}
                onChange={(e) => update("style", e.target.value)}
              >
                {Object.keys(palette).map((p) => (
                  <option key={p} value={p}>
                    {p[0].toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Paper
              <select
                className="mt-1 w-full rounded-lg border p-2"
                value={data.paper}
                onChange={(e) => update("paper", e.target.value)}
              >
                <option value="letter">US Letter</option>
                <option value="a4">A4</option>
              </select>
            </label>
          </div>
          <label className="block text-sm font-semibold">
            Orientation
            <select
              className="mt-1 w-full rounded-lg border p-2"
              value={data.orientation}
              onChange={(e) => update("orientation", e.target.value)}
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </label>
          <div className="border-t pt-4">
            <div className="mb-2 flex items-center justify-between">
              <strong>Saved Notices</strong>
              <button
                onClick={() => {
                  setSelectedId(null);
                  setData(initial);
                  setDraftName("New Notice");
                }}
                className="text-sm text-orange-700"
              >
                + New
              </button>
            </div>
            <div className="max-h-52 space-y-2 overflow-y-auto">
              {drafts.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => select(entry)}
                  className={`w-full rounded-lg border p-3 text-left text-sm ${selectedId === entry.id ? "border-orange-500 bg-orange-50 text-orange-900" : "hover:bg-slate-50"}`}
                >
                  {entry.name}
                  {selectedId === entry.id && <span className="ml-2 text-xs">✓ Selected</span>}
                </button>
              ))}
            </div>
            {selectedId && (
              <button onClick={remove} className="mt-3 text-sm text-red-600 underline">
                Delete selected notice
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Notices are saved in this browser, not on the OrderXO server. Use your browser's Save as
            PDF option when printing.
          </p>
        </aside>
        <div className="min-w-0 overflow-x-auto print:overflow-visible">
          <div
            id="orderxo-notice-sheet"
            className="relative mx-auto flex flex-col overflow-hidden border shadow-lg"
            style={{
              width: pageWidth,
              height: pageHeight,
              maxWidth: "none",
              background: theme.bg,
              color: theme.text,
              padding: "0.6in",
              boxSizing: "border-box",
            }}
          >
            <div
              className="flex h-full flex-col items-center justify-center text-center"
              style={{ border: `5px solid ${theme.accent}`, padding: "0.45in" }}
            >
              {data.showRestaurant && (
                <p
                  className="mb-10 max-w-full break-words text-xl font-bold uppercase tracking-[0.2em]"
                  style={{ color: theme.accent }}
                >
                  {restaurantName}
                </p>
              )}
              <div className="mb-8 h-2 w-28 rounded-full" style={{ background: theme.accent }} />
              <h2
                className="max-w-full break-words text-5xl font-black uppercase leading-tight tracking-tight"
                style={{ color: theme.text }}
              >
                {data.heading || "NOTICE"}
              </h2>
              {(dateLine || (data.type === "early" && data.time)) && (
                <p
                  className="mt-9 max-w-full break-words text-2xl font-extrabold"
                  style={{ color: theme.accent }}
                >
                  {dateLine ||
                    `Closing at ${new Date(`2000-01-01T${data.time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`}
                </p>
              )}
              {data.hours && (
                <p className="mt-7 whitespace-pre-line text-2xl font-semibold">{data.hours}</p>
              )}
              <p className="mt-10 max-w-full whitespace-pre-line break-words text-xl leading-relaxed">
                {data.message}
              </p>
              <div className="mt-12 h-1 w-24" style={{ background: theme.accent }} />
              {(data.phone || data.website) && (
                <p className="mt-7 max-w-full break-words text-base">
                  {[data.phone, data.website].filter(Boolean).join("  ·  ")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
