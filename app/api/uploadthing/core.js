import { createUploadthing, UploadThingError } from "uploadthing/server";
import { cookies } from "next/headers";
import { backendRequest } from "@/lib/backend";
import { z } from "zod";

const f = createUploadthing();
export const ourFileRouter = {
  menuImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .input(z.object({ organizationId: z.string() }))
    .middleware(async ({ input, files }) => {
      const jar = cookies();
      const owner = jar.get("orderxo_owner_session")?.value;
      const staff = jar.get("orderxo_support_session")?.value;
      const staffMode = Boolean(
        staff && (!owner || jar.get("orderxo_staff_ui")?.value === "1"),
      );
      if (!owner && !staff) {
        throw new UploadThingError("You must be signed in to upload images");
      }
      // Never trust a client-supplied plan. Resolve the current organization
      // subscription through the authenticated backend on every upload.
      const organizationId = input?.organizationId;
      if (!/^[a-f0-9]{24}$/i.test(String(organizationId || ""))) {
        throw new UploadThingError("Select a restaurant before uploading.");
      }
      const result = await backendRequest(
        `/api/website-plus/entitlement?organizationId=${encodeURIComponent(organizationId)}`,
        { method: "GET", authenticated: true },
      );
      if (result.status !== 200 || !result.data?.canUpload) {
        throw new UploadThingError("An active Website Plus or paid OrderXO plan is required for uploads.");
      }
      const bytes = Number(files?.[0]?.size);
      if (!Number.isSafeInteger(bytes) || bytes <= 0) {
        throw new UploadThingError("Unable to determine upload size.");
      }
      const reservation = await backendRequest(
        `/api/website-plus/uploads?organizationId=${encodeURIComponent(organizationId)}`,
        { method: "POST", authenticated: true, body: { organizationId, action: "reserve", bytes } },
      );
      if (reservation.status !== 200 || !reservation.data?.uploadId) {
        throw new UploadThingError(reservation.data?.error || "Unable to reserve upload storage.");
      }
      return { uploader: staffMode ? "staff" : "owner", organizationId,
        uploadId: reservation.data.uploadId };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      const result = await backendRequest(
        `/api/website-plus/uploads?organizationId=${encodeURIComponent(metadata.organizationId)}`,
        { method: "POST", authenticated: true, body: {
          organizationId: metadata.organizationId, action: "complete",
          uploadId: metadata.uploadId, fileKey: file.key,
        } },
      );
      if (result.status !== 200) throw new UploadThingError("Upload quota could not be finalized.");
      return { url: file.ufsUrl || file.url };
    }),
};
