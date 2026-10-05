import AdminManageUsersTemplate from "@/templates/admin/ManageUsersTemplate";

export const metadata = {
  title: "Admin Manage Users",
  description: process.env.NEXT_PUBLIC_DESCRIPTION,
};

export default function AdminManageUsersPage() {
  return <AdminManageUsersTemplate />;
}
