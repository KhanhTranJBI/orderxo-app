import FinancialsManager from "../../../../../components/management/FinancialsManager";
export default function Page({ params }) {
  return <FinancialsManager organizationId={params.organizationId} />;
}
