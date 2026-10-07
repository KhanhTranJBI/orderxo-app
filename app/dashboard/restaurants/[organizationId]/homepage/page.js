import HomepageSlidesManager from "../../../../../components/management/HomepageSlidesManager";
export default function Page({ params }) {
  return <HomepageSlidesManager organizationId={params.organizationId} />;
}
