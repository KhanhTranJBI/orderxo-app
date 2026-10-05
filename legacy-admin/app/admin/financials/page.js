import AdminFinancialsTemplate from "@/templates/admin/FinancialsTemplate";
import StripeProvider from "@/components/StripeProvider"; // We will create this helper

export const metadata = {
  title: "Admin Financials",
  description: process.env.NEXT_PUBLIC_DESCRIPTION,
};

export default function AdminFinancialsPage() {
  return (
    <StripeProvider>
      <AdminFinancialsTemplate />
    </StripeProvider>
  );
}
