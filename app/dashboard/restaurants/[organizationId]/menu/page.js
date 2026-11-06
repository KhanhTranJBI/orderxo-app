import MenuManager from "../../../../../components/management/MenuManager";
import { backendRequest } from "../../../../../lib/backend";

export const dynamic = "force-dynamic";

export default async function Page({ params }) {
  const organizationId = params.organizationId;
  const result = await backendRequest(
    `/api/subscriptions/entitlements?organizationId=${encodeURIComponent(organizationId)}`,
    { authenticated: true },
  );
  const hasOrderingPlan =
    result.status === 200 &&
    result.data?.active === true &&
    result.data?.features?.onlineOrdering === true;

  return <MenuManager organizationId={organizationId} hasOrderingPlan={hasOrderingPlan} />;
}
