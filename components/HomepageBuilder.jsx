"use client";

import { toast } from "react-toastify";
import { useEffect, useMemo, useRef, useState } from "react";
import HomepageSlidesManager from "./management/HomepageSlidesManager";
import {
  Plus,
  Trash2,
  GripVertical,
  Monitor,
  Smartphone,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";

const SECTION_TYPES = {
  slideshow: {
    label: "Slideshow",
    title: "Fresh food. Great moments.",
    subtitle: "Discover what makes us special.",
    icon: "▣",
  },
  hero: {
    label: "Hero banner",
    title: "Made fresh, served with love",
    subtitle: "Your next favorite meal is waiting.",
    icon: "◧",
  },
  featuredMenu: {
    label: "Featured menu",
    title: "Customer favorites",
    subtitle: "The dishes everyone comes back for.",
    icon: "★",
  },
  newItems: {
    label: "New arrivals",
    title: "Just added",
    subtitle: "Something new to try today.",
    icon: "✦",
  },
  about: {
    label: "About us",
    title: "Our story",
    subtitle: "Great food starts with great ingredients and a little passion.",
    icon: "☰",
  },
  gallery: {
    label: "Photo gallery",
    title: "A taste of our kitchen",
    subtitle: "See what we're cooking.",
    icon: "▦",
  },
  googleReviews: {
    label: "Google reviews",
    title: "What our guests say",
    subtitle: "Real feedback from our community.",
    icon: "★★★★★",
  },
  promotions: {
    label: "Promotions",
    title: "Something special for you",
    subtitle: "Explore our latest offers.",
    icon: "%",
  },
  hours: {
    label: "Hours & location",
    title: "Come visit us",
    subtitle: "We can't wait to see you.",
    icon: "◷",
  },
  features: {
    label: "Why choose us",
    title: "Why guests love us",
    subtitle: "Fresh ingredients · Made to order · Friendly service",
    icon: "✓",
  },
  faq: {
    label: "Frequently asked questions",
    title: "Good to know",
    subtitle: "Answers to common questions.",
    icon: "?",
  },
  cta: {
    label: "Call to action",
    title: "Hungry yet?",
    subtitle: "Order your favorites online for pickup.",
    icon: "↗",
  },
};
const DEFAULT_TYPES = [
  "slideshow",
  "featuredMenu",
  "about",
  "newItems",
  "gallery",
  "googleReviews",
  "cta",
];
const makeSection = (type) => ({
  id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  type,
  enabled: true,
  title: SECTION_TYPES[type].title,
  subtitle: SECTION_TYPES[type].subtitle,
  imageUrl: "",
  images: [],
  slides: [],
  itemIds: [],
  buttonText: type === "cta" ? "Order online" : "Explore menu",
  buttonUrl: "/menu",
  reviewUrl: "",
  googlePlaceId: "",
  layout: "default",
  backgroundColor: "",
  textColor: "",
  overlay: 45,
  entries: [],
});
const defaultSectionColor = (type, key) => (key === "backgroundColor" ? "#FFFFFF" : "#111827");
const defaultPage = () => ({ template: "modern", sections: DEFAULT_TYPES.map(makeSection) });
const parseLines = (value) =>
  value
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
const validUrl = (url) => !url || url.startsWith("/") || /^https:\/\//i.test(url);
const pretty = (type) => SECTION_TYPES[type]?.label || type;
const cardClass = "rounded-2xl border border-slate-200 bg-white shadow-sm";
const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

function SlideshowPreview({ slides, section, branding, compact }) {
  const activeSlides = (slides || []).filter((slide) => slide?.isActive !== false && slide?.image);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    setIndex(0);
  }, [slides]);
  useEffect(() => {
    if (activeSlides.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % activeSlides.length), 5000);
    return () => clearInterval(timer);
  }, [activeSlides.length]);
  const slide = activeSlides[index];
  const startX = useRef(null);
  const move = (direction) =>
    setIndex((i) => (i + direction + activeSlides.length) % activeSlides.length);
  if (!slide)
    return (
      <section className="flex min-h-56 items-center justify-center bg-slate-100 px-6 text-center text-sm text-slate-500">
        No active slides. Add slides in the slide manager to preview them here.
      </section>
    );
  return (
    <section
      className={`relative isolate w-full overflow-hidden select-none touch-pan-y ${compact ? "h-64" : "h-[430px]"}`}
      onTouchStart={(e) => {
        startX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (startX.current == null) return;
        const d = e.changedTouches[0].clientX - startX.current;
        if (Math.abs(d) > 45 && activeSlides.length > 1) move(d < 0 ? 1 : -1);
        startX.current = null;
      }}
      onMouseDown={(e) => {
        startX.current = e.clientX;
      }}
      onMouseUp={(e) => {
        if (startX.current == null) return;
        const d = e.clientX - startX.current;
        if (Math.abs(d) > 45 && activeSlides.length > 1) move(d < 0 ? 1 : -1);
        startX.current = null;
      }}
    >
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {activeSlides.map((item, i) => (
          <div
            key={item._id || `${item.image}-${i}`}
            className="relative h-full w-full shrink-0"
            style={{
              backgroundImage: `url(${JSON.stringify(item.image).slice(1, -1)})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div
              className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10"
              style={{ opacity: Number(section.overlay ?? 45) / 70 }}
            />
            <div
              className={`absolute left-0 top-1/2 z-10 w-full -translate-y-1/2 px-6 text-left text-white ${compact ? "max-w-xs" : "max-w-2xl md:pl-[10%]"}`}
            >
              <h3
                className={`${compact ? "text-2xl" : "text-4xl"} font-bold drop-shadow-lg`}
                style={{ color: "#ffffff" }}
              >
                {item.title}
              </h3>
              {item.subtitle && (
                <p className="mt-3 text-sm drop-shadow" style={{ color: "#ffffff" }}>
                  {item.subtitle}
                </p>
              )}
              <span
                className="mt-5 inline-block rounded-lg px-5 py-2.5 text-sm font-bold text-white"
                style={{ backgroundColor: branding?.primaryColor || "#ea580c", color: "#ffffff" }}
              >
                {item.cta || "Order online"}
              </span>
            </div>
          </div>
        ))}
      </div>
      {activeSlides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {activeSlides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Preview slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2.5 w-2.5 rounded-full ${i === index ? "bg-orange-500" : "bg-white/60"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function PreviewSection({ section: s, branding, compact, previewSlides }) {
  const accent = branding?.primaryColor || "#ea580c";
  const title = s.title || SECTION_TYPES[s.type]?.title;
  const img = s.imageUrl || s.images?.[0] || s.slides?.[0]?.imageUrl;
  const image = (src, cls = "") =>
    src ? (
      <img src={src} alt="Restaurant" className={`h-full w-full object-cover ${cls}`} />
    ) : (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-100 via-amber-50 to-rose-100 text-orange-300">
        <ImageIcon size={compact ? 25 : 44} />
      </div>
    );
  const heading = (
    <>
      <h3 className={`${compact ? "text-xl" : "text-2xl md:text-3xl"} font-bold tracking-tight`}>
        {title}
      </h3>
      {s.subtitle && <p className="mt-2 text-sm leading-relaxed opacity-75">{s.subtitle}</p>}
    </>
  );
  const button = (
    <a
      href={validUrl(s.buttonUrl) ? s.buttonUrl || "/menu" : "/menu"}
      onClick={(e) => e.preventDefault()}
      className="mt-5 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold text-white"
      style={{ backgroundColor: accent }}
    >
      {s.buttonText || "Order online"}
    </a>
  );
  const baseStyle = {
    backgroundColor: s.backgroundColor || undefined,
    color: s.textColor || undefined,
  };
  if (s.type === "slideshow")
    return (
      <SlideshowPreview slides={previewSlides} section={s} branding={branding} compact={compact} />
    );
  if (s.type === "hero") {
    const slides =
      s.type === "slideshow" && s.slides?.length
        ? s.slides
        : [{ title: s.title, subtitle: s.subtitle, imageUrl: s.imageUrl }];
    const slide = slides[0];
    return (
      <section
        className={`relative isolate overflow-hidden ${compact ? "min-h-56" : "min-h-80"} flex items-center justify-center text-center`}
        style={{ backgroundColor: s.backgroundColor || accent, color: s.textColor || "#ffffff" }}
      >
        {slide.imageUrl && <div className="absolute inset-0 -z-20">{image(slide.imageUrl)}</div>}
        <div
          className="absolute inset-0 -z-10 bg-slate-950"
          style={{ opacity: slide.imageUrl ? Number(s.overlay ?? 45) / 100 : 0 }}
        />
        <div className="max-w-2xl px-6 py-14">
          <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] opacity-80">
            Fresh • Local • Delicious
          </p>
          <h3 className={`${compact ? "text-3xl" : "text-4xl"} font-black leading-tight`}>
            {slide.title || title}
          </h3>
          <p className="mt-3 text-sm opacity-90">{slide.subtitle || s.subtitle}</p>
          {button}
          {slides.length > 1 && (
            <div className="mt-7 flex justify-center gap-2">
              {slides.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full ${i === 0 ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }
  if (s.type === "about")
    return (
      <section className="grid items-center gap-5 px-6 py-10 sm:grid-cols-2" style={baseStyle}>
        <div className="overflow-hidden rounded-2xl aspect-[4/3]">{image(img)}</div>
        <div>
          {heading}
          {button}
        </div>
      </section>
    );
  if (s.type === "gallery")
    return (
      <section className="px-6 py-10 text-center" style={baseStyle}>
        {heading}
        <div className="mt-6 grid grid-cols-3 gap-2">
          {(s.images?.length ? s.images : ["", "", "", "", "", ""]).slice(0, 9).map((src, i) => (
            <div key={i} className="aspect-square overflow-hidden rounded-xl">
              {image(src)}
            </div>
          ))}
        </div>
      </section>
    );
  if (["featuredMenu", "newItems"].includes(s.type))
    return (
      <section className="px-6 py-10 text-center" style={baseStyle}>
        {heading}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="overflow-hidden rounded-xl border bg-white text-left">
              <div className="aspect-[4/3]">{image(s.images?.[i])}</div>
              <div className="p-3">
                <div className="font-semibold text-sm">
                  {s.type === "newItems" ? "New menu item" : "Popular favorite"}
                </div>
                <p className="mt-1 text-xs text-slate-500">Menu items load from your restaurant</p>
              </div>
            </div>
          ))}
        </div>
        {button}
      </section>
    );
  if (s.type === "googleReviews")
    return (
      <section className="bg-orange-50/70 px-6 py-10 text-center" style={baseStyle}>
        {heading}
        <div className="mx-auto mt-6 grid max-w-2xl gap-3 sm:grid-cols-2">
          {["Friendly service and delicious food.", "A wonderful spot for a fresh meal."].map(
            (v, i) => (
              <div key={i} className="rounded-xl bg-white p-5 text-left shadow-sm">
                <div className="text-amber-500">★★★★★</div>
                <p className="mt-2 text-sm">{v}</p>
                <p className="mt-3 text-xs text-slate-400">
                  Preview placeholder — not a real Google review
                </p>
              </div>
            ),
          )}
        </div>
        {s.reviewUrl && <p className="mt-4 text-xs">Google review link configured</p>}
      </section>
    );
  if (s.type === "faq")
    return (
      <section className="px-6 py-10" style={baseStyle}>
        <div className="text-center">{heading}</div>
        <div className="mx-auto mt-5 max-w-xl space-y-2">
          {(s.entries?.length
            ? s.entries
            : [
                "Do you offer pickup?|Yes, order online for pickup.",
                "Where can I find your hours?|See our hours and location page.",
              ]
          ).map((entry, i) => (
            <div key={i} className="rounded-lg border p-3 text-sm">
              <strong>{entry.split("|")[0]}</strong>
              <p className="mt-1 text-slate-500">{entry.split("|")[1]}</p>
            </div>
          ))}
        </div>
      </section>
    );
  if (s.type === "features")
    return (
      <section className="px-6 py-10 text-center" style={baseStyle}>
        {heading}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {["Fresh ingredients", "Made to order", "Friendly service"].map((v) => (
            <div key={v} className="rounded-xl bg-orange-50 p-4 text-sm font-semibold">
              ✓<div className="mt-2">{v}</div>
            </div>
          ))}
        </div>
      </section>
    );
  if (s.type === "hours")
    return (
      <section className="bg-slate-50 px-6 py-10 text-center" style={baseStyle}>
        {heading}
        <p className="mt-4 text-sm text-slate-500">
          Business hours and address are shown from your restaurant settings on the live website.
        </p>
      </section>
    );
  if (s.type === "promotions")
    return (
      <section className="bg-orange-50 px-6 py-10 text-center" style={baseStyle}>
        {heading}
        {button}
      </section>
    );
  return (
    <section className="px-6 py-12 text-center" style={baseStyle}>
      {heading}
      {button}
    </section>
  );
}

export default function HomepageBuilder({ organizationId, readOnly = false, canPublish = true }) {
  const [draft, setDraft] = useState(defaultPage);
  const [published, setPublished] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setErrorState] = useState("");
  const setError = (value) => {
    setErrorState(value);
    if (typeof value === "string" && value.trim()) toast.error(value);
  };
  const [message, setMessageState] = useState("");
  const setMessage = (value) => {
    setMessageState(value);
    if (typeof value === "string" && value.trim()) toast.success(value);
  };
  const [mobile, setMobile] = useState(false);
  const [selected, setSelected] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [branding, setBranding] = useState({});
  const [previewSlides, setPreviewSlides] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const draggingRef = useRef(null);
  const touchStartRef = useRef(null);
  // Keep the raw textarea value while typing, including trailing blank lines.
  const [multilineDrafts, setMultilineDrafts] = useState({});
  useEffect(() => {
    if (!organizationId) return;
    let active = true;
    setLoading(true);
    fetch(`/api/owner/organizations/settings?organizationId=${encodeURIComponent(organizationId)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error || "Unable to load homepage");
        return d;
      })
      .then((d) => {
        if (!active) return;
        const page = d.settings?.homepageDraft || d.settings?.homepagePublished || defaultPage();
        setDraft({
          template: page.template || "modern",
          ...page,
          sections: Array.isArray(page.sections) ? page.sections : defaultPage().sections,
        });
        setPublished(d.settings?.homepagePublished || null);
        setBranding(d.settings?.branding || {});
        setSelected(page.sections?.[0]?.id || null);
        setDirty(false);
        setMultilineDrafts({});
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [organizationId]);
  const update = (fn) => {
    setDraft((old) => fn(old));
    setDirty(true);
    setMessage("");
  };
  const edit = (id, key, value) =>
    update((old) => ({
      ...old,
      sections: old.sections.map((s) => (s.id === id ? { ...s, [key]: value } : s)),
    }));
  const reorder = (fromId, toId) => {
    if (!fromId || !toId || fromId === toId) return;
    update((old) => {
      const sections = [...old.sections];
      const from = sections.findIndex((s) => s.id === fromId);
      const to = sections.findIndex((s) => s.id === toId);
      if (from < 0 || to < 0) return old;
      sections.splice(to, 0, sections.splice(from, 1)[0]);
      return { ...old, sections };
    });
  };
  const finishDrag = () => {
    draggingRef.current = null;
    touchStartRef.current = null;
    setDraggingId(null);
  };
  const multilineValue = (key, values) =>
    multilineDrafts[`${active?.id}:${key}`] ?? (values || []).join("\n");
  const editMultiline = (key, value) => {
    setMultilineDrafts((old) => ({ ...old, [`${active.id}:${key}`]: value }));
    edit(active.id, key, parseLines(value));
  };
  const add = (type) => {
    const section = makeSection(type);
    update((old) => ({ ...old, sections: [...old.sections, section] }));
    setSelected(section.id);
    setAddOpen(false);
  };
  const duplicate = (s) => {
    const copy = {
      ...s,
      id: `${s.type}-${Date.now()}`,
      images: [...(s.images || [])],
      slides: [...(s.slides || [])],
    };
    update((old) => ({ ...old, sections: [...old.sections, copy] }));
    setSelected(copy.id);
  };
  const remove = (id) => {
    update((old) => ({ ...old, sections: old.sections.filter((s) => s.id !== id) }));
    if (selected === id) setSelected(null);
  };
  const active = useMemo(
    () => draft.sections.find((s) => s.id === selected),
    [draft.sections, selected],
  );
  const issues = draft.sections.flatMap((s) =>
    [s.imageUrl, ...(s.images || []), ...(s.slides || []).map((v) => v.imageUrl)]
      .filter((v) => v && !validUrl(v))
      .map(
        () => `${pretty(s.type)} contains an invalid image URL. Use HTTPS or a relative / path.`,
      ),
  );
  async function save(publish = false) {
    setError("");
    setMessage("");
    if (issues.length) {
      setError(issues[0]);
      return;
    }
    if (publish && !canPublish) {
      setError("Publishing requires setup:publish permission.");
      return;
    }
    if (publish && !draft.sections.some((s) => s.enabled)) {
      setError("Enable at least one section before publishing.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/owner/organizations/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, homepageDraft: draft, publishHomepage: publish }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "Save failed");
      if (d.settings?.homepageDraft) setDraft(d.settings.homepageDraft);
      if (publish) setPublished(d.settings?.homepagePublished || draft);
      setDirty(false);
      setMessage(
        publish
          ? "Homepage published successfully."
          : "Draft saved. The public homepage has not changed.",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const textField = (label, key, multiline = false, placeholder = "") => (
    <label className="block text-xs font-semibold text-slate-600">
      {label}
      {multiline ? (
        <textarea
          rows={3}
          className={`${fieldClass} mt-1`}
          placeholder={placeholder}
          value={active?.[key] || ""}
          onChange={(e) => edit(active.id, key, e.target.value)}
        />
      ) : (
        <input
          className={`${fieldClass} mt-1`}
          placeholder={placeholder}
          value={active?.[key] || ""}
          onChange={(e) => edit(active.id, key, e.target.value)}
        />
      )}
    </label>
  );
  return (
    <div
      className="space-y-5 text-slate-900"
      onClickCapture={
        readOnly
          ? (e) => {
              if (e.target.closest("button, input, select, textarea, [role=button]")) {
                e.preventDefault();
                e.stopPropagation();
              }
            }
          : undefined
      }
      onChangeCapture={
        readOnly
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
            }
          : undefined
      }
    >
      {readOnly && (
        <p className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900">
          Preview only — upgrade to Pro to edit, save or publish your homepage.
        </p>
      )}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="text-orange-600" size={22} />
            <h2 className="text-2xl font-extrabold tracking-tight">Homepage Studio</h2>
            {dirty && (
              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                Unsaved changes
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Build your restaurant's homepage. Preview, save a draft, then publish when ready.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={busy || loading || readOnly}
            className="rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
            onClick={() => save(false)}
          >
            {busy ? "Saving…" : "Save draft"}
          </button>
          <button
            disabled={busy || loading || readOnly || !canPublish}
            title={!canPublish ? "Publishing requires separate approval" : undefined}
            className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
            onClick={() => save(true)}
          >
            Publish homepage
          </button>
        </div>
      </header>

      {loading ? (
        <p className="py-16 text-center text-slate-500">Loading homepage settings…</p>
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(290px,350px)_minmax(300px,1fr)]">
          <aside className="space-y-4">
            <div className={`${cardClass} p-4`}>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Design template
              </label>
              <select
                className={`${fieldClass} mt-2`}
                value={draft.template || "modern"}
                onChange={(e) => update((old) => ({ ...old, template: e.target.value }))}
              >
                {["modern", "premium", "bold", "minimal"].map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">
                Brand colors are configured in General settings.
              </p>
            </div>
            <div className={`${cardClass} p-4`}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold">Page sections</h3>
                <span className="text-xs text-slate-500">
                  {draft.sections.filter((s) => s.enabled).length} visible
                </span>
              </div>
              <div className="space-y-2">
                {draft.sections.map((s) => (
                  <div
                    key={s.id}
                    data-section-id={s.id}
                    onDragOver={(e) => {
                      if (draggingRef.current) e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      reorder(draggingRef.current, s.id);
                      finishDrag();
                    }}
                    className={`rounded-xl border p-2.5 transition ${draggingId === s.id ? "opacity-50 border-orange-400" : selected === s.id ? "border-orange-400 bg-orange-50" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        draggable
                        aria-label={`Drag to reorder ${pretty(s.type)}`}
                        title="Drag to reorder"
                        onDragStart={(e) => {
                          draggingRef.current = s.id;
                          setDraggingId(s.id);
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", s.id);
                        }}
                        onDragEnd={finishDrag}
                        onTouchStart={(e) => {
                          touchStartRef.current = {
                            id: s.id,
                            x: e.touches[0].clientX,
                            y: e.touches[0].clientY,
                          };
                          draggingRef.current = s.id;
                        }}
                        onTouchEnd={(e) => {
                          const touch = e.changedTouches[0];
                          const start = touchStartRef.current;
                          if (
                            start &&
                            Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > 12
                          ) {
                            const target = document
                              .elementFromPoint(touch.clientX, touch.clientY)
                              ?.closest("[data-section-id]");
                            reorder(start.id, target?.getAttribute("data-section-id"));
                          }
                          finishDrag();
                        }}
                        onTouchCancel={finishDrag}
                        className="cursor-grab touch-none rounded p-1.5 text-slate-400 hover:bg-white active:cursor-grabbing"
                      >
                        <GripVertical size={19} />
                      </button>
                      <button
                        className="min-w-0 flex-1 text-left"
                        onClick={() => setSelected(s.id)}
                      >
                        <span className="block truncate text-sm font-semibold">
                          {pretty(s.type)}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {s.title || "Untitled"}
                        </span>
                      </button>
                      <button
                        title={s.enabled ? "Hide section" : "Show section"}
                        onClick={() => edit(s.id, "enabled", !s.enabled)}
                        className="rounded p-1 hover:bg-white"
                      >
                        {s.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-orange-300 bg-orange-50 px-3 py-3 text-sm font-semibold text-orange-700 hover:bg-orange-100"
                onClick={() => setAddOpen(!addOpen)}
              >
                <Plus size={17} /> Add section
              </button>
              {addOpen && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {Object.entries(SECTION_TYPES).map(([type, v]) => (
                    <button
                      key={type}
                      onClick={() => add(type)}
                      className="rounded-lg border p-2 text-left text-xs hover:border-orange-400 hover:bg-orange-50"
                    >
                      <span className="mr-1 text-orange-600">{v.icon}</span>
                      {v.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {active && (
              <div className={`${cardClass} space-y-4 p-4`}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold">Edit {pretty(active.type)}</h3>
                  <div className="flex gap-1">
                    <button
                      title="Duplicate"
                      onClick={() => duplicate(active)}
                      className="rounded-lg p-2 hover:bg-slate-100"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      title="Remove"
                      onClick={() => remove(active.id)}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {active.type !== "slideshow" && textField("Heading", "title")}
                {active.type !== "slideshow" && textField("Description", "subtitle", true)}
                {["hero", "about"].includes(active.type) &&
                  textField("Main image URL", "imageUrl", false, "https://... or /images/...")}
                {["gallery", "featuredMenu", "newItems"].includes(active.type) && (
                  <label className="block text-xs font-semibold text-slate-600">
                    {active.type === "gallery" ? "Gallery images" : "Optional preview images"} (one
                    URL per line)
                    <textarea
                      rows={4}
                      className={`${fieldClass} mt-1`}
                      value={multilineValue("images", active.images)}
                      onChange={(e) => editMultiline("images", e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                    />
                  </label>
                )}
                {active.type === "slideshow" && (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">
                      Manage restaurant default slides or customize slides for each location. This
                      is the same slide manager used in Store Settings.
                    </p>
                    <HomepageSlidesManager
                      organizationId={organizationId}
                      embedded
                      onSlidesChange={setPreviewSlides}
                    />
                    <p className="text-xs text-slate-500">
                      Publishing the homepage controls section visibility and position. Slide
                      changes are saved independently through the slide manager.
                    </p>
                  </div>
                )}
                {["hero", "slideshow"].includes(active.type) && (
                  <label className="block text-xs font-semibold text-slate-600">
                    Image overlay: {active.overlay ?? 45}%
                    <input
                      type="range"
                      min="0"
                      max="90"
                      value={active.overlay ?? 45}
                      className="mt-2 w-full accent-orange-600"
                      onChange={(e) => edit(active.id, "overlay", Number(e.target.value))}
                    />
                  </label>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {["backgroundColor", "textColor"].map((key) => (
                    <label key={key} className="text-xs font-semibold text-slate-600">
                      {key === "backgroundColor" ? "Background" : "Text color"}
                      <div className="mt-1 flex gap-2">
                        <input
                          type="color"
                          aria-label={`${key === "backgroundColor" ? "Background" : "Text"} color picker`}
                          value={
                            /^#[0-9a-fA-F]{6}$/.test(active[key] || "")
                              ? active[key]
                              : defaultSectionColor(active.type, key)
                          }
                          onChange={(e) => edit(active.id, key, e.target.value.toUpperCase())}
                          className="h-9 w-10 shrink-0 cursor-pointer rounded border"
                        />
                        <input
                          type="text"
                          aria-label={`${key === "backgroundColor" ? "Background" : "Text"} HEX color`}
                          value={active[key] || ""}
                          placeholder={defaultSectionColor(active.type, key)}
                          maxLength={7}
                          spellCheck={false}
                          onChange={(e) => edit(active.id, key, e.target.value.toUpperCase())}
                          className="min-w-0 w-24 rounded border border-slate-200 bg-white px-2 font-mono text-xs uppercase text-slate-900"
                        />
                        <button
                          className="text-xs text-slate-500 underline"
                          type="button"
                          onClick={() =>
                            edit(active.id, key, defaultSectionColor(active.type, key))
                          }
                        >
                          Reset
                        </button>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </aside>
          <div className="sticky top-4 min-w-0">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-bold">Live draft preview</h3>
                <p className="text-xs text-slate-500">
                  Preview is illustrative; the public storefront must support each section type.
                </p>
              </div>
              <div className="flex rounded-xl border bg-white p-1">
                <button
                  className={`rounded-lg p-2 ${!mobile ? "bg-slate-100" : ""}`}
                  title="Desktop preview"
                  onClick={() => setMobile(false)}
                >
                  <Monitor size={18} />
                </button>
                <button
                  className={`rounded-lg p-2 ${mobile ? "bg-slate-100" : ""}`}
                  title="Mobile preview"
                  onClick={() => setMobile(true)}
                >
                  <Smartphone size={18} />
                </button>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3 sm:p-5">
              <div
                className={`mx-auto overflow-hidden rounded-xl bg-white shadow-xl transition-all ${mobile ? "max-w-[375px]" : "w-full"}`}
                style={{ backgroundColor: branding?.backgroundColor || "#fff" }}
              >
                <div className="flex items-center justify-between border-b bg-white px-5 py-4">
                  <span
                    className="text-base font-black"
                    style={{ color: branding?.primaryColor || "#ea580c" }}
                  >
                    Your restaurant
                  </span>
                  <span className="text-xs font-semibold text-slate-500">MENU · ORDER</span>
                </div>
                {draft.sections.filter((s) => s.enabled).length ? (
                  draft.sections
                    .filter((s) => s.enabled)
                    .map((s) => (
                      <PreviewSection
                        key={s.id}
                        section={s}
                        branding={branding}
                        compact={mobile}
                        previewSlides={previewSlides}
                      />
                    ))
                ) : (
                  <p className="p-12 text-center text-slate-400">
                    Enable a section to preview your homepage.
                  </p>
                )}
                <div className="bg-slate-900 p-6 text-center text-xs text-white/70">
                  © Your restaurant · Powered by OrderXO
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                {published ? "A published version exists" : "No published homepage yet"} ·{" "}
                {draft.sections.length} sections
              </span>
              <span className="inline-flex items-center gap-1">
                <ExternalLink size={13} /> Save and publish to update the public website
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
