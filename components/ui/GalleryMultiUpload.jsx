"use client";

import { useEffect, useRef, useState } from "react";
import { generateReactHelpers } from "@uploadthing/react";

const { useUploadThing } = generateReactHelpers();
import { toast } from "react-toastify";

export default function GalleryMultiUpload({ organizationId, onUploaded }) {
  const inputRef = useRef(null);
  const { startUpload } = useUploadThing("menuImage");
  const [allowed, setAllowed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  useEffect(() => {
    let active = true;
    setAllowed(false);
    if (!organizationId) return;
    fetch(`/api/owner/website-plus/entitlement?organizationId=${encodeURIComponent(organizationId)}`, { cache: "no-store" })
      .then((r) => { if (!r.ok) throw Error(); return r.json(); })
      .then((data) => { if (active) setAllowed(data.canUpload === true); })
      .catch(() => { if (active) setAllowed(false); });
    return () => { active = false; };
  }, [organizationId]);

  async function handleFiles(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length || busy) return;
    setBusy(true);
    let success = 0;
    try {
      // The existing endpoint reserves storage for one file at a time.
      // Upload sequentially so each image has its own reservation/finalization.
      for (const [index, file] of files.entries()) {
        setProgress(`Uploading ${index + 1} of ${files.length}…`);
        try {
          const result = await startUpload([file], { organizationId });
          const url = result?.[0]?.serverData?.url || result?.[0]?.ufsUrl || result?.[0]?.url;
          if (!url) throw new Error("Upload returned no image URL");
          onUploaded(url);
          success++;
        } catch (error) {
          toast.error(`${file.name}: ${error?.message || "Upload failed"}`);
        }
      }
      if (success) toast.success(`${success} gallery image${success === 1 ? "" : "s"} uploaded. Save your changes.`);
    } finally {
      setProgress("");
      setBusy(false);
    }
  }

  if (!allowed) return null;
  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      <button type="button" disabled={busy} onClick={() => inputRef.current?.click()}
        className="rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50">
        {busy ? progress : "Upload gallery images"}
      </button>
      <p className="text-xs text-slate-500">Select multiple photos at once. Images upload individually.</p>
    </div>
  );
}
