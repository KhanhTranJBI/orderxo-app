import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendRequest, cookieName } from "../../../../../lib/backend";
import CustomPagesBuilder from "../../../../../components/CustomPagesBuilder";

export const dynamic = "force-dynamic";
export default async function Page({ params }) {
  if (!cookies().get(cookieName)?.value && !cookies().get("orderxo_support_session")?.value) redirect("/login");
  const result = await backendRequest("/api/organizations", { authenticated: true });
  if (result.status === 401) redirect("/login");
  const org = (result.data?.organizations || []).find((o) => String(o._id || o.id) === params.organizationId);
  if (!org) redirect("/dashboard");
  const admin = ["owner", "admin"].includes(org.role);
  const permissions = new Set(org.permissions || []);
  const canManage = admin || permissions.has("*") || permissions.has("custom-pages.manage");
  const canRead = canManage || permissions.has("custom-pages.read");
  if (!canRead) redirect(`/dashboard/restaurants/${params.organizationId}`);
  return <main className="mx-auto max-w-7xl px-4 py-10"><CustomPagesBuilder organizationId={params.organizationId} canManage={canManage}/></main>;
}
