"use client";

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllMenu } from "@/store/menuSlice";
import { Loader2 } from "lucide-react";
import DOMPurify from "dompurify";
import Image from "next/image";

export default function MenuBookPage() {
  const dispatch = useDispatch();

  const allItems = useSelector((state) => state.menu.allItems);
  const loading = useSelector((state) => state.menu.loading);

  useEffect(() => {
    dispatch(fetchAllMenu());
  }, [dispatch]);

  // SAME grouping logic as your MenuTemplate
  const sortedCategories = useMemo(() => {
    if (!Array.isArray(allItems)) return [];

    const itemsByCategory = allItems.reduce((acc, item) => {
      if (!item?.category?.isActive) return acc;
      if (!item?.category?.slug) return acc;

      const slug = item.category.slug;

      if (!acc[slug]) {
        acc[slug] = {
          category: item.category,
          items: [],
        };
      }

      acc[slug].items.push(item);
      return acc;
    }, {});

    return Object.values(itemsByCategory).sort(
      (a, b) => (a.category.order ?? 0) - (b.category.order ?? 0),
    );
  }, [allItems]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="py-4 print-preview">
      {/* PRINT BUTTON */}
      <div className="flex justify-end mb-4 print:hidden">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-black text-white rounded-lg font-bold"
        >
          🖨️ Print Menu Book
        </button>
      </div>

      {/* MENU BOOK */}
      <div className="menu-book bg-black text-white p-10">
        {/* CATEGORIES */}
        {sortedCategories.map(({ category, items }) => {
          return (
            <div key={category.slug} className="mb-12 category-block">
              {/* CATEGORY TITLE */}
              <h2 className="flex justify-between items-center text-3xl text-green-400 font-bold mb-6 uppercase">
                <Image
                  src={process.env.NEXT_PUBLIC_LOGO_URL}
                  alt={process.env.NEXT_PUBLIC_NAME}
                  width={250}
                  height={60}
                  priority
                  className="object-contain"
                />
                {category.name}
              </h2>

              {/* RAW WARNING */}
              {["signature", "custom", "sushi"].includes(category.slug) && (
                <div className="text-gray-400 mb-4 text-sm">
                  (*) These menu items are served raw. Consuming raw or undercooked seafood may
                  increase your risk of foodborne illness.
                </div>
              )}

              {/* ITEMS */}
              <div className="space-y-8">
                {items.map((item, index) => {
                  const safeDescription =
                    typeof window !== "undefined"
                      ? DOMPurify.sanitize(item.description)
                      : item.description;

                  return (
                    <div key={item._id} className="flex justify-between gap-6">
                      {/* LEFT TEXT */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-2xl text-primary font-bold">{item.name}</h3>
                          <span className="text-primary font-bold text-xl">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>

                        {/* DESCRIPTION */}
                        {item.description && (
                          <p
                            className="text-gray-200 mt-2"
                            dangerouslySetInnerHTML={{
                              __html: safeDescription,
                            }}
                          />
                        )}

                        {/* INGREDIENTS */}
                        {item.ingredients && (
                          <p className="text-gray-300 mt-2">{item.ingredients}</p>
                        )}

                        {/* SAUCE */}
                        {item.sauce && (
                          <p className="text-gray-300 mt-2 italic">
                            <span className="underline">Sauce:</span> {item.sauce}
                          </p>
                        )}
                      </div>

                      {/* IMAGE RIGHT */}
                      {item.image && (
                        <div className="w-40 h-40 border border-white p-1 shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* FOOTER */}
        <div className="mt-10 bg-gray-800 text-gray-200 p-4 text-sm text-center rounded">
          (*) These menu items are served raw. Consuming raw or undercooked seafood may increase
          your risk of foodborne illness.
        </div>
      </div>

      {/* PRINT CSS */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
          }

          /* Hide everything except menu-book */
          header,
          footer,
          nav {
            display: none !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .menu-book {
            width: 100%;
            min-height: 100vh;
            padding: 40px;
            background: black;
            color: white;
          }

          img {
            break-inside: avoid;
          }

          h2,
          h3 {
            break-after: avoid;
          }

          .menu-book > div {
            break-inside: avoid;
          }

          /* 🔥 EACH CATEGORY = 1 PAGE WITH SAME BG */
          .category-block {
            break-before: page;
            page-break-before: always;

            width: 100%;
            min-height: 100vh;

            padding: 60px 50px;
            box-sizing: border-box;

            /* ✅ SAME BACKGROUND EACH PAGE */
            background: url("/images/menu-book-bg.png") center center no-repeat;
            background-size: cover;

            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* ❗ prevent first category from starting on a blank page */
          .category-block:first-of-type {
            break-before: auto;
            page-break-before: auto;
          }
        }
      `}</style>
    </div>
  );
}
