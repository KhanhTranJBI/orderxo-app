import GiftCardsManager from "../../../../../components/management/GiftCardsManager";
export default function Page({ params }) {
  return <GiftCardsManager organizationId={params.organizationId} />;
}
