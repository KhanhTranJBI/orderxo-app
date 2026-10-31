"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// One-time setup link exchange only; staff use the existing Owner Dashboard.
export default function SetupLink() {
  const router = useRouter();
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const token = window.location.hash.slice(1);
        window.history.replaceState(null, "", "/support");
        if (token) {
          if (!/^[a-f0-9]{64}$/.test(token)) throw new Error("Invalid setup link");
          const redeemed = await fetch("/api/support/redeem", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          const result = await redeemed.json();
          if (!redeemed.ok) throw new Error(result.error || "Unable to start Setup Mode");
        }
        const response = await fetch("/api/support/workspace", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Setup session unavailable");
        if (live) router.replace("/dashboard");
      } catch (e) { if (live) setError(e.message); }
    })();
    return () => { live = false; };
  }, [router]);
  return <main className="mx-auto max-w-xl p-8" role="status">
    {error ? <p className="text-red-700">{error}</p> : "Opening Restaurant Dashboard…"}
  </main>;
}
