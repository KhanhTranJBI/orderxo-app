import OrdersManager from "../../../../../components/management/OrdersManager";
export default function Page({ params }) {
  return (
    <>
      <div className="mx-auto px-2 xl:px-16 pt-6">
        <a
          className="inline-block rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white"
          href={process.env.NEXT_PUBLIC_ORDERXO_ORDERS_URL || "https://orders.orderxo.com"}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Order Operations ↗
        </a>
      </div>
      <OrdersManager organizationId={params.organizationId} mode="reports" />
    </>
  );
}
