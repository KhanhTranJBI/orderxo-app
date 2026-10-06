import ManagementPage from "../../../../../components/management/ManagementPage";
export default function Page({ params }) {
  return <ManagementPage organizationId={params.organizationId} section="financials" />;
}
