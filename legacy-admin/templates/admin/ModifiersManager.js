"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, X, Search, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { deleteModifierGroup } from "@/store/modifierSlice";
import { toast } from "react-toastify";

import ModifierGroupEditorModal from "@/components/admin/ModifierGroupEditorModal";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import { useSession } from "next-auth/react";

export default function ModifiersManager() {
  const { data: session } = useSession();

  const dispatch = useDispatch();

  const [editingGroup, setEditingGroup] = useState(null);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [query, setQuery] = useState("");

  // Track which modifier groups have their menu items expanded
  const [expandedGroups, setExpandedGroups] = useState({});

  const modifierGroups = useSelector((s) =>
    Object.values(s.modifiers.all)
      .filter((g) => (query ? g.title?.toLowerCase().includes(query.toLowerCase()) : true))
      .sort((a, b) => a.order - b.order),
  );

  /* ---------------- TOGGLE USED ITEMS ---------------- */
  const toggleUsedItems = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async () => {
    if (!groupToDelete) return;

    /*
     * Extra client-side protection.
     *
     * The DELETE API also checks the database, so deletion
     * is still protected if the frontend data is stale.
     */
    if ((groupToDelete.usedByItemCount || 0) > 0) {
      toast.error(
        `"${groupToDelete.title}" is used by ${groupToDelete.usedByItemCount} menu item${
          groupToDelete.usedByItemCount === 1 ? "" : "s"
        } and cannot be deleted.`,
      );

      setGroupToDelete(null);
      return;
    }

    setDeleting(true);

    try {
      await dispatch(
        deleteModifierGroup({
          id: groupToDelete._id,
          token: session.jwt,
        }),
      ).unwrap();

      toast.success("Modifier deleted");
      setGroupToDelete(null);
    } catch (error) {
      if (error?.usedByItemCount > 0) {
        toast.error(
          `"${groupToDelete.title}" is used by ${error.usedByItemCount} menu item${
            error.usedByItemCount === 1 ? "" : "s"
          } and cannot be deleted.`,
        );
      } else {
        toast.error(error?.error || error?.message || error || "Delete failed");
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Header */}{" "}
      <div className="flex items-center justify-between mb-4">
        {" "}
        <h2 className="text-xl font-bold">Modifiers</h2>
        <button
          onClick={() => setEditingGroup({})}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90"
        >
          <Plus size={16} />
          Add Modifier
        </button>
      </div>
      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search modifiers"
          className="pl-9 pr-9 py-2 w-full border rounded-lg"
        />

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
      {/* Modifier Groups */}
      <div className="space-y-4">
        {modifierGroups.map((group) => {
          const usedByItemCount = group.usedByItemCount || 0;
          const usedByItems = group.usedByItems || [];

          const isUsed = usedByItemCount > 0;
          const isExpanded = !!expandedGroups[group._id];

          return (
            <div key={group._id} className="bg-white border rounded-xl p-4">
              {/* Top Row */}
              <div className="flex justify-between items-center">
                {/* Group Info */}
                <div className="min-w-0">
                  <div className="font-semibold">{group.title}</div>

                  <div className="text-sm text-gray-500">
                    {group.options?.length || 0} options ·{" "}
                    {group.required ? "Required" : "Optional"}
                  </div>

                  {/* Usage Count */}
                  {isUsed ? (
                    <div className="text-sm text-amber-600 mt-1">
                      Used by {usedByItemCount} menu item
                      {usedByItemCount === 1 ? "" : "s"}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 mt-1">Not used by any menu item</div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-4 shrink-0">
                  {/* Edit */}
                  <button
                    className="p-2 hover:bg-gray-100 rounded"
                    onClick={() => setEditingGroup(group)}
                    title="Edit group"
                  >
                    <Pencil size={20} />
                  </button>

                  {/* Delete */}
                  <button
                    className={`p-2 rounded ${
                      isUsed ? "text-gray-300 cursor-not-allowed" : "text-red-600 hover:bg-red-50"
                    }`}
                    onClick={() => {
                      if (isUsed) {
                        toast.info(
                          `"${group.title}" is used by ${usedByItemCount} menu item${
                            usedByItemCount === 1 ? "" : "s"
                          } and cannot be deleted.`,
                        );
                        return;
                      }

                      setGroupToDelete(group);
                    }}
                    disabled={isUsed}
                    title={
                      isUsed
                        ? `Used by ${usedByItemCount} menu item${usedByItemCount === 1 ? "" : "s"}`
                        : "Delete group"
                    }
                  >
                    {isUsed ? <Lock size={20} /> : <Trash2 size={20} />}
                  </button>
                </div>
              </div>

              {/* Used Menu Items */}
              {isUsed && (
                <div className="mt-3 border-t pt-3">
                  <button
                    type="button"
                    onClick={() => toggleUsedItems(group._id)}
                    className="
                  flex items-center gap-2
                  text-sm font-medium
                  text-gray-600
                  hover:text-gray-900
                "
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}

                    {isExpanded ? "Hide menu items" : "Show menu items"}
                  </button>

                  {isExpanded && (
                    <div className="mt-3">
                      <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                        Used by
                      </div>

                      <div className="space-y-1">
                        {usedByItems.map((item) => (
                          <div
                            key={item._id}
                            className="
                          flex items-center
                          px-3 py-2
                          bg-gray-50
                          rounded-lg
                          text-sm
                        "
                          >
                            <span className="text-gray-700">{item.name}</span>
                          </div>
                        ))}
                      </div>

                      {usedByItems.length === 0 && (
                        <div className="text-sm text-gray-400">No menu items found.</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* EDIT / CREATE MODAL */}
      {editingGroup && (
        <ModifierGroupEditorModal
          group={editingGroup._id ? editingGroup : null}
          onClose={() => setEditingGroup(null)}
        />
      )}
      {/* DELETE CONFIRM MODAL */}
      <ConfirmDeleteModal
        open={!!groupToDelete}
        title="Delete modifier"
        description={groupToDelete ? `Delete "${groupToDelete.title}"? This cannot be undone.` : ""}
        confirmText="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setGroupToDelete(null)}
      />
    </div>
  );
}
