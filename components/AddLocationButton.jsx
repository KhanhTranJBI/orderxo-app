"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AddLocationButton({ organizationId }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    const value = name.trim();
    if (!value) return setError("Location name is required");
    setSaving(true);
    setError("");
    try {
      const r = await fetch("/api/owner/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, name: value }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Unable to add location");
      setOpen(false);
      setName("");
      router.refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
      >
        <Plus size={17} /> Add location
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onMouseDown={() => !saving && setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Add location</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add another location for this restaurant.
                </p>
              </div>
              <button
                disabled={saving}
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submit} className="mt-6">
              <label className="text-sm font-semibold text-slate-700">Location name</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Poulsbo"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setOpen(false)}
                  className="rounded-xl border px-4 py-2.5 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  className="rounded-xl bg-orange-600 px-4 py-2.5 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
                >
                  {saving ? "Adding…" : "Add location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
