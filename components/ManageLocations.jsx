"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ownerFetch } from "../lib/ownerFetch";
import toast from "react-toastify";

export default function ManageLocations({ organizationId, locations, owner }) {
  const router = useRouter();
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const activeCount = locations.filter((l) => l.status !== "archived").length;
  async function submit() {
    if (!selected || busy) return;
    setBusy(true);
    try {
      const r = await ownerFetch("/api/owner/locations/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          locationId: String(selected.location._id || selected.location.id),
          action: selected.action,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Unable to update location");
      setSelected(null);
      toast.success(
        `Location ${selected.action === "archive" ? "archived" : "restored"} successfully.`,
      );
      router.refresh();
    } catch (e) {
      toast.error(e.message || "Unable to update location");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {locations.map((l) => (
          <div
            key={String(l._id || l.id)}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-slate-50 px-4 py-3"
          >
            <div>
              <div className="font-semibold text-slate-900">{l.name}</div>
              <div className="text-xs capitalize text-slate-500">{l.status || "active"}</div>
            </div>
            {owner && (
              <div className="flex gap-2">
                {l.status === "archived" ? (
                  <>
                    <button
                      className="rounded-lg border bg-white px-3 py-2 text-sm font-semibold"
                      onClick={() => {
                        setSelected({ location: l, action: "restore" });
                      }}
                    >
                      Restore
                    </button>
                    <button
                      className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700"
                      onClick={() => {
                        setSelected({ location: l, action: "delete" });
                      }}
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <button
                    disabled={activeCount <= 1}
                    className="rounded-lg border bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"
                    onClick={() => {
                      setSelected({ location: l, action: "archive" });
                    }}
                  >
                    Archive
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={() => !busy && setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirm location change"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold capitalize">
              {selected.action} {selected.location.name}?
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              {selected.action === "archive"
                ? "This location will stop accepting new orders and should disappear from public location selection. Existing order history is preserved. Additional-location billing will be reduced, with any Stripe prorations applied according to your subscription."
                : selected.action === "restore"
                  ? "This location will return as inactive until it passes Go-Live checks. Its additional-location subscription charge will resume immediately and may be prorated."
                  : "Permanent deletion is disabled until all linked records can be verified. Keep this location archived to preserve history."}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                disabled={busy}
                className="rounded-xl border px-4 py-2"
                onClick={() => setSelected(null)}
              >
                Cancel
              </button>
              <button
                disabled={busy || selected.action === "delete"}
                className="rounded-xl bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-40"
                onClick={submit}
              >
                {busy ? "Updating…" : `Confirm ${selected.action}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
