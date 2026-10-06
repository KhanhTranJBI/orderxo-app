import { createCategory, updateCategory } from "@/store/categoryAdminSlice";
import { Loader2, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

export default function NewCategoryModal({ onClose, onCreated, category = null }) {
  const [name, setName] = useState(category?.name || "");
  const [slug, setSlug] = useState(category?.slug || "");
  const [slugTouched, setSlugTouched] = useState(!!category);
  const [image, setImage] = useState(category?.image || "");
  const [isActive, setIsActive] = useState(category?.isActive); // New state for active status

  const slugify = (text) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const dispatch = useDispatch();
  const { data: session } = useSession();
  const [creating, setCreating] = useState(false);

  const handleNameChange = (value) => {
    setName(value);

    if (!slugTouched) {
      setSlug(slugify(value));
    }
  };

  const handleSlugChange = (value) => {
    setSlugTouched(true);
    setSlug(slugify(value));
  };

  const save = async () => {
    if (!name.trim()) return;

    try {
      setCreating(true);

      const categoryData = {
        name: name.trim(),
        slug: slug.trim(),
        image: image.trim(),
        isActive, // Include isActive in the category data
      };

      if (category) {
        // ✏️ EDIT
        await dispatch(
          updateCategory({
            data: { ...categoryData, id: category._id },
            token: session.jwt,
          }),
        ).unwrap();

        toast.success("Category updated");
      } else {
        // ➕ CREATE
        categoryData.isActive = true;
        await dispatch(
          createCategory({
            data: categoryData,
            token: session.jwt,
          }),
        ).unwrap();

        toast.success("Category created");
      }

      onCreated?.();
      onClose();
    } catch {
      toast.error(category ? "Failed to update category" : "Failed to create category");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl px-2 md:px-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center sticky top-0 bg-white z-10 py-2">
          <h2 className="font-bold text-lg">{category ? "Edit Category" : "New Category"}</h2>

          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500 font-medium">Category Name</label>
          <input
            className="w-full input p-2 border rounded"
            placeholder="Category Name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500 font-medium">Slug</label>
          <input
            className="w-full input p-2 border rounded"
            placeholder="Category Slug (e.g. bowls, drinks)"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
          />
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
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] sm:text-xs text-gray-400 text-center leading-tight px-1 w-full flex items-center justify-center h-full">
              No Image
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500 font-medium">Image URL</label>
          <input
            type="text"
            className="w-full input p-2 border rounded"
            placeholder="https://example.com/icon.svg"
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
        </div>

        {/* Active Status */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 font-medium">Is Active</label>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="p-2"
          />
        </div>

        <div className="flex justify-end gap-3 sticky bottom-0 bg-white py-2">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={save}
            className="flex gap-2 items-center px-3 py-1 btn-primary font-bold bg-primary text-white rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg"
          >
            {creating && <Loader2 size={16} className="animate-spin" />}
            {category ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
