"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
export default function GoogleComplete() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  useEffect(() => {
    const next = params.get("next") || "/dashboard";
    const safeNext =
      next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/dashboard";
    fetch("/api/owner/auth/google-complete", { method: "POST" })
      .then(async (r) => {
        if (!r.ok) throw Error("Could not finish Google sign-in");
        router.replace(safeNext);
        router.refresh();
      })
      .catch((e) => setError(e.message));
  }, [params, router]);
  return <main className="mx-auto max-w-md p-8">{error || "Finishing Google sign-in…"}</main>;
}
