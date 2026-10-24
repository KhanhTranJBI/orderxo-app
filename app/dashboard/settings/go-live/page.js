import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendRequest, cookieName } from "../../../../lib/backend";
import GoLiveChecklist from "../../../../components/GoLiveChecklist";
export const dynamic = "force-dynamic";
export default async function GoLivePage({ searchParams }) {
  const staffMode = Boolean(
    cookies().get("orderxo_support_session")?.value &&
    (cookies().get("orderxo_staff_ui")?.value === "1" || !cookies().get(cookieName)?.value),
  );
  if (!cookies().get(cookieName)?.value && !cookies().get("orderxo_support_session")?.value)
    redirect("/login");
  const organizationId = searchParams?.organizationId;
  const result = organizationId
    ? await backendRequest(`/api/locations?organizationId=${encodeURIComponent(organizationId)}`, {
        authenticated: true,
      })
    : null;
  if (result?.status === 401) redirect("/login");
  const locations = Array.isArray(result?.data?.locations) ? result.data.locations : [];
  return (
    <main className="min-h-screen mx-auto max-w-8xl px-2 xl:px-16 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold">Get ready to go live</h1>
        {staffMode && (
          <div
            role="status"
            className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-950"
          >
            <strong>OrderXO Staff Mode</strong> — Review onboarding progress and complete permitted
            setup tasks. Final activation requires the restaurant owner or an authorized restaurant
            admin.
          </div>
        )}
        {!organizationId ? (
          <p>Select a restaurant first.</p>
        ) : result?.status !== 200 ? (
          <p>Unable to load restaurant locations.</p>
        ) : locations.length === 0 ? (
          <p>Add a restaurant location to begin.</p>
        ) : (
          <GoLiveChecklist
            organizationId={organizationId}
            locations={locations}
            staffMode={staffMode}
          />
        )}
      </div>
    </main>
  );
}
