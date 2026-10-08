import HomepageBuilder from "../../../../../components/HomepageBuilder";
export default function Page({ params }) {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <HomepageBuilder organizationId={params.organizationId} />
    </main>
  );
}
