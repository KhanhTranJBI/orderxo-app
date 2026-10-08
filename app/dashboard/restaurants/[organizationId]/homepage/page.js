import { redirect } from "next/navigation";

export default function Page({ params }) {
  redirect(`/dashboard/restaurants/${params.organizationId}/store`);
}
