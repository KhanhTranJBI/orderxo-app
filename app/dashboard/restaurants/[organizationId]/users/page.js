import ManageUsersManager from "../../../../../components/management/ManageUsersManager";
export default function Page({ params }) {
  return <ManageUsersManager organizationId={params.organizationId} />;
}
