import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import OwnerForm from "../../../components/OwnerForm";
import { cookieName } from "../../../lib/backend";
export default function Page() {
  if (!cookies().get(cookieName)?.value) redirect("/login?next=/restaurants/new");
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <Link href="/dashboard" className="font-semibold text-orange-700">
          ← Dashboard
        </Link>
        <div className="mt-6 rounded-2xl border bg-white p-7 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
            OrderXO Owner Portal
          </p>
          <h1 className="mt-1 text-3xl font-bold">Add restaurant</h1>
          <p className="mb-7 mt-2 text-slate-600">
            Create another restaurant under your owner account. You can configure its website,
            domain and billing next.
          </p>
          <OwnerForm mode="onboarding" />
        </div>
      </div>
    </main>
  );
}
