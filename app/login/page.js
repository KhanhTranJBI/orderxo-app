import OwnerShell from "../../components/OwnerShell";
import PasswordlessSignIn from "../../components/PasswordlessSignIn";
export default function Page() {
  return (
    <OwnerShell
      title="Welcome back"
      description="Enter your owner email and we'll send you a secure sign-in link."
    >
      <PasswordlessSignIn />
    </OwnerShell>
  );
}
