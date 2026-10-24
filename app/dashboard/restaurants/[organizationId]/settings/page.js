import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cookieName, backendUrl } from "../../../../../lib/backend";
import RestaurantSettings from "../../../../../components/RestaurantSettings";

export const dynamic = "force-dynamic";

export default async function RestaurantSettingsPage({ params }) {
  if (!cookies().get(cookieName)?.value && !cookies().get("orderxo_support_session")?.value)
    redirect("/login");
  const staffMode = Boolean(cookies().get("orderxo_support_session")?.value);
  let staffPermissions = [];
  if (staffMode) {
    try {
      const response = await fetch(backendUrl("/api/support/workspace"), {
        headers: { Authorization: `Bearer ${cookies().get("orderxo_support_session").value}` },
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        staffPermissions = data.session?.permissions || [];
      }
    } catch {}
  }
  return (
    <>
      {staffMode && (
        <div className="mx-auto max-w-8xl px-2 xl:px-16 pt-6">
          <div
            className="mx-auto max-w-8xl rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-950"
            role="status"
          >
            <strong>OrderXO Staff Mode</strong> — You are using the restaurant&apos;s existing
            Manager Dashboard. Your session permissions determine which editors and actions are
            available.
          </div>
        </div>
      )}
      <RestaurantSettings
        organizationId={params.organizationId}
        staffMode={staffMode}
        staffPermissions={staffPermissions}
      />
    </>
  );
}
