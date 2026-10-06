import MenuManager from "../../../../../components/management/MenuManager";
export default function Page({ params }) {
  return <MenuManager organizationId={params.organizationId} />;
}
