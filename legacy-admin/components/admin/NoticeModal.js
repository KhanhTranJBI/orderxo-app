"use client";

import { Loader2, X } from "lucide-react";
import { useState } from "react";

export default function NoticeModal({
  notice,
  onClose,
  onSave,
  loading = false,
}) {
  const [key, setKey] = useState(notice?.key || "");
  const [message, setMessage] = useState(notice?.message || "");
  const [isActive, setIsActive] = useState(notice?.isActive ?? true);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl px-2 md:px-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center sticky top-0 bg-white z-10 py-2">
          <h2 className="font-bold text-lg">
            {notice ? "Edit Notice" : "New Notice"}
          </h2>

          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500 font-medium">Key</label>
          <input
            className={`w-full input border p-2 rounded`}
            placeholder="Key (e.g. top-banner)"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500 font-medium">
            HTML Message
          </label>
          <textarea
            className="w-full input h-40 border p-2 rounded"
            placeholder="HTML message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Active
        </label>

        <div className="flex justify-end gap-3 sticky bottom-0 bg-white py-2">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={() => onSave({ key, message, isActive })}
            className="flex gap-2 items-center px-3 py-1 btn-primary font-bold bg-primary text-white rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
