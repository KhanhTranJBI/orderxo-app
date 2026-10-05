"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, GripVertical, Pencil, Trash2, Loader2 } from "lucide-react";
import clsx from "clsx";
import { useDispatch, useSelector } from "react-redux";
import { createMenuItem, updateMenuItem } from "@/store/menuSlice";
import ModifierGroupEditorModal from "./ModifierGroupEditorModal";
import { useSession } from "next-auth/react";

import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "react-toastify";

function SortableRow({ group, onEdit, onRemove }) {
  if (!group?.group?._id) return null;

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: group.group._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="border rounded-lg p-3 flex items-center justify-between bg-white"
    >
      <div className="flex items-center gap-3">
        <div {...listeners} className="cursor-grab text-gray-400">
          <GripVertical size={16} />
        </div>

        <span className="font-medium">{group.group.title}</span>

        {group.group.required && (
          <span className="text-xs text-red-500">Required</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* EDIT */}
        <button onClick={() => onEdit(group.group)}>
          <Pencil size={18} />
        </button>

        {/* REMOVE */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(group.group._id);
          }}
          className="text-red-500 hover:text-red-700"
          title="Remove from item"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

export default function EditItemModal({
  item,
  defaultCategory,
  onClose,
  onSaved,
}) {
  const isCreate = !item;

  const dispatch = useDispatch();
  const { data: session } = useSession();

  const originalRef = useRef(null);

  const modifierGroupsById = useSelector((s) => s.modifiers.all);

  /** 🧠 LOCAL STATE */
  const [form, setForm] = useState(() => {
    if (item) {
      return {
        ...item,
        modifierGroups: [],
      };
    }

    return {
      name: "",
      price: 0,
      description: "",
      image: "",
      bestSeller: false,
      newItem: false,
      isActive: true,
      category: defaultCategory || null,
      modifierGroups: [],
    };
  });

  const [editingGroup, setEditingGroup] = useState(null);
  const [saving, setSaving] = useState(false);

  const modifierListRef = useRef(null);

  const attachedGroupIds = new Set(form.modifierGroups.map((g) => g.group._id));

  const availableGroups = Object.values(modifierGroupsById)
    .filter((g) => !attachedGroupIds.has(g._id))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const [search, setSearch] = useState("");

  const filteredAvailable = availableGroups.filter((g) =>
    g.title.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    if (!item?.modifierGroups?.length) {
      const emptyForm = { ...form, modifierGroups: [] };
      setForm(emptyForm);
      originalRef.current = JSON.stringify(emptyForm);
      return;
    }

    const normalized = item.modifierGroups
      .map((mg, i) => {
        const groupId = mg?.group?._id || mg?.group || mg?._id || mg;
        const group = modifierGroupsById[groupId];
        if (!group) return null;

        return { group, order: mg.order ?? i };
      })
      .filter(Boolean)
      .sort((a, b) => a.order - b.order);

    const loadedForm = {
      ...item,
      modifierGroups: normalized,
    };

    setForm(loadedForm);
    originalRef.current = JSON.stringify(loadedForm);
  }, [item, modifierGroupsById]);

  useEffect(() => {
    if (!item) {
      originalRef.current = JSON.stringify(form);
    }
  }, []);

  const isDirty = useMemo(() => {
    if (!originalRef.current) return false;
    return JSON.stringify(form) !== originalRef.current;
  }, [form]);

  const addModifierGroup = (group) => {
    setForm((prev) => ({
      ...prev,
      modifierGroups: [
        ...prev.modifierGroups,
        {
          group,
          order: prev.modifierGroups.length,
        },
      ],
    }));

    // ✅ scroll AFTER state update & render
    requestAnimationFrame(() => {
      modifierListRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const removeModifierGroup = (groupId) => {
    setForm((prev) => {
      const filtered = prev.modifierGroups
        .filter((g) => g.group._id !== groupId)
        .map((g, i) => ({ ...g, order: i })); // reindex order

      return { ...prev, modifierGroups: filtered };
    });
  };

  /** 🔀 DND */
  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    setForm((prev) => {
      const oldIndex = prev.modifierGroups.findIndex(
        (g) => g.group._id === active.id,
      );
      const newIndex = prev.modifierGroups.findIndex(
        (g) => g.group._id === over.id,
      );

      const reordered = arrayMove(prev.modifierGroups, oldIndex, newIndex).map(
        (g, i) => ({ ...g, order: i }),
      );

      return { ...prev, modifierGroups: reordered };
    });
  };

  /** 💾 SAVE */
  const saveItem = async () => {
    setSaving(true);

    const payload = {
      name: form.name,
      price: form.price,
      description: form.description,
      image: form.image,
      bestSeller: form.bestSeller,
      newItem: form.newItem,
      isActive: form.isActive,
      categoryId: form.category,
      modifierGroups: form.modifierGroups.map((g) => ({
        group: g.group._id,
        order: g.order,
      })),
    };

    try {
      if (isCreate) {
        const res = await dispatch(
          createMenuItem({
            data: payload,
            token: session.jwt,
          }),
        ).unwrap();

        toast.success("Menu item created");

        // 🆕 If backend returns created item, update form with real DB values
        if (res?._id) {
          const updatedForm = { ...form, _id: res._id };
          setForm(updatedForm);
          originalRef.current = JSON.stringify(updatedForm);
        }
      } else {
        await dispatch(
          updateMenuItem({
            menuItemId: item._id,
            data: payload,
            token: session.jwt,
          }),
        ).unwrap();

        toast.success("Menu item updated");

        // ✅ Reset dirty tracking baseline
        originalRef.current = JSON.stringify(form);
      }

      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err || "Failed to save menu item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white w-full max-w-4xl rounded-2xl px-2 md:px-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center sticky top-0 bg-white z-10 py-2">
          <h2 className="text-xl font-bold">
            {isCreate ? "New Menu Item" : "Edit Menu Item"}
          </h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* Basic Info */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Image */}
          <div className="w-full md:w-48 h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
            {form.image ? (
              <img
                src={form.image}
                alt={form.name}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-gray-400">No Image</span>
            )}
          </div>

          {/* Name, Price, Description */}
          <div className="flex-1 flex flex-col gap-3">
            {/* Name */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-500 font-medium">
                Item Name
              </label>
              <input
                className="input text-xl font-bold p-2 border rounded"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Item Name"
              />
            </div>

            {/* Price */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-500 font-medium">Price</label>
              <div className="flex items-center gap-1 p-2 border rounded">
                <span className="text-orange-700 font-semibold text-sm sm:text-base">
                  $
                </span>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                  className="input w-32 text-right font-semibold text-orange-700 p-2 border rounded"
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-500 font-medium">
                Description
              </label>
              <textarea
                className="input min-h-[80px] resize-y bg-gray-50 p-2 border rounded"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Description"
              />
            </div>

            {/* Image URL */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-500 font-medium">
                Image URL
              </label>
              <input
                type="text"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="input p-2 border rounded"
              />
            </div>

            {/* Flags */}
            <div className="flex gap-4 mt-1">
              <button
                type="button"
                className={clsx(
                  "px-3 py-1 rounded-full font-medium transition",
                  form.bestSeller
                    ? "bg-orange-100 text-orange-700"
                    : "bg-gray-200 text-gray-500",
                )}
                onClick={() =>
                  setForm((prev) => ({ ...prev, bestSeller: !prev.bestSeller }))
                }
              >
                Best Seller
              </button>

              <button
                type="button"
                className={clsx(
                  "px-3 py-1 rounded-full font-medium transition",
                  form.newItem
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-200 text-gray-500",
                )}
                onClick={() =>
                  setForm((prev) => ({ ...prev, newItem: !prev.newItem }))
                }
              >
                New
              </button>

              <button
                type="button"
                className={clsx(
                  "px-3 py-1 rounded-full font-medium transition",
                  form.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700",
                )}
                onClick={() =>
                  setForm((prev) => ({ ...prev, isActive: !prev.isActive }))
                }
              >
                {form.isActive ? "Active" : "Inactive"}
              </button>
            </div>
          </div>
        </div>

        {/* Modifiers */}
        <div ref={modifierListRef}>
          <h3 className="font-semibold mb-2">Modifiers</h3>

          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext
              items={form.modifierGroups.map((g) => g.group._id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {form.modifierGroups.map((g) => (
                  <SortableRow
                    key={g.group._id}
                    group={g}
                    onEdit={setEditingGroup}
                    onRemove={removeModifierGroup}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Available Modifiers */}

        {filteredAvailable.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <div className="flex justify-between">
              <h4 className="font-semibold mb-2 text-gray-600">
                Available Modifiers
              </h4>
              <button
                onClick={() => setEditingGroup({})}
                className="mb-3 px-3 py-1 rounded-full bg-primary hover:bg-primary/90 text-white text-sm font-semibold"
              >
                + Add Modifier
              </button>
            </div>

            {/* Search */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search modifiers..."
              className="input w-full mb-3 p-2 border rounded"
            />

            <div className="space-y-2">
              {filteredAvailable.map((group) => (
                <div
                  key={group._id}
                  className="flex items-center justify-between border rounded-lg px-3 py-2 bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{group.title}</span>
                    {group.required && (
                      <span className="text-xs text-red-500">Required</span>
                    )}
                  </div>

                  <button
                    onClick={() => addModifierGroup(group)}
                    className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-700 hover:bg-green-200"
                  >
                    + Add
                  </button>
                </div>
              ))}

              {filteredAvailable.length === 0 && (
                <div className="text-sm text-gray-400 italic">
                  No modifiers found
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 sticky bottom-0 bg-white py-2">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={saveItem}
            disabled={!isDirty || saving}
            className={clsx(
              "flex gap-2 items-center px-3 py-1 font-bold rounded-xl transition-all shadow-lg",
              isDirty
                ? "bg-primary text-white hover:bg-primary/90 active:scale-[0.98]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed",
            )}
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {!item ? "Add Item" : "Save Item"}
          </button>
        </div>
      </div>

      {editingGroup && (
        <ModifierGroupEditorModal
          group={editingGroup}
          onClose={() => setEditingGroup(null)}
        />
      )}
    </div>
  );
}
