import OwnerShell from "../../components/OwnerShell";
import PasswordlessSignIn from "../../components/PasswordlessSignIn";

export default function Page({ searchParams }) {
  const sessionExpired = searchParams?.message === "session_expired";

  return (
    <OwnerShell
      title="OrderXO Owner Portal"
      description="Sign in to manage your restaurants, online ordering, locations, and subscription."
    >
      {sessionExpired && (
        <div
          role="status"
          className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          <p className="font-semibold">Your session has expired.</p>
          <p className="mt-1">Please sign in again to continue where you left off.</p>
        </div>
      )}
      <PasswordlessSignIn />
      <footer className="mt-7 border-t border-slate-200 pt-5 text-center text-xs text-slate-500">
        <p>Secure access for restaurant owners and authorized managers.</p>
        <nav aria-label="Legal" className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <a href="https://www.orderxo.com/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-orange-700">Privacy Policy</a>
          <span aria-hidden="true">·</span>
          <a href="https://www.orderxo.com/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-orange-700">Terms of Service</a>
        </nav>
        <p className="mt-3">© {new Date().getFullYear()} OrderXO</p>
      </footer>
    </OwnerShell>
  );
}
