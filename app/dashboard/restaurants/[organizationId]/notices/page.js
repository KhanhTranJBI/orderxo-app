import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendRequest, cookieName } from "../../../../../lib/backend";
import PrintableNotices from "../../../../../components/management/PrintableNotices";

export const dynamic = "force-dynamic";
export default async function Page({ params }) {
  if (!cookies().get(cookieName)?.value && !cookies().get("orderxo_support_session")?.value) redirect("/login");
  const result = await backendRequest("/api/organizations", { authenticated: true });
  if (result.status === 401) redirect(cookies().get("orderxo_support_session")?.value ? "/dashboard" : "/login");
  const org = (result.data?.organizations || []).find((o) => String(o._id || o.id) === params.organizationId);
  if (!org) redirect("/dashboard");
  const admin = ["owner", "admin"].includes(org.role);
  const permissions = new Set(org.permissions || []);
  const canManage = admin || permissions.has("*") || permissions.has("notices.manage");
  const canRead = canManage || permissions.has("notices.read");
  if (!canRead) redirect(`/dashboard/restaurants/${params.organizationId}`);
  return <PrintableNotices organizationId={params.organizationId} restaurantName={org.name || org.restaurantName || "Our Restaurant"} canManage={canManage} />;
}
