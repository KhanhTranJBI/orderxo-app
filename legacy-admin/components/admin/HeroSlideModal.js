"use client";

import { createHeroSlide, updateHeroSlide } from "@/store/heroSlidesSlice";

import { Loader2, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

export default function HeroSlideModal({ slide = null, onClose, onSaved }) {
  const dispatch = useDispatch();
  const { data: session } = useSession();

  const [title, setTitle] = useState(slide?.title || "");
  const [subtitle, setSubtitle] = useState(slide?.subtitle || "");
  const [image, setImage] = useState(slide?.image || "");

  // NEW 👇
  const [cta, setCta] = useState(slide?.cta || "");
  const [link, setLink] = useState(slide?.link || "");

  const [saving, setSaving] = useState(false);

  const save = async () => {
    try {
      setSaving(true);

      const payload = {
        title,
        subtitle,
        image,
        cta,
        link,
      };

      if (slide) {
        await dispatch(
          updateHeroSlide({
            data: {
              id: slide._id,
              ...payload,
            },
            token: session.jwt,
          }),
        ).unwrap();

        toast.success("Hero slide updated");
      } else {
        await dispatch(
          createHeroSlide({
            data: payload,
            token: session.jwt,
          }),
        ).unwrap();

        toast.success("Hero slide created");
      }

      onSaved?.();
    } catch {
      toast.error(
        slide ? "Failed to update hero slide" : "Failed to create hero slide",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl px-2 md:px-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center sticky top-0 bg-white z-10 py-2">
          <h2 className="font-bold text-lg">
            {slide ? "Edit Hero Slide" : "New Hero Slide"}
          </h2>

          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="relative w-full h-80 rounded-xl overflow-hidden border">
          <img
            src={image}
            alt="Hero preview"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />

          <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-white text-center p-4">
            {title && <h3 className="text-xl font-bold">{title}</h3>}
            {subtitle && <p className="text-sm opacity-90">{subtitle}</p>}
            {cta && (
              <a
                href={link}
                className="mt-3 px-4 py-2 bg-primary rounded-lg text-sm font-semibold"
              >
                {cta}
              </a>
            )}
          </div>
        </div>

        {/* FIELDS */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500 font-medium">Title</label>
          <input
            className="w-full input p-2 border rounded"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500 font-medium">Subtitle</label>
          <input
            className="w-full input p-2 border rounded"
            placeholder="Subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500 font-medium">Image URL</label>
          <input
            className="w-full input p-2 border rounded"
            placeholder="Image URL"
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
        </div>

        {/* NEW 👇 */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500 font-medium">CTA Text</label>
          <input
            className="w-full input p-2 border rounded"
            placeholder="CTA Text (e.g. Order Now)"
            value={cta}
            onChange={(e) => setCta(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500 font-medium">CTA Link</label>
          <input
            className="w-full input p-2 border rounded"
            placeholder="CTA Link (e.g. /menu)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 sticky bottom-0 bg-white py-2">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>

          <button
            onClick={save}
            disabled={saving}
            className="flex gap-2 items-center px-3 py-1 bg-primary text-white rounded-xl hover:bg-primary/90"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {slide ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
