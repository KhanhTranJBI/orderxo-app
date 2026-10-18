"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

const DEFAULT_TITLE = "Enjoyed your visit?";
const DEFAULT_MESSAGE = "We'd love your honest feedback. Scan to review us on Google!";
const SIZES = { table: [4, 6], counter: [5, 7], sticker: [2, 2] };

function isGoogleReviewUrl(value) {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && (
      host === "g.page" || host === "maps.app.goo.gl" ||
      host === "google.com" || host.endsWith(".google.com") ||
      host === "google.co.uk" || host.endsWith(".google.co.uk")
    );
  } catch { return false; }
}

function drawWrapped(ctx, text, centerX, topY, maxWidth, lineHeight, maxLines = 4) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((item, index) => ctx.fillText(item, centerX, topY + index * lineHeight));
  return Math.min(lines.length, maxLines) * lineHeight;
}

async function buildSign({ reviewUrl, title, message, restaurantName, logoUrl, format, color }) {
  const [widthInches, heightInches] = SIZES[format];
  const scale = 300;
  const width = widthInches * scale;
  const height = heightInches * scale;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  const pad = width * 0.075;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, Math.max(12, height * 0.024));
  let y = height * 0.11;
  if (logoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = logoUrl;
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
      const maxW = width * 0.38, maxH = height * 0.10;
      const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
      const w = img.naturalWidth * ratio, h = img.naturalHeight * ratio;
      ctx.drawImage(img, (width - w) / 2, y, w, h);
      y += h + height * 0.055;
    } catch { /* A remote logo may disallow CORS. Continue without it. */ }
  }
  if (!logoUrl) {
    ctx.textAlign = "center";
    ctx.fillStyle = color;
    ctx.font = `bold ${Math.round(width * 0.057)}px sans-serif`;
    y += drawWrapped(ctx, restaurantName || "Your restaurant", width / 2, y, width - 2 * pad, width * 0.07, 2);
    y += height * 0.05;
  }
  ctx.textAlign = "center";
  ctx.fillStyle = "#111827";
  ctx.font = `bold ${Math.round(width * (format === "sticker" ? 0.075 : 0.068))}px sans-serif`;
  y += drawWrapped(ctx, title, width / 2, y, width - 2 * pad, width * 0.081, 3);
  y += height * 0.03;
  ctx.fillStyle = "#374151";
  ctx.font = `${Math.round(width * 0.042)}px sans-serif`;
  y += drawWrapped(ctx, message, width / 2, y, width - 2 * pad, width * 0.053, 4);
  const qrSize = Math.min(width * 0.72, height * (format === "sticker" ? 0.38 : 0.42));
  const qrTop = Math.min(Math.max(y + height * 0.035, height * 0.39), height - qrSize - height * 0.13);
  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, reviewUrl, { width: Math.round(qrSize), margin: 2, errorCorrectionLevel: "H", color: { dark: "#111827", light: "#ffffff" } });
  ctx.drawImage(qrCanvas, (width - qrSize) / 2, qrTop, qrSize, qrSize);
  ctx.fillStyle = color;
  ctx.font = `bold ${Math.round(width * 0.047)}px sans-serif`;
  ctx.fillText("SCAN TO REVIEW", width / 2, Math.min(height - height * 0.045, qrTop + qrSize + height * 0.055));
  return { canvas, widthInches, heightInches };
}

export default function LocalSeoAssistant({ restaurantName, logoUrl, websiteUrl, contactEmail, locationAddress, googleMapsUrl, googleReviewUrl = "" }) {
  const reviewUrl = typeof googleReviewUrl === "string" ? googleReviewUrl.trim() : "";
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [format, setFormat] = useState("table");
  const [color, setColor] = useState("#ea580c");
  const [preview, setPreview] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const valid = isGoogleReviewUrl(reviewUrl);
  const key = useMemo(() => `orderxo-review-qr:${restaurantName || "restaurant"}`, [restaurantName]);
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(key) || "null");
      if (saved) { setTitle(saved.title || DEFAULT_TITLE); setMessage(saved.message || DEFAULT_MESSAGE); setFormat(SIZES[saved.format] ? saved.format : "table"); setColor(/^#[0-9a-f]{6}$/i.test(saved.color) ? saved.color : "#ea580c"); }
    } catch { /* Ignore invalid local preferences. */ }
  }, [key]);
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify({ title, message, format, color })); } catch { /* Storage unavailable. */ }
  }, [key, title, message, format, color]);
  useEffect(() => {
    let cancelled = false;
    if (!valid) { setPreview(""); return; }
    QRCode.toDataURL(reviewUrl.trim(), { width: 240, margin: 2, errorCorrectionLevel: "H" }).then((data) => { if (!cancelled) setPreview(data); }).catch(() => { if (!cancelled) setPreview(""); });
    return () => { cancelled = true; };
  }, [reviewUrl, valid]);
  const checklist = [
    { label: "Restaurant name configured", ok: Boolean(restaurantName?.trim()) },
    { label: "Restaurant logo uploaded", ok: Boolean(logoUrl?.trim()) },
    { label: "Restaurant address configured", ok: Boolean(locationAddress?.trim()) },
    { label: "Restaurant contact email configured", ok: Boolean(contactEmail?.trim()) },
    { label: "Website address configured", ok: Boolean(websiteUrl?.trim()) },
    { label: "Google Maps listing link configured", ok: Boolean(googleMapsUrl?.trim()) },
  ];
  const score = checklist.filter((item) => item.ok).length;
  const download = async (type) => {
    if (!valid || !title.trim() || !message.trim()) return;
    setWorking(true); setError("");
    try {
      const sign = await buildSign({ reviewUrl: reviewUrl.trim(), title: title.trim(), message: message.trim(), restaurantName, logoUrl, format, color });
      const filename = `${(restaurantName || "restaurant").replace(/[^a-z0-9-]/gi, "-").toLowerCase()}-google-review-${format}`;
      if (type === "pdf") {
        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({ orientation: "portrait", unit: "in", format: [sign.widthInches, sign.heightInches] });
        pdf.addImage(sign.canvas.toDataURL("image/png"), "PNG", 0, 0, sign.widthInches, sign.heightInches);
        pdf.save(`${filename}.pdf`);
      } else {
        const link = document.createElement("a");
        link.download = `${filename}.png`;
        link.href = sign.canvas.toDataURL("image/png");
        link.click();
      }
    } catch (err) { setError(err?.message || "Unable to generate the sign."); }
    finally { setWorking(false); }
  };
  return (
    <div className="space-y-7">
      <div><h2 className="text-xl font-bold text-slate-900">Google Reviews & Local SEO</h2><p className="mt-2 text-sm text-slate-600">Create a printable Google review sign for your restaurant. No Google account connection required.</p></div>
      <div className="rounded-xl border border-slate-200 p-5 space-y-5">
        <div><h3 className="text-lg font-semibold">Google Review QR Generator</h3><p className="mt-1 text-sm text-slate-600">Use the official review link from your Google Business Profile. Customers can scan the QR code to leave honest feedback.</p></div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-medium text-slate-900">Google review link from Restaurant Settings</p>{reviewUrl ? <p className="mt-1 break-all text-sm text-slate-600">{reviewUrl}</p> : <p className="mt-1 text-sm text-amber-700">No Google Review Link is configured yet.</p>}{!valid && <p className="mt-2 text-sm text-amber-700">{reviewUrl ? "The saved link must be a valid HTTPS Google review URL." : "Add your Google review link under Social & Links, then save your restaurant settings."}</p>}<p className="mt-2 text-xs text-slate-500">To update this link, open <strong>Social & Links → Google Review Link</strong> and save. The QR generator uses that saved setting automatically.</p></div>
        <div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-medium">Headline<input maxLength={90} className="mt-1 w-full rounded-lg border border-slate-300 p-3" value={title} onChange={(e)=>setTitle(e.target.value)}/></label><label className="text-sm font-medium">Print size<select className="mt-1 w-full rounded-lg border border-slate-300 p-3" value={format} onChange={(e)=>setFormat(e.target.value)}><option value="table">Table sign — 4 × 6 in</option><option value="counter">Counter sign — 5 × 7 in</option><option value="sticker">Sticker — 2 × 2 in</option></select></label></div>
        <label className="block text-sm font-medium">Custom message<textarea maxLength={180} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 p-3" value={message} onChange={(e)=>setMessage(e.target.value)}/></label>
        <label className="flex items-center gap-3 text-sm font-medium">Accent color <input type="color" value={color} onChange={(e)=>setColor(e.target.value)} className="h-10 w-16 cursor-pointer" /></label>
        <div className="rounded-xl bg-slate-100 p-5 flex justify-center"><div className="w-full max-w-xs rounded-lg bg-white px-6 py-7 text-center shadow-sm border-t-8" style={{ borderTopColor: color }}><p className="text-sm font-bold mb-3" style={{ color }}>{restaurantName || "Your restaurant"}</p><h4 className="text-xl font-bold break-words">{title || "Your headline"}</h4><p className="mt-2 text-sm text-slate-600 break-words">{message}</p>{preview ? <img src={preview} alt="Scannable Google review QR code preview" className="mx-auto mt-4 h-48 w-48" /> : <div className="mx-auto mt-4 flex h-48 w-48 items-center justify-center rounded border border-dashed text-sm text-slate-400">Add a valid Google review link to preview QR</div>}<p className="mt-2 font-bold text-sm" style={{ color }}>SCAN TO REVIEW</p></div></div>
        <div className="flex flex-wrap gap-3"><button type="button" disabled={!valid || !title.trim() || !message.trim() || working} onClick={()=>download("png")} className="rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{working ? "Generating…" : "Download PNG"}</button><button type="button" disabled={!valid || !title.trim() || !message.trim() || working} onClick={()=>download("pdf")} className="rounded-lg border border-slate-300 px-5 py-3 font-semibold disabled:opacity-50">Download print-ready PDF</button></div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <p className="text-xs text-slate-500">Headline, message, size and color are saved in this browser only. The review link comes from Restaurant Settings. PNG exports are generated at 300 DPI. Do not offer incentives for Google reviews or selectively request positive reviews. Test the printed QR code before distributing.</p>
      </div>
      <div className="rounded-xl border border-slate-200 p-5 space-y-4"><div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Local SEO readiness</h3><span className="text-sm font-semibold">{score}/{checklist.length} completed</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-emerald-500" style={{ width: `${(score/checklist.length)*100}%` }}/></div><ul className="space-y-2">{checklist.map((item)=><li key={item.label} className="text-sm"><span className={item.ok ? "text-emerald-700" : "text-amber-700"}>{item.ok ? "✓" : "○"}</span> {item.label}</li>)}</ul><p className="text-xs text-slate-500">This checks saved OrderXO profile fields only, not live Google rankings. Verify hours, category, menu and photos in Google Business Profile.</p></div>
    </div>
  );
}
