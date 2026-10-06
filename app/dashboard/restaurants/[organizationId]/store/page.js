import StoreSettingsManager from "../../../../../components/management/StoreSettingsManager";
export default function Page({ params }) {
  return <StoreSettingsManager organizationId={params.organizationId} />;
}
