import LocationSettingsManager from "../../../../../components/management/LocationSettingsManager";
export default function Page({ params }) {
  return <LocationSettingsManager organizationId={params.organizationId} />;
}
