"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { toast } from "react-toastify";

const safeHost = (value) => {
  const host = String(value || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");
  return /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(host) ? host : "";
};

export default function PrintableOrderingQR({
  restaurantName,
  logoUrl,
  poster,
  onChange,
  customDomain,
  orderxoDomain,
}) {
  const host = safeHost(customDomain) || safeHost(orderxoDomain);
  const url = host ? `https://${host}/menu` : "";
  const [qr, setQr] = useState("");
  useEffect(() => {
    let active = true;
    if (!url) {
      setQr("");
      return;
    }
    QRCode.toDataURL(url, { width: 800, margin: 2, errorCorrectionLevel: "H" })
      .then((result) => {
        if (active) setQr(result);
      })
      .catch(() => {
        if (active) setQr("");
      });
    return () => {
      active = false;
    };
  }, [url]);

  const field = (key, label, maxLength) => (
    <label className="block text-sm font-medium text-slate-700" key={key}>
      {label}
      <input
        maxLength={maxLength}
        value={poster?.[key] || ""}
        onChange={(e) => onChange({ ...poster, [key]: e.target.value })}
        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
      />
    </label>
  );

  const makeCanvas = async () => {
    if (!qr || !url) throw new Error("A verified restaurant domain is required.");
    const canvas = document.createElement("canvas");
    canvas.width = 1275;
    canvas.height = 1650; // Letter portrait, 150 dpi
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#111827";
    ctx.textAlign = "center";
    const wrap = (value, y, font, maxWidth, lineHeight, maxLines) => {
      ctx.font = font;
      const words = String(value || "").split(/\s+/);
      const lines = [];
      let line = "";
      for (const word of words) {
        if (ctx.measureText(word).width > maxWidth) continue;
        const next = line ? `${line} ${word}` : word;
        if (ctx.measureText(next).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else line = next;
      }
      if (line) lines.push(line);
      lines
        .slice(0, maxLines)
        .forEach((v, i) => ctx.fillText(v, canvas.width / 2, y + i * lineHeight));
    };
    wrap(restaurantName, 190, "bold 60px Arial", 1050, 70, 2);
    wrap(poster?.heading, 365, "bold 85px Arial", 1080, 96, 2);
    wrap(poster?.description, 510, "36px Arial", 1050, 46, 3);
    const img = new Image();
    img.src = qr;
    await img.decode();
    ctx.drawImage(img, 287, 675, 700, 700);
    wrap(url, 1460, "28px Arial", 1100, 40, 2);
    wrap(poster?.footer, 1550, "bold 34px Arial", 1100, 45, 2);
    return canvas;
  };
  const download = async (format) => {
    try {
      const canvas = await makeCanvas();
      if (format === "png") {
        const a = document.createElement("a");
        a.href = canvas.toDataURL("image/png");
        a.download = "orderxo-ordering-qr.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        const pdf = new jsPDF({ orientation: "portrait", unit: "in", format: "letter" });
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 8.5, 11);
        pdf.save("orderxo-ordering-qr.pdf");
      }
    } catch (error) {
      toast.error(error.message || "Unable to generate QR poster");
    }
  };
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-bold text-slate-900">QR Code Ordering</h3>
      <p className="mt-1 text-sm text-slate-500">
        Customize a printable sign linking to your restaurant's online ordering menu. Save your
        changes before downloading.
      </p>
      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          {field("heading", "Heading", 100)}
          {field("description", "Description", 250)}
          {field("footer", "Footer text", 100)}
          <div className="break-all rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            <strong>Ordering link from verified domain settings:</strong>{" "}
            {url || "No verified domain found. Verify a domain in Domain Settings first."}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!qr}
              onClick={() => download("pdf")}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Download PDF
            </button>
            <button
              type="button"
              disabled={!qr}
              onClick={() => download("png")}
              className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Download PNG
            </button>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3 rounded-lg border bg-white p-6 text-center text-slate-900">
          <strong className="text-xl">{restaurantName}</strong>
          <h4 className="text-3xl font-bold">{poster?.heading}</h4>
          <p className="text-sm">{poster?.description}</p>
          {qr ? (
            <img src={qr} alt="Scannable online ordering QR code" className="h-52 w-52" />
          ) : (
            <div className="flex h-52 w-52 items-center justify-center bg-slate-100 text-sm">
              Verify restaurant domain
            </div>
          )}
          <span className="break-all text-xs">{url}</span>
          <strong className="text-sm">{poster?.footer}</strong>
        </div>
      </div>
    </section>
  );
}
