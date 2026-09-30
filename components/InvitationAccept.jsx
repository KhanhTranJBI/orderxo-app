"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
export default function InvitationAccept({ token }) {
  const router = useRouter();
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch("/api/owner/invitations/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Invalid invitation");
        setInvite(d.invitation);
      })
      .catch((e) => setError(e.message));
  }, [token]);
  async function accept() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/owner/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const d = await r.json();
      if (r.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
        return;
      }
      if (!r.ok) throw new Error(d.error || "Unable to accept invitation");
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const next = encodeURIComponent(`/invite/${token}`);
  return (
    <div className="space-y-5">
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {!invite && !error && <p>Loading invitation…</p>}
      {invite && (
        <>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2 text-sm">
            <p>
              <strong>Restaurant:</strong> {invite.restaurantName}
            </p>
            <p>
              <strong>Location:</strong> {invite.locationName}
            </p>
            <p>
              <strong>Plan:</strong> {invite.plan}
            </p>
            <p>
              <strong>Invited email:</strong> {invite.email}
            </p>
            <p>
              <strong>Proposed URL:</strong> {invite.restaurantSlug}.orderxo.com
            </p>
            <p className="text-slate-500">Website activation and billing are separate steps.</p>
          </div>
          <button
            onClick={accept}
            disabled={busy}
            className="w-full rounded-xl bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Please wait…" : "Accept Invitation & Get Started"}
          </button>
          <p className="text-sm text-slate-600">
            Not signed in?{" "}
            <Link className="text-orange-700 underline" href={`/login?next=${next}`}>
              Sign in
            </Link>{" "}
            or{" "}
            <Link className="text-orange-700 underline" href={`/signup?next=${next}`}>
              Create an account
            </Link>{" "}
            using {invite.email}.
          </p>
        </>
      )}
    </div>
  );
}
