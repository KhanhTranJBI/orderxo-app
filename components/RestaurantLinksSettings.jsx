"use client";

import ImageUploadButton from "./ui/ImageUploadButton";
import { icons as lucideIcons } from "lucide-react";

const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

const NAV_ICON_OPTIONS = ["none", "house", "utensils-crossed", "contact", "gift", "shopping-bag", "phone", "mail", "info", "star", "heart", "map-pin", "calendar-days", "image", "book-open", "coffee", "leaf", "menu", "users", "clock", "external-link"];
function IconChoice({ value, onChange }) {
  const name = value || "none";
  const Icon = lucideIcons[name.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("")];
  return <div className="flex items-center gap-2">
    <select aria-label="Navigation icon" className={input} value={name} onChange={(e) => onChange(e.target.value)}>
      {NAV_ICON_OPTIONS.map((option) => <option key={option} value={option}>{option === "none" ? "No icon" : option.replace(/-/g, " ")}</option>)}
    </select>
    {Icon && <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />}
  </div>;
}

function LinkEditor({ title, value = [], onChange, allowImages = false, organizationId }) {
  const links = Array.isArray(value) ? value : [];
  const edit = (index, key, val) =>
    onChange(links.map((item, i) => (i === index ? { ...item, [key]: val } : item)));
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>
        <button
          type="button"
          className="rounded-lg border px-3 py-2 text-sm"
          onClick={() => onChange([...links, { label: "", url: "", openInNewTab: true }])}
        >
          + Add link
        </button>
      </div>
      {links.map((link, index) => (
        <div key={index} className="rounded-xl border p-3 space-y-2">
          <div className="grid gap-2 md:grid-cols-2">
            <input
              aria-label="Link label"
              className={input}
              placeholder="Label (e.g. DoorDash)"
              value={link.label || ""}
              onChange={(e) => edit(index, "label", e.target.value)}
            />
            <input
              aria-label="Link URL"
              className={input}
              placeholder="https://example.com"
              value={link.url || ""}
              onChange={(e) => edit(index, "url", e.target.value)}
            />
          </div>
          {allowImages && <label className="block space-y-1 text-sm"><span className="font-medium">Navigation icon</span><IconChoice value={link.icon || "none"} onChange={(icon) => edit(index, "icon", icon)} /></label>}
          {allowImages && (
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Image URL (optional)</span>
              <input
                aria-label="Link image URL"
                className={input}
                placeholder="https://example.com/logo.png"
                value={link.imageUrl || ""}
                onChange={(e) => edit(index, "imageUrl", e.target.value)}
              />
              <ImageUploadButton
                organizationId={organizationId}
                onUploaded={(url) => edit(index, "imageUrl", url)}
              />
              <span className="block text-xs text-slate-500">
                Use a publicly accessible HTTPS image URL. Appears before the link name.
              </span>
              {/^https:\/\//i.test(link.imageUrl || "") && (
                <img
                  src={link.imageUrl}
                  alt="Navigation link preview"
                  className="mt-2 h-9 w-9 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
            </label>
          )}
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={link.openInNewTab !== false}
                onChange={(e) => edit(index, "openInNewTab", e.target.checked)}
              />
              Open in new tab
            </label>
            <button
              type="button"
              className="text-sm text-red-600"
              onClick={() => onChange(links.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      {!links.length && <p className="text-sm text-slate-500">No custom links yet.</p>}
    </div>
  );
}

export default function RestaurantLinksSettings({ value = {}, onChange, organizationId }) {
  const change = (key, val) => onChange({ ...value, [key]: val });
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold">Navigation &amp; Footer Links</h2>
        <p className="mt-1 text-sm text-slate-500">
          Shared across all locations. Manage social links in Store Settings.
        </p>
      </div>
      <div className="rounded-xl border p-4 space-y-3">
        <h3 className="font-semibold">Default navigation icons</h3>
        <p className="text-sm text-slate-500">Choose an icon for each built-in navigation link. No icon hides it.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[["home", "Home", "house"], ["menu", "Menu", "utensils-crossed"], ["contact", "Contact Us", "contact"], ["giftCard", "E-Gift Card", "gift"]].map(([key, label, fallback]) => (
            <label key={key} className="space-y-1 text-sm"><span className="font-medium">{label}</span>
              <IconChoice value={value.navIcons?.[key] ?? fallback} onChange={(icon) => change("navIcons", { ...(value.navIcons || {}), [key]: icon })} />
            </label>
          ))}
        </div>
      </div>
      <LinkEditor
        title="Navigation links (DoorDash, delivery, etc.)"
        allowImages
        value={value.navigationLinks}
        onChange={(links) => change("navigationLinks", links)}
        organizationId={organizationId}
      />
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Footer link groups</h3>
            <p className="text-xs text-slate-500">
              Create headings such as Sister Restaurants or Partners.
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg border px-3 py-2 text-sm"
            onClick={() =>
              change("footerGroups", [
                ...(value.footerGroups || []),
                { title: "", enabled: true, links: [] },
              ])
            }
          >
            + Add category
          </button>
        </div>
        {(value.footerGroups || []).map((group, index) => (
          <div key={index} className="rounded-xl border p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <input
                className={`${input} flex-1`}
                placeholder="Category heading"
                value={group.title || ""}
                onChange={(e) =>
                  change(
                    "footerGroups",
                    value.footerGroups.map((g, i) =>
                      i === index ? { ...g, title: e.target.value } : g,
                    ),
                  )
                }
              />
              <label className="text-sm flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={group.enabled !== false}
                  onChange={(e) =>
                    change(
                      "footerGroups",
                      value.footerGroups.map((g, i) =>
                        i === index ? { ...g, enabled: e.target.checked } : g,
                      ),
                    )
                  }
                />{" "}
                Visible
              </label>
              <button
                type="button"
                className="text-red-600 text-sm"
                onClick={() =>
                  change(
                    "footerGroups",
                    value.footerGroups.filter((_, i) => i !== index),
                  )
                }
              >
                Remove category
              </button>
            </div>
            <LinkEditor
              title="External links"
              value={group.links}
              onChange={(links) =>
                change(
                  "footerGroups",
                  value.footerGroups.map((g, i) => (i === index ? { ...g, links } : g)),
                )
              }
              organizationId={organizationId}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
