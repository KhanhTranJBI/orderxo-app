"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import OwnerForm from "./OwnerForm";
export default function VerifyEmail({ token }) {
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [state, setState] = useState(
    token ? "Verifying your email…" : "Check your inbox for a verification link.",
  );
  useEffect(() => {
    if (!token) return;
    fetch("/api/owner/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (r) => {
        const d = await r.json();
        setState(r.ok ? "Email verified! You can sign in." : d.error || "Verification failed.");
      })
      .catch(() => setState("Verification service unavailable."));
  }, [token]);
  return (
    <>
      <p className="mb-6 text-slate-700" role="status">
        {state}
      </p>
      <Link className="text-orange-700 underline" href={`/login?next=${encodeURIComponent(next)}`}>
        Go to login
      </Link>
      <div className="mt-8 border-t pt-6">
        <h2 className="mb-3 font-semibold">Need a new verification link?</h2>
        <OwnerForm mode="resend" />
      </div>
    </>
  );
}
