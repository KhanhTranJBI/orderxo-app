import { createUploadthing, UploadThingError } from "uploadthing/server";
import { cookies } from "next/headers";

const f = createUploadthing();
export const ourFileRouter = {
  menuImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const jar = cookies();
      const owner = jar.get("orderxo_owner_session")?.value;
      const staff = jar.get("orderxo_support_session")?.value;
      const staffMode = jar.get("orderxo_staff_ui")?.value === "1";
      if ((!staffMode && !owner) || (staffMode && !staff)) {
        throw new UploadThingError("You must be signed in to upload images");
      }
      return { uploader: staffMode ? "staff" : "owner" };
    })
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl || file.url })),
};
