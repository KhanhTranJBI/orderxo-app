"use client";

import { useEffect, useState } from "react";

export default function InvitationAccept({ token }) {
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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
      if (!r.ok) throw new Error(d.error || "Unable to accept invitation");

      setEmailSent(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (emailSent) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <h2 className="text-lg font-semibold text-green-900">Check your email</h2>
          <p className="mt-2 text-sm text-green-800">
            We sent a secure one-time link to <strong>{invite?.email}</strong>. Open that link to
            verify your email, activate your owner access, and continue setting up your restaurant.
          </p>
        </div>
        <p className="text-sm text-slate-500">
          You can close this page after the email arrives. For security, the link expires after a
          short time and can only be used once.
        </p>
        <button
          type="button"
          onClick={accept}
          disabled={busy}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 disabled:opacity-60"
        >
          {busy ? "Sending…" : "Send a new link"}
        </button>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    );
  }

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
            {busy ? "Sending secure link…" : "Accept Invitation & Get Started"}
          </button>

          <p className="text-sm text-slate-600">
            No password is required. We&apos;ll send a secure one-time verification link to{" "}
            {invite.email}.
          </p>
        </>
      )}
    </div>
  );
}
