import OrdersManager from "../../../../../components/management/OrdersManager";
export default function Page({ params }) {
  return <OrdersManager organizationId={params.organizationId} />;
}
