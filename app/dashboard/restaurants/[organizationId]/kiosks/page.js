import KioskManager from "../../../../../components/management/KioskManager";
export default function Page({ params }) {
  return <KioskManager organizationId={params.organizationId} />;
}
