import OwnerShell from "../../components/OwnerShell";
import PasswordlessSignIn from "../../components/PasswordlessSignIn";

export default function Page({ searchParams }) {
  const sessionExpired = searchParams?.message === "session_expired";

  return (
    <OwnerShell
      title="Welcome back"
      description="Enter your owner email and we'll send you a secure sign-in link."
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
    </OwnerShell>
  );
}
