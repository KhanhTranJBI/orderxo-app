import HomepageBuilder from "../../../../../components/HomepageBuilder";
export default function Page({ params }) {
  return (
    <main className="mx-auto max-w-8xl px-2 xl:px-16">
      <HomepageBuilder organizationId={params.organizationId} />
    </main>
  );
}
