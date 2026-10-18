"use client";

import { useMemo, useState } from "react";

const copy = async (value) => {
  await navigator.clipboard.writeText(value);
};

function reviewReply({ rating, name, comment, restaurant }) {
  const customer = name.trim() || "there";
  const business = restaurant || "our restaurant";
  const detail = comment.trim();
  if (Number(rating) <= 2) {
    return `Hi ${customer}, thank you for sharing your experience with ${business}. We're sorry we didn't meet your expectations${detail ? " and appreciate you taking the time to explain what happened" : ""}. We'd like to understand what went wrong and make things right. Please contact our team directly so we can follow up. — ${business}`;
  }
  if (Number(rating) === 3) {
    return `Hi ${customer}, thank you for visiting ${business} and sharing your feedback. We're glad you gave us a try, and we'd love to know what we could improve for your next visit. — ${business}`;
  }
  return `Hi ${customer}, thank you so much for your kind review and for supporting ${business}! We're delighted you enjoyed your visit and look forward to welcoming you back soon. — ${business}`;
}

export default function LocalSeoAssistant({ restaurantName, logoUrl, websiteUrl, contactEmail, locationAddress, googleMapsUrl }) {
  const [placeId, setPlaceId] = useState("");
  const [rating, setRating] = useState("5");
  const [reviewer, setReviewer] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [copied, setCopied] = useState("");
  const [editedReply, setEditedReply] = useState("");
  const name = restaurantName || "Your restaurant";
  const searchQuery = [name, locationAddress].filter(Boolean).join(" ");
  const googleSearch = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
  const reviewLink = placeId.trim()
    ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId.trim())}`
    : "";
  const checklist = [
    { label: "Restaurant name configured", ok: Boolean(restaurantName?.trim()) },
    { label: "Restaurant logo uploaded", ok: Boolean(logoUrl?.trim()) },
    { label: "Restaurant address configured", ok: Boolean(locationAddress?.trim()) },
    { label: "Restaurant contact email configured", ok: Boolean(contactEmail?.trim()) },
    { label: "Website address configured", ok: Boolean(websiteUrl?.trim()) },
    { label: "Google Maps listing link configured", ok: Boolean(googleMapsUrl?.trim()) },
  ];
  const score = checklist.filter((item) => item.ok).length;
  const draft = useMemo(() => reviewReply({ rating, name: reviewer, comment: reviewText, restaurant: name }), [rating, reviewer, reviewText, name]);
  const notifyCopy = async (key, value) => {
    try { await copy(value); setCopied(key); } catch { setCopied("Copy failed — select and copy the text manually."); }
  };
  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Google Reviews & Local SEO Assistant</h2>
        <p className="mt-2 text-sm text-slate-600">Help customers find your restaurant, request honest reviews, and prepare thoughtful responses. Google account connection is not required for these tools.</p>
      </div>
      <div className="rounded-xl border border-slate-200 p-5 space-y-4">
        <h3 className="text-lg font-semibold">Google review requests</h3>
        <p className="text-sm text-slate-600">Find your Google Business Profile and copy its Place ID to create a direct review link. Ask for genuine feedback from all customers; do not offer rewards in exchange for reviews.</p>
        <a className="text-orange-700 underline" href={googleMapsUrl || googleSearch} target="_blank" rel="noopener noreferrer">Find restaurant on Google Maps ↗</a>
        <label className="block text-sm font-medium">Google Place ID (optional)</label>
        <input className="w-full rounded-lg border border-slate-300 p-3" placeholder="ChIJ..." value={placeId} onChange={(e) => setPlaceId(e.target.value)} maxLength={256}/>
        {reviewLink ? <div className="space-y-2"><p className="break-all text-sm text-slate-600">{reviewLink}</p><button type="button" onClick={() => notifyCopy("review", reviewLink)} className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white">Copy review link</button></div> : <p className="text-sm text-amber-700">Enter a verified Place ID to generate a direct review link. The Google Maps link above is for finding your listing, not a direct review form.</p>}
        <button type="button" onClick={() => notifyCopy("request", `Thank you for supporting ${name}! We'd appreciate your honest feedback about your experience. ${reviewLink || googleMapsUrl || googleSearch}`)} className="ml-2 rounded-lg border border-slate-300 px-4 py-2 font-semibold">Copy review request message</button>
      </div>
      <div className="rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Local SEO readiness</h3><span className="text-sm font-semibold">{score}/{checklist.length} completed</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-emerald-500" style={{ width: `${(score/checklist.length)*100}%` }}/></div>
        <ul className="space-y-2">{checklist.map((item) => <li key={item.label} className="text-sm"><span className={item.ok ? "text-emerald-700" : "text-amber-700"}>{item.ok ? "✓" : "○"}</span> {item.label}</li>)}</ul>
        <p className="text-xs text-slate-500">This checks saved OrderXO profile fields only. It is not a Google ranking score or a live Google Business Profile audit. Also verify opening hours, categories, menu, and photos directly in Google Business Profile.</p>
      </div>
      <div className="rounded-xl border border-slate-200 p-5 space-y-4">
        <h3 className="text-lg font-semibold">Review reply assistant</h3>
        <p className="text-sm text-slate-600">Draft a courteous reply to a customer review. Review and personalize it before posting to Google. This tool does not fetch or publish reviews.</p>
        <div className="grid gap-3 md:grid-cols-2"><label className="text-sm">Rating<select value={rating} onChange={(e) => {setRating(e.target.value);setEditedReply("");}} className="mt-1 block w-full rounded-lg border p-3">{[1,2,3,4,5].map((n)=><option key={n} value={n}>{n} star{n!==1?"s":""}</option>)}</select></label><label className="text-sm">Reviewer name (optional)<input className="mt-1 block w-full rounded-lg border p-3" value={reviewer} onChange={(e)=>{setReviewer(e.target.value);setEditedReply("");}} placeholder="Customer name"/></label></div>
        <label className="block text-sm">Review text (optional)<textarea className="mt-1 block w-full rounded-lg border p-3" rows={3} value={reviewText} onChange={(e)=>{setReviewText(e.target.value);setEditedReply("");}} placeholder="Paste review for reference"/></label>
        <label className="block text-sm">Editable reply<textarea className="mt-1 block w-full rounded-lg border p-3" rows={5} value={editedReply || draft} onChange={(e)=>setEditedReply(e.target.value)}/></label>
        <button type="button" className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white" onClick={()=>notifyCopy("reply",editedReply || draft)}>Copy reply</button>
        <p className="text-xs text-slate-500">Uses transparent response templates, not live AI or Google data. Avoid revealing personal information or promising a refund publicly.</p>
      </div>
      {copied && <p role="status" className="text-sm text-emerald-700">{copied.startsWith("Copy failed") ? copied : "Copied to clipboard."}</p>}
    </div>
  );
}
