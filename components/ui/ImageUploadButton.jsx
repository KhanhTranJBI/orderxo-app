"use client";

import PlanImageUploadButton from "./PlanImageUploadButton";
import { toast } from "react-toastify";

/** Upload a single image and write its public URL into the associated form field. */
export default function ImageUploadButton({ onUploaded, organizationId, label = "Upload image" }) {
  return (
    <div className="mt-2 flex justify-start">
      <PlanImageUploadButton organizationId={organizationId}
        endpoint="menuImage"
        onClientUploadComplete={(files) => {
          const url = files?.[0]?.ufsUrl || files?.[0]?.url || files?.[0]?.serverData?.url;
          if (!url) {
            toast.error("Upload finished, but no image URL was returned.");
            return;
          }
          onUploaded(url);
          toast.success("Image uploaded. Save your changes to keep it.");
        }}
        onUploadError={(error) => toast.error(error?.message || "Image upload failed.")}
        appearance={{
          button: "!w-auto !bg-orange-600 !text-white !rounded-lg !px-3 !py-2 !text-xs !font-semibold hover:!bg-orange-700",
          allowedContent: "!hidden",
        }}
        content={{ button: label }}
      />
    </div>
  );
}
