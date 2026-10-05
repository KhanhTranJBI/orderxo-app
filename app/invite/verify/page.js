"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OwnerShell from "../../../components/OwnerShell";

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const started = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!token) {
      setError("This verification link is invalid.");
      return;
    }

    fetch("/api/owner/invitations/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "Unable to verify this link");
        router.replace(data.next || "/onboarding");
        router.refresh();
      })
      .catch((e) => setError(e.message));
  }, [router, token]);

  return (
    <OwnerShell
      title="Verifying your invitation"
      description="We’re securely activating your OrderXO owner access."
    >
      {error ? (
        <div className="space-y-4">
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
          <p className="text-sm text-slate-600">
            Return to your original restaurant invitation and request a new verification link.
          </p>
        </div>
      ) : (
        <p className="text-slate-700" role="status">
          Verifying your email and preparing your restaurant workspace…
        </p>
      )}
    </OwnerShell>
  );
}
