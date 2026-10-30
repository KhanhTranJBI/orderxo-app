"use client";
import { useEffect, useState } from "react";
import { UploadButton } from "@uploadthing/react";

export default function PlanImageUploadButton({ organizationId, ...props }) {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    let active = true;
    setAllowed(false);
    if (!organizationId) return;
    fetch(`/api/owner/website-plus/entitlement?organizationId=${encodeURIComponent(organizationId)}`, { cache: "no-store" })
      .then(async r => { if (!r.ok) throw Error(); return r.json(); })
      .then(data => {
        if (active) setAllowed(data.canUpload === true);
      })
      .catch(() => { if (active) setAllowed(false); });
    return () => { active = false; };
  }, [organizationId]);
  if (!allowed) return null;
  return <UploadButton {...props} input={{ organizationId }} />;
}
