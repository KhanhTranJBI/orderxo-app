import StoreSettingsTemplate from "@/templates/admin/StoreSettingsTemplate";

export const metadata = {
  title: "Admin Store Settings",
  description: process.env.NEXT_PUBLIC_DESCRIPTION,
};

export default function StoreSettingsPage() {
  return <StoreSettingsTemplate />;
}
