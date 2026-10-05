"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import ModifierOptionList from "./ModifierOptionList";
import { useSession } from "next-auth/react";
import { useDispatch } from "react-redux";
import { upsertModifierGroup } from "@/store/modifierSlice";
import { toast } from "react-toastify";

export default function ModifierGroupEditorModal({ group, onClose }) {
  const { data: session } = useSession();
  const dispatch = useDispatch();

  const [form, setForm] = useState(() => ({
    _id: group?._id,
    title: group?.title || "",
    order: group?.order ?? 0,
    required: group?.required ?? false,
    min: group?.min ?? 0,
    max: group?.max ?? 1,
    displayType: group?.displayType || "checkbox",
    isActive: group?.isActive ?? true,
    options: group?.options || [],
  }));

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!group) return;

    setForm({
      _id: group._id,
      title: group.title || "",
      order: group.order ?? 0,
      required: group.required ?? false,
      min: group.min ?? 0,
      max: group.max ?? 1,
      displayType: group.displayType || "checkbox",
      isActive: group.isActive ?? true,
      options: (group.options || []).map((opt) => ({
        ...opt,
        _cid: opt._cid || crypto.randomUUID(), // 👈 ensure fallback
      })),
    });
  }, [group]);

  /* ---------------- VALIDATION ---------------- */
  const validateGroup = () => {
    if (!form.title.trim()) return "Title required";

    if (form.required && form.min === 0)
      return "Required group must have min ≥ 1";

    if (form.displayType === "radio" && (form.min !== 1 || form.max !== 1))
      return "Radio groups must have min=1 and max=1";

    if (form.max < form.min) return "Max must be ≥ min";

    return null;
  };

  /* ---------------- SAVE ---------------- */
  const saveGroup = async () => {
    const error = validateGroup();
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        order: Number(form.order) || 0,

        // 🔑 enforce option order by index
        options: form.options.map((opt, idx) => ({
          name: opt.name,
          price: Number(opt.price) || 0,
          image: opt.image || "",
          order: idx,
          isActive: opt.isActive !== undefined ? opt.isActive : true,
        })),
      };

      await dispatch(
        upsertModifierGroup({
          data: payload,
          token: session.jwt,
        }),
      ).unwrap();

      toast.success("Modifier saved");
      onClose();
    } catch (err) {
      toast.error(err || "Failed to save modifier");
    } finally {
      setSaving(false);
    }
  };

  const addOption = () => {
    setForm((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        {
          _cid: crypto.randomUUID(),
          name: "",
          price: 0,
          image: "",
          order: prev.options.length, // temporary, final order enforced on save
          isActive: true,
        },
      ],
    }));
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl px-2 md:px-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center sticky top-0 bg-white z-10 py-2">
          <h2 className="text-lg font-bold">
            {form._id ? "Edit Modifier" : "New Modifier"}
          </h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500 font-medium">
            Modifier Name
          </label>
          <input
            className="w-full input p-2 border rounded"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Modifier Name"
          />
        </div>

        {/* Flags & Display type */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.required}
              onChange={(e) => setForm({ ...form, required: e.target.checked })}
            />
            Required
          </label>

          {/* Min */}
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Min</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    min: Math.max(0, p.min - 1),
                  }))
                }
                className="px-2 py-1 bg-gray-200 rounded"
              >
                -
              </button>
              <span className="w-8 text-center">{form.min}</span>
              <button
                type="button"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    min: Math.min(p.max || Infinity, p.min + 1),
                  }))
                }
                className="px-2 py-1 bg-gray-200 rounded"
              >
                +
              </button>
            </div>
          </div>

          {/* Max */}
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Max</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    max: Math.max(p.min, p.max - 1),
                  }))
                }
                className="px-2 py-1 bg-gray-200 rounded"
              >
                -
              </button>
              <span className="w-8 text-center">{form.max}</span>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, max: p.max + 1 }))}
                className="px-2 py-1 bg-gray-200 rounded"
              >
                +
              </button>
            </div>
          </div>

          {/* Display type */}
          <select
            value={form.displayType}
            onChange={(e) => setForm({ ...form, displayType: e.target.value })}
            className="input p-2 border rounded"
          >
            <option value="radio">Radio</option>
            <option value="checkbox">Checkbox</option>
          </select>
        </div>

        <div className="flex justify-between items-center mt-4 border-t pt-4">
          <h3 className="font-semibold text-gray-700">Options</h3>
          <button
            type="button"
            onClick={addOption}
            className="px-3 py-1 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90"
          >
            + Add Option
          </button>
        </div>

        {/* Options */}
        <ModifierOptionList
          options={form.options}
          onChange={(options) => setForm({ ...form, options })}
          showImage
        />

        {/* Footer */}
        <div className="flex justify-end gap-3 sticky bottom-0 bg-white z-10 py-2 mt-4">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={saveGroup}
            disabled={saving}
            className="flex gap-2 items-center px-3 py-1 btn-primary font-bold bg-primary text-white rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
