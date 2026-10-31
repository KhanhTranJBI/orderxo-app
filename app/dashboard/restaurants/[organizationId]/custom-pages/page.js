import CustomPagesBuilder from "../../../../../components/CustomPagesBuilder";
export default function Page({ params }) {
  return <main className="mx-auto max-w-7xl px-4 py-10"><CustomPagesBuilder organizationId={params.organizationId}/></main>;
}
