"use client";

import { deleteHeroSlide, reorderHeroSlides } from "@/store/heroSlidesSlice";

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import HeroSlideModal from "./HeroSlideModal";
import { toast } from "react-toastify";

function SortableSlide({ slide, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: slide._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 bg-white border rounded-xl p-3"
      {...attributes}
    >
      <div {...listeners} className="cursor-grab text-gray-400">
        <GripVertical size={18} />
      </div>

      <img src={slide.image} alt={slide.title} className="w-24 h-16 object-cover rounded-md" />

      <div className="flex-1">
        <div className="font-semibold">{slide.title}</div>
        <div className="text-gray-500">{slide.subtitle}</div>
      </div>

      <button onClick={() => onEdit(slide)}>
        <Pencil size={18} />
      </button>

      <button onClick={() => onDelete(slide)} className="text-red-500">
        <Trash2 size={18} />
      </button>
    </div>
  );
}

export default function HeroSlidesManager({ session, slides }) {
  const dispatch = useDispatch();
  const sensors = useSensors(useSensor(PointerSensor));

  const [items, setItems] = useState([]);

  // modals
  const [editingSlide, setEditingSlide] = useState(null);
  const [deletingSlide, setDeletingSlide] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setItems(slides);
  }, [slides]);

  // ------------------------
  // Drag reorder
  // ------------------------
  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((s) => s._id === active.id);
    const newIndex = items.findIndex((s) => s._id === over.id);

    const reordered = arrayMove(items, oldIndex, newIndex).map((s, i) => ({
      _id: s._id,
      order: i,
    }));

    setItems((prev) =>
      arrayMove(prev, oldIndex, newIndex).map((s, i) => ({
        ...s,
        order: i,
      })),
    );

    try {
      await dispatch(
        reorderHeroSlides({
          slides: reordered,
          token: session.jwt,
        }),
      );
      toast.success("Hero slides reordered successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to reorder hero slides");

      // Optional: revert UI if API fails
      setItems(slides);
    }
  };

  // ------------------------
  // Delete
  // ------------------------
  const confirmDelete = async () => {
    if (!deletingSlide) return;

    try {
      setDeleteLoading(true);

      await dispatch(
        deleteHeroSlide({
          id: deletingSlide._id,
          token: session.jwt,
        }),
      ).unwrap();

      setDeletingSlide(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-5xl mx-auto p-0 md:p-6">
        <div className="flex justify-between items-center pb-6">
          <h1 className="text-2xl font-bold">Hero Slides</h1>

          <button
            onClick={() => setShowCreate(true)}
            className="flex gap-2 items-center px-3 py-1 bg-primary text-white rounded-xl"
          >
            <Plus className="w-4 h-4" />
            Add Slide
          </button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((s) => s._id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {items.map((slide) => (
                <SortableSlide
                  key={slide._id}
                  slide={slide}
                  onEdit={setEditingSlide}
                  onDelete={setDeletingSlide}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* CREATE */}
      {showCreate && (
        <HeroSlideModal onClose={() => setShowCreate(false)} onSaved={() => setShowCreate(false)} />
      )}

      {/* EDIT */}
      {editingSlide && (
        <HeroSlideModal
          slide={editingSlide}
          onClose={() => setEditingSlide(null)}
          onSaved={() => setEditingSlide(null)}
        />
      )}

      {/* DELETE CONFIRM */}
      <ConfirmDeleteModal
        open={!!deletingSlide}
        title="Delete hero slide"
        description={`This slide, "${deletingSlide?.title}", will be permanently removed.`}
        loading={deleteLoading}
        onClose={() => setDeletingSlide(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
