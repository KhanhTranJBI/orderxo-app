"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OwnerShell from "../../../components/OwnerShell";
export default function Page() {
  const router = useRouter();
  const params = useSearchParams();
  const started = useRef(false);
  const [error, setError] = useState("");
  const token = params.get("token") || "";
  const next = params.get("next") || "/dashboard";
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      setError("This sign-in link is invalid.");
      return;
    }
    fetch("/api/owner/auth/verify-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, next }),
    })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "Unable to sign in");
        router.replace(d.next || "/dashboard");
        router.refresh();
      })
      .catch((e) => setError(e.message));
  }, [token, next, router]);
  return (
    <OwnerShell title="Signing you in" description="We're securely verifying your one-time link.">
      {error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      ) : (
        <p className="text-slate-700">Verifying your email…</p>
      )}
    </OwnerShell>
  );
}
