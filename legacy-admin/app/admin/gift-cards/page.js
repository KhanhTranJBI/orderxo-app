import AdminGiftCardsDashboardTemplate from "@/templates/admin/GiftCardsDashboardTemplate";
import StripeProvider from "@/components/StripeProvider"; // We will create this helper

export const metadata = {
  title: "Admin GiftCards Dashboard",
  description: process.env.NEXT_PUBLIC_DESCRIPTION,
};

export default function AdminGiftCardsDashboardPage() {
  return (
    <StripeProvider>
      <AdminGiftCardsDashboardTemplate />
    </StripeProvider>
  );
}
