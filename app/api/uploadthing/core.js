import { createUploadthing, UploadThingError } from "uploadthing/server";
import { cookies } from "next/headers";
import { backendRequest } from "@/lib/backend";
import { z } from "zod";

const f = createUploadthing();
export const ourFileRouter = {
  menuImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .input(z.object({ organizationId: z.string() }))
    .middleware(async ({ input }) => {
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
      let subscription;
      try {
        const result = await backendRequest(
          `/api/subscriptions/current?organizationId=${encodeURIComponent(organizationId)}`,
          { method: "GET", authenticated: true },
        );
        if (result.status !== 200) throw new Error("Subscription lookup failed");
        subscription = result.data?.subscription;
      } catch {
        throw new UploadThingError("Unable to verify upload eligibility. Please try again.");
      }
      const plan = String(subscription?.plan || subscription?.tier || "").toLowerCase();
      if (!["starter", "growth", "pro"].includes(plan)) {
        throw new UploadThingError("Image uploads are not available on the Free Website plan.");
      }
      return { uploader: staffMode ? "staff" : "owner" };
    })
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl || file.url })),
};
