import StoreSettingsManager from "../../../../../components/management/StoreSettingsManager";
import { backendRequest } from "../../../../../lib/backend";

export const dynamic = "force-dynamic";

export default async function Page({ params }) {
  const organizationId = params.organizationId;
  const result = await backendRequest(
    `/api/subscriptions/current?organizationId=${encodeURIComponent(organizationId)}`,
    { authenticated: true },
  );
  const subscription = result.status === 200 ? result.data?.subscription : null;
  const hasOrderingPlan =
    ["starter", "growth", "pro"].includes(String(subscription?.plan || "").toLowerCase()) &&
    ["active", "trialing"].includes(String(subscription?.status || "").toLowerCase());

  return <StoreSettingsManager organizationId={organizationId} hasOrderingPlan={hasOrderingPlan} />;
}
