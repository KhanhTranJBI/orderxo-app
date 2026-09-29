import OwnerShell from "../../components/OwnerShell";
import OwnerForm from "../../components/OwnerForm";
export default function Page() {
  return (
    <OwnerShell
      title="Set up your restaurant"
      description="Add your first location to get started."
    >
      <OwnerForm mode="onboarding" />
    </OwnerShell>
  );
}
