"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  GripVertical,
  Loader2,
  X,
  Menu,
  SlidersHorizontal,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteMenuItem,
  fetchAllMenu,
  reorderItems,
  toggleMenuItemActive,
} from "@/store/menuSlice";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

import { DndContext, closestCenter } from "@dnd-kit/core";

import { deleteCategory, fetchAdminCategories } from "@/store/categoryAdminSlice";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import EditItemModal from "@/components/admin/EditItemModal";
import { fetchModifierGroups } from "@/store/modifierSlice";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import NewCategoryModal from "@/components/admin/NewCategoryModal";
import { reorderCategories } from "@/store/categoryAdminSlice";
import { useRouter, useSearchParams } from "next/navigation";
import ModifiersManager from "./ModifiersManager";

function SortableCategory({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children(listeners)}
    </div>
  );
}

function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children(listeners)}
    </div>
  );
}

export default function AdminMenuManagerTemplate() {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState({});
  const [updatingId, setUpdatingId] = useState(null);

  const categories = useSelector((state) => state.categoryAdmin.categories);

  const { data: session } = useSession();
  const dispatch = useDispatch();

  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab") || "menu";

  const allItems = useSelector((state) => state.menu.allItems);
  const loading = useSelector((state) => state.menu.loading);

  const [categoryOrder, setCategoryOrder] = useState([]);
  const [itemOrder, setItemOrder] = useState({});

  const [editingItem, setEditingItem] = useState(null);

  const modifierMap = useSelector((s) => s.modifiers.all);

  const modifierGroups = useMemo(() => {
    return Object.values(modifierMap);
  }, [modifierMap]);

  const [itemToDelete, setItemToDelete] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showNewCategory, setShowNewCategory] = useState(false);

  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  const [editingCategory, setEditingCategory] = useState(null);

  /* ---------------- GROUP + SORT ---------------- */
  const sortedCategories = useMemo(() => {
    if (!categories.length) return [];

    return (
      [...categories]
        // .filter((c) => c.isActive)
        .sort((a, b) => a.order - b.order)
        .map((category) => ({
          category,
          items: allItems
            .filter((i) => {
              const itemCategoryId = typeof i.category === "string" ? i.category : i.category?._id;

              return itemCategoryId === category._id;
            })

            .filter((i) => (query ? i.name.toLowerCase().includes(query.toLowerCase()) : true))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        }))
    );
  }, [categories, allItems, query]);

  useEffect(() => {
    if (!sortedCategories.length) return;

    setCollapsed((prev) => {
      // If we already have collapse state, keep it
      if (Object.keys(prev).length > 0) return prev;

      // Otherwise initialize once
      const initialCollapsed = {};
      sortedCategories.forEach((c, index) => {
        initialCollapsed[c.category.slug] = index !== 0;
      });

      return initialCollapsed;
    });
  }, [sortedCategories]);

  /* ---------------- FETCH MENU ---------------- */
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!session?.jwt || hasFetched.current) return;

    hasFetched.current = true;

    dispatch(fetchAllMenu());
    dispatch(fetchAdminCategories(session.jwt));
    dispatch(fetchModifierGroups());
  }, [session?.jwt]);

  const getTabFromHash = () => {
    if (typeof window === "undefined") return "items";

    const params = new URLSearchParams(window.location.hash.replace("#", ""));

    const tab = params.get("tab");

    if (["items", "modifiers"].includes(tab)) {
      return tab;
    }

    return "items";
  };

  const [activeTab, setActiveTab] = useState(getTabFromHash); // active | history

  const tabs = [
    { id: "items", label: "Menu Items", icon: Menu },
    {
      id: "modifiers",
      label: "Modifiers",
      icon: SlidersHorizontal,
    },
  ];

  const handleTabClick = (id) => {
    setActiveTab(id);

    router.push(`?tab=${id}`);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    router.push(`?tab=${activeTab}`);
  }, [activeTab]);

  useEffect(() => {
    const onHashChange = () => {
      setActiveTab(getTabFromHash());
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!sortedCategories.length) return;

    setCategoryOrder((prev) => {
      const newIds = sortedCategories.map((c) => c.category._id);

      // Add missing IDs (new categories)
      const merged = [...prev];

      newIds.forEach((id) => {
        if (!merged.includes(id)) {
          merged.push(id);
        }
      });

      // Remove deleted categories
      return merged.filter((id) => newIds.includes(id));
    });
  }, [sortedCategories]);

  useEffect(() => {
    const next = {};
    sortedCategories.forEach(({ category, items }) => {
      next[category.slug] = items.map((i) => i._id);
    });
    setItemOrder(next);
  }, [sortedCategories]);

  async function handleCategoryDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const newOrder = arrayMove(
      categoryOrder,
      categoryOrder.indexOf(active.id),
      categoryOrder.indexOf(over.id),
    );

    const prevOrder = categoryOrder;
    setCategoryOrder(newOrder);

    const payload = newOrder.map((id, index) => ({
      id,
      order: index,
    }));

    try {
      await dispatch(
        reorderCategories({
          orders: payload,
          token: session.jwt,
        }),
      ).unwrap();

      toast.success("Category order updated");
    } catch {
      setCategoryOrder(prevOrder);
      toast.error("Failed to save category order");
    }
  }

  async function handleItemDragEnd(categorySlug, event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const current = itemOrder[categorySlug];
    const next = arrayMove(current, current.indexOf(active.id), current.indexOf(over.id));

    const prevState = itemOrder;

    // Optimistic update
    setItemOrder((prev) => ({
      ...prev,
      [categorySlug]: next,
    }));

    const orders = next.map((itemId, index) => ({
      id: itemId,
      order: index,
    }));

    try {
      await dispatch(
        reorderItems({
          categorySlug,
          orders,
          token: session.jwt,
        }),
      ).unwrap();

      toast.success("Item order updated");
    } catch {
      setItemOrder(prevState);
      toast.error("Failed to save item order");
    }
  }

  /* ---------------- TOGGLE ACTIVE (OPTIMISTIC) ---------------- */
  const handleToggleActive = async (item) => {
    if (!session?.jwt) return;

    const nextValue = !item.isActive;
    setUpdatingId(item._id);

    try {
      await dispatch(
        toggleMenuItemActive({
          id: item._id,
          isActive: nextValue,
          token: session.jwt,
        }),
      ).unwrap();

      toast.success(nextValue ? "Item activated" : "Item deactivated");
    } catch (err) {
      toast.error(err || "Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="py-4 md:py-6 px-2 xl:px-16">
      {/* Tabs */}
      <div className="sticky top-16 z-20 bg-white rounded-xl shadow-md mb-6 overflow-hidden">
        <nav className="flex overflow-x-auto no-scrollbar space-x-6 px-4 bg-white">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={clsx(
                  `
                        relative flex items-center gap-2 whitespace-nowrap py-4 font-medium flex-shrink-0
                        text-gray-500 hover:text-gray-700 transition-colors
                        after:absolute after:left-0 after:bottom-0 after:h-[3px] after:w-full
                        after:bg-primary after:origin-left after:scale-x-0
                        after:transition-transform after:duration-300
                        hover:after:scale-x-100
                        `,
                  isActive && "text-primary after:scale-x-100",
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === "items" && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Menu Items</h1>
            <button
              onClick={() => setShowNewCategory(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </div>
          {/* Search */}
          <div className="relative mb-6 max-w-md">
            {/* Search icon */}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

            {/* Input */}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for an item"
              className="pl-9 pr-9 py-2 w-full border rounded-lg"
            />

            {/* Clear button */}
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="
        absolute right-2 top-1/2 -translate-y-1/2
        p-1 rounded-full
        text-gray-400 hover:text-gray-600 hover:bg-gray-100
      "
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Categories */}
          <DndContext collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
            <SortableContext items={categoryOrder} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {categoryOrder.map((id) => {
                  const group = sortedCategories.find((c) => c.category._id === id);
                  if (!group) return null;

                  const { category, items } = group;

                  const isCollapsed = collapsed[category.slug];

                  return (
                    <SortableCategory key={category._id} id={category._id}>
                      {(listeners) => (
                        <div className="bg-white rounded-xl border">
                          {/* Category Header */}
                          <div className="flex items-center justify-between p-4">
                            {/* DRAG HANDLE ONLY */}
                            <div
                              {...listeners}
                              className="mr-3 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                              title="Drag to reorder category"
                            >
                              <GripVertical size={20} />
                            </div>
                            {/* CLICK AREA (collapse only) */}
                            <button
                              onClick={() =>
                                setCollapsed((s) => ({
                                  ...s,
                                  [category.slug]: !s[category.slug],
                                }))
                              }
                              className="flex-1 text-left"
                            >
                              <div className="flex items-center gap-2 font-semibold">
                                {category.image && (
                                  <img
                                    src={category.image}
                                    alt={category.name}
                                    className="w-4 h-4"
                                  />
                                )}

                                <span className={clsx(!category.isActive && "text-gray-400 ")}>
                                  {category.name}
                                </span>

                                {!category.isActive && (
                                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                    Inactive
                                  </span>
                                )}
                              </div>

                              <div className="text-sm text-gray-500">
                                {items.length} items
                                {items.some((i) => !i.isActive) && (
                                  <span className="ml-2 text-red-600">
                                    · {items.filter((i) => !i.isActive).length} out of stock
                                  </span>
                                )}
                              </div>
                            </button>

                            <div className="flex gap-2 flex-col md:flex-row">
                              {/* ➕ ADD ITEM */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingItem({
                                    category: category._id,
                                  });
                                }}
                                className="flex items-center gap-1 text-sm px-3 py-2 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg"
                              >
                                <Plus size={14} />
                                Add Item
                              </button>

                              <div className="flex gap-2">
                                {/* ✏️ EDIT CATEGORY */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCategory(category);
                                  }}
                                  className="p-2 hover:bg-gray-100 rounded"
                                  title="Edit category"
                                >
                                  <Pencil size={20} />
                                </button>

                                {/* DELETE CATEGORY */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCategoryToDelete(category);
                                  }}
                                  className="p-2 hover:bg-red-50 rounded text-red-600"
                                  title="Delete category"
                                >
                                  <Trash2 size={20} />
                                </button>
                              </div>
                            </div>

                            {/* Collapse icon */}
                            <div
                              className="ml-2"
                              onClick={() =>
                                setCollapsed((s) => ({
                                  ...s,
                                  [category.slug]: !s[category.slug],
                                }))
                              }
                            >
                              {isCollapsed ? <ChevronDown /> : <ChevronUp />}
                            </div>
                          </div>

                          {!isCollapsed && (
                            <div className="divide-y">
                              <DndContext
                                collisionDetection={closestCenter}
                                onDragEnd={(e) => handleItemDragEnd(category.slug, e)}
                              >
                                <SortableContext
                                  items={itemOrder[category.slug] || []}
                                  strategy={verticalListSortingStrategy}
                                >
                                  {(itemOrder[category.slug] || []).map((itemId) => {
                                    const item = items.find((i) => i._id === itemId);

                                    if (!item) return null;

                                    return (
                                      <SortableItem key={item._id} id={item._id}>
                                        {(listeners) => (
                                          <div className="flex items-center gap-4 p-4">
                                            {/* DRAG HANDLE */}
                                            <div
                                              {...listeners}
                                              className="cursor-grab active:cursor-grabbing text-gray-400"
                                              title="Drag to reorder item"
                                            >
                                              <GripVertical size={16} />
                                            </div>

                                            <div className="w-full flex flex-col md:flex-row gap-2">
                                              <div className="w-full flex flex-row gap-2">
                                                {/* Image */}
                                                <div className="relative w-14 h-14 rounded-md overflow-hidden bg-gray-100">
                                                  {item.image && (
                                                    <Image
                                                      src={item.image}
                                                      alt={item.name}
                                                      fill
                                                      className="object-cover"
                                                    />
                                                  )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 flex flex-col gap-2">
                                                  <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-2">
                                                    <span className="font-medium">{item.name}</span>
                                                    {item.bestSeller && (
                                                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                                                        Best Seller
                                                      </span>
                                                    )}
                                                    {item.newItem && (
                                                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                                        New
                                                      </span>
                                                    )}
                                                  </div>
                                                  <div className="text-sm text-gray-500">
                                                    ${item.price.toFixed(2)}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="flex gap-4 shrink-0">
                                                {/* STATUS TOGGLE */}
                                                <button
                                                  disabled={updatingId === item._id}
                                                  onClick={() => handleToggleActive(item)}
                                                  className={clsx(
                                                    "px-3 py-1 rounded-full text-sm transition",
                                                    item.isActive
                                                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                      : "bg-gray-200 text-gray-500 hover:bg-gray-300",
                                                    updatingId === item._id &&
                                                      "opacity-50 cursor-wait",
                                                  )}
                                                >
                                                  {item.isActive ? "In stock" : "Out of stock"}
                                                </button>

                                                {/* Actions */}
                                                <button
                                                  className="p-2 hover:bg-gray-100 rounded"
                                                  onClick={() => setEditingItem(item)}
                                                >
                                                  <Pencil size={20} />
                                                </button>
                                                <button
                                                  className="p-2 hover:bg-red-50 rounded text-red-600"
                                                  onClick={() => {
                                                    setItemToDelete(item);
                                                    setShowDelete(true);
                                                  }}
                                                >
                                                  <Trash2 size={20} />
                                                </button>
                                                {/* <button className="p-2 hover:bg-gray-100 rounded">
                                            <MoreHorizontal className="w-4 h-4" />
                                          </button> */}
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </SortableItem>
                                    );
                                  })}
                                </SortableContext>
                              </DndContext>
                            </div>
                          )}
                        </div>
                      )}
                    </SortableCategory>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}

      {activeTab === "modifiers" && <ModifiersManager />}

      {editingItem && (
        <EditItemModal
          item={editingItem._id ? editingItem : null}
          defaultCategory={editingItem.category}
          allModifierGroups={modifierGroups}
          onClose={() => setEditingItem(null)}
          onSaved={() => {
            setEditingItem(null);
          }}
        />
      )}
      {itemToDelete && (
        <ConfirmDeleteModal
          open={showDelete}
          title="Delete menu item"
          description={`Delete "${itemToDelete.name}"? This action cannot be undone.`}
          loading={deleting}
          onClose={() => setShowDelete(false)}
          onConfirm={async () => {
            setDeleting(true);
            try {
              await dispatch(
                deleteMenuItem({
                  id: itemToDelete._id,
                  token: session.jwt,
                }),
              ).unwrap();

              toast.success("Item deleted");
              setShowDelete(false);
            } catch {
              toast.error("Delete failed");
            } finally {
              setDeleting(false);
            }
          }}
        />
      )}

      {showNewCategory && (
        <NewCategoryModal
          onClose={() => setShowNewCategory(false)}
          onCreated={() => dispatch(fetchAdminCategories(session?.jwt))}
        />
      )}

      {editingCategory && (
        <NewCategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onCreated={() => {}}
        />
      )}

      {categoryToDelete && (
        <ConfirmDeleteModal
          open={!!categoryToDelete}
          title="Delete category"
          description={`Delete "${categoryToDelete.name}"? Remove all the items before you can delete the category.`}
          loading={deletingCategory}
          onClose={() => setCategoryToDelete(null)}
          onConfirm={async () => {
            setDeletingCategory(true);
            try {
              await dispatch(
                deleteCategory({
                  id: categoryToDelete._id,
                  token: session.jwt,
                }),
              ).unwrap();

              toast.success("Category deleted");
              setCategoryToDelete(null);
            } catch (err) {
              toast.error(err || "Delete failed");
            } finally {
              setDeletingCategory(false);
            }
          }}
        />
      )}
    </div>
  );
}
