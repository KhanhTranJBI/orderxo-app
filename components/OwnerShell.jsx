import Link from "next/link";
export default function OwnerShell({ title, description, children }) {
  return (
    <main className="min-h-screen bg-[#faf7f1] px-4 py-12">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-xl font-bold text-orange-700">
          OrderXO
        </Link>
        <div className="mt-8 rounded-2xl border border-orange-100 bg-white p-7 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          <p className="mb-7 mt-2 text-slate-600">{description}</p>
          {children}
        </div>
      </div>
    </main>
  );
}
