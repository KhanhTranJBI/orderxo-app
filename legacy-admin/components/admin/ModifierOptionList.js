"use client";

import { GripVertical, Trash2 } from "lucide-react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableOption({ option, onChange, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: option._id || option._cid,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const preview =
    option.image instanceof File ? URL.createObjectURL(option.image) : option.image || null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`
    border rounded-xl bg-white
    flex flex-col gap-3
    p-3
    sm:grid sm:grid-cols-[auto_auto_1fr_auto] sm:gap-3 sm:items-center
    ${option.isActive ? "" : "opacity-60"}
  `}
    >
      {/* Drag handle */}
      <div {...listeners} className="cursor-grab text-gray-400 p-2 touch-manipulation">
        <GripVertical size={18} />
      </div>

      {/* Image */}
      <div
        className="
    w-12 h-12 sm:w-14 sm:h-14
    rounded-md border
    flex items-center justify-center
    overflow-hidden bg-gray-50 shrink-0 hidden md:block
  "
      >
        {preview ? (
          <img src={preview} alt={option.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[10px] sm:text-xs text-gray-400 text-center leading-tight px-1 w-full flex items-center justify-center h-full">
            No Image
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 min-w-0">
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="text-xs sm:text-sm text-gray-500 font-medium">Name</label>
          <input
            className="input p-2 border rounded text-sm sm:text-base"
            value={option.name}
            onChange={(e) => onChange({ ...option, name: e.target.value })}
            placeholder="Option name"
          />
        </div>

        {/* Image URL */}
        <div className="flex flex-col gap-1">
          <label className="text-xs sm:text-sm text-gray-500 font-medium">Image URL</label>
          <input
            type="text"
            value={option.image || ""}
            onChange={(e) => onChange({ ...option, image: e.target.value })}
            placeholder="https://example.com/image.jpg"
            className="input p-2 border rounded text-sm sm:text-base"
          />
        </div>
      </div>

      <div className="flex flex-row items-center gap-2 sm:gap-3">
        {/* Image */}
        <div
          className="
    w-12 h-12 sm:w-14 sm:h-14
    rounded-md border
    flex items-center justify-center
    overflow-hidden bg-gray-50 shrink-0 block md:hidden
  "
        >
          {preview ? (
            <img src={preview} alt={option.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] sm:text-xs text-gray-400 text-center leading-tight px-1 w-full flex items-center justify-center h-full">
              No Image
            </span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center gap-1 p-2 border rounded">
          <span className="text-orange-700 font-semibold text-sm sm:text-base">$</span>
          <input
            type="number"
            className="
        w-20 sm:w-24
        input text-right
        font-semibold text-orange-700
        text-sm sm:text-base p-2 border rounded
      "
            value={option.price}
            onChange={(e) => onChange({ ...option, price: Number(e.target.value) })}
          />
        </div>

        {/* Active Toggle */}
        <button
          type="button"
          onClick={() => onChange({ ...option, isActive: !option.isActive })}
          className={`px-2 py-1 rounded text-xs font-semibold ${
            option.isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"
          }`}
        >
          {option.isActive ? "Active" : "Hidden"}
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={() => onRemove(option)}
          className="text-red-500 hover:text-red-700 p-2"
          title="Remove option"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

export default function ModifierOptionList({ options, onChange, showImage }) {
  const getId = (o) => o._id || o._cid;

  const handleOptionChange = (updatedOption) => {
    onChange(options.map((opt) => (getId(opt) === getId(updatedOption) ? updatedOption : opt)));
  };

  const handleRemove = (optionToRemove) => {
    onChange(
      options
        .filter((opt) => getId(opt) !== getId(optionToRemove))
        .map((opt, i) => ({ ...opt, order: i })), // reindex
    );
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return;

        const oldIndex = options.findIndex((o) => getId(o) === active.id);
        const newIndex = options.findIndex((o) => getId(o) === over.id);

        onChange(
          arrayMove(options, oldIndex, newIndex).map((opt, i) => ({
            ...opt,
            order: i,
          })),
        );
      }}
    >
      <SortableContext items={options.map(getId)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {options.map((opt) => (
            <SortableOption
              key={getId(opt)}
              option={opt}
              onChange={handleOptionChange}
              onRemove={handleRemove}
              showImage={showImage}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
