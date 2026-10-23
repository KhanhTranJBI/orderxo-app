import MenuBookDesigner from "../../../../../components/management/MenuBookDesigner";
export default function Page({ params }) {
  return <MenuBookDesigner organizationId={params.organizationId} />;
}
