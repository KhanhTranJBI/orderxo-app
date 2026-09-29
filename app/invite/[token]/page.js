import OwnerShell from "../../../components/OwnerShell";
import InvitationAccept from "../../../components/InvitationAccept";
export default function Page({ params }) {
  return (
    <OwnerShell
      title="Your restaurant invitation"
      description="Review your invitation and join your restaurant workspace."
    >
      <InvitationAccept token={params.token} />
    </OwnerShell>
  );
}
