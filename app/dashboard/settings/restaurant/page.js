import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cookieName } from "../../../../lib/backend";
import RestaurantSettings from "../../../../components/RestaurantSettings";

export const dynamic = "force-dynamic";

export default function RestaurantSettingsPage({ searchParams }) {
  if (!cookies().get(cookieName)?.value) redirect("/login");
  return <RestaurantSettings organizationId={searchParams?.organizationId || ""} />;
}
