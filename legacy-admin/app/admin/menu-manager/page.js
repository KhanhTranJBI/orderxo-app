import AdminMenuManagerTemplate from "@/templates/admin/MenuManagerTemplate";
import StripeProvider from "@/components/StripeProvider"; // We will create this helper

export const metadata = {
  title: "Admin Menu Manager",
  description: process.env.NEXT_PUBLIC_DESCRIPTION,
};

export default function AdminMenuManagerPage() {
  return (
    <StripeProvider>
      <AdminMenuManagerTemplate />
    </StripeProvider>
  );
}
