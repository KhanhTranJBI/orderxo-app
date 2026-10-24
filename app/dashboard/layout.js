import { cookies } from "next/headers";
import DashboardBreadcrumbs from "../../components/DashboardBreadcrumbs";
import OwnerAccountNavigation from "../../components/OwnerAccountNavigation";
import { cookieName } from "../../lib/backend";

function sessionEmail(token) {
  if (!token || token.split(".").length !== 3) return "";
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const data = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
    return typeof data.email === "string" ? data.email : (typeof data.user?.email === "string" ? data.user.email : "");
  } catch {
    return "";
  }
}

export default function DashboardLayout({ children }) {
  const cookieStore = cookies();
  const ownerToken = cookieStore.get(cookieName)?.value;
  const supportToken = cookieStore.get("orderxo_support_session")?.value;
  const staffMode = Boolean(supportToken && (!ownerToken || cookieStore.get("orderxo_staff_ui")?.value === "1"));
  const signedIn = Boolean(ownerToken || supportToken);
  const email = sessionEmail(staffMode ? supportToken : ownerToken);

  return (
    <>
      <div className="sticky top-0 z-30 flex justify-end bg-slate-50/95 px-4 py-3 backdrop-blur">
        <OwnerAccountNavigation email={email} signedIn={signedIn} staffMode={staffMode} />
      </div>
      <DashboardBreadcrumbs />
      {children}
    </>
  );
}
