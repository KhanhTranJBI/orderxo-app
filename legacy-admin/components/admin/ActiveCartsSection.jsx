import clsx from "clsx";
import Image from "next/image";
import { Monitor, Globe } from "lucide-react";

export default function ActiveCartsSection({ carts }) {
  if (!carts.length) {
    return <p className="text-gray-500">No active carts</p>;
  }

  const isHot = (cart) =>
    Date.now() - new Date(cart.lastActivityAt) < 2 * 60 * 1000;

  return (
    <div className="space-y-4">
      {carts.map((cart) => (
        <div
          key={cart._id}
          className={clsx(
            "bg-white border rounded-xl p-4 shadow-sm",
            isHot(cart) && "border-green-500 bg-green-50",
          )}
        >
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold">{cart.customer?.name || "Guest"}</p>
                <SourceBadge source={cart.source} />
              </div>
              <p className="text-sm text-gray-500">
                {cart.customer?.email || "No email"}
              </p>
            </div>

            <div className="text-right">
              <p className="font-bold">
                ${cart.subtotal?.toFixed(2) || "0.00"}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(cart.lastActivityAt).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="mt-4 divide-y divide-gray-200">
            {cart.items.map((item, idx) => (
              <div key={idx} className="flex gap-3 py-3 text-sm">
                {/* Image */}
                <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>

                {/* Item info */}
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-semibold">
                      {item.quantity}× {item.name}
                    </p>

                    <p className="font-semibold text-primary">
                      ${item.totalPrice?.toFixed(2) || "0.00"}
                    </p>
                  </div>

                  {/* ✅ MODIFIERS (same logic as OrderCard) */}
                  {Object.values(item.selectedModifiers || {})
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((group, i) => {
                      if (!group.selections?.length) return null;

                      return (
                        <div key={i} className="mt-1">
                          <span className="font-bold text-gray-700 block uppercase text-xs">
                            {group.title}:
                          </span>

                          <span className="text-gray-500 italic text-xs">
                            {group.selections.map((sel, j) => (
                              <span key={j}>
                                {sel.name}
                                {sel.price > 0 &&
                                  ` (+$${sel.price.toFixed(2)})`}
                                {j < group.selections.length - 1 ? ", " : ""}
                              </span>
                            ))}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SourceBadge({ source }) {
  const isKiosk = source === "kiosk";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
        isKiosk ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700",
      )}
    >
      {isKiosk ? <Monitor size={10} /> : <Globe size={10} />}
      {isKiosk ? "Kiosk" : "Online"}
    </span>
  );
}
