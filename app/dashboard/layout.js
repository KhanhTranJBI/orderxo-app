import DashboardBreadcrumbs from "../../components/DashboardBreadcrumbs";

export default function DashboardLayout({ children }) {
  return (
    <>
      <DashboardBreadcrumbs />
      {children}
    </>
  );
}
