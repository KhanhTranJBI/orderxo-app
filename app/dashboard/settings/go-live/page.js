import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendRequest, cookieName } from "../../../../lib/backend";
import GoLiveChecklist from "../../../../components/GoLiveChecklist";
export const dynamic = "force-dynamic";
export default async function GoLivePage({ searchParams }) {
  if (!cookies().get(cookieName)?.value) redirect("/login");
  const organizationId = searchParams?.organizationId;
  const result = organizationId
    ? await backendRequest(`/api/locations?organizationId=${encodeURIComponent(organizationId)}`, {
        authenticated: true,
      })
    : null;
  if (result?.status === 401) redirect("/login");
  const locations = Array.isArray(result?.data?.locations) ? result.data.locations : [];
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/dashboard" className="font-semibold text-orange-700">
          ← Dashboard
        </Link>
        <h1 className="text-3xl font-bold">Get ready to go live</h1>
        {!organizationId ? (
          <p>Select a restaurant first.</p>
        ) : result?.status !== 200 ? (
          <p>Unable to load restaurant locations.</p>
        ) : locations.length === 0 ? (
          <p>Add a restaurant location to begin.</p>
        ) : (
          <GoLiveChecklist organizationId={organizationId} locations={locations} />
        )}
      </div>
    </main>
  );
}
