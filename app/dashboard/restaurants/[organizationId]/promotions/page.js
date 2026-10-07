import PromotionsManager from "../../../../../components/management/PromotionsManager";
export default function Page({ params }) {
  return <PromotionsManager organizationId={params.organizationId} />;
}
