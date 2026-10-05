import AdminPromotionManagerTemplate from "@/templates/admin/PromotionManagerTemplate";
import StripeProvider from "@/components/StripeProvider"; // We will create this helper

export const metadata = {
  title: "Admin Promotions Manager",
  description: process.env.NEXT_PUBLIC_DESCRIPTION,
};

export default function AdminMenuManagerPage() {
  return (
    <StripeProvider>
      <AdminPromotionManagerTemplate />
    </StripeProvider>
  );
}
