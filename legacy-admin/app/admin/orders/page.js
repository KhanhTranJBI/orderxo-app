import AdminOrdersDashboardTemplate from "@/templates/admin/OrdersDashboardTemplate";
import StripeProvider from "@/components/StripeProvider"; // We will create this helper

export const metadata = {
  title: "Admin Orders Dashboard",
  description: process.env.NEXT_PUBLIC_DESCRIPTION,
};

export default function AdminOrdersDashboardPage() {
  return (
    <StripeProvider>
      <AdminOrdersDashboardTemplate />
    </StripeProvider>
  );
}
