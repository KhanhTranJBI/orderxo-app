"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AcceptTeam() {
  const q = useSearchParams();
  const router = useRouter();
  const started = useRef(false);
  const [msg, setMsg] = useState("Accepting your invitation…");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const token = q.get("token");
    if (!token) {
      setMsg("Invitation link is missing.");
      return;
    }

    (async () => {
      try {
        const r = await fetch("/api/owner/team/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          cache: "no-store",
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "Unable to accept invitation");
        if (!d.organizationId) throw new Error("Invitation response is missing the restaurant");
        router.replace(`/dashboard/restaurants/${d.organizationId}`);
        router.refresh();
      } catch (e) {
        setMsg(e.message || "Unable to accept invitation");
      }
    })();
  }, [q, router]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-20">
      <div className="mx-auto max-w-lg rounded-2xl border bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold">OrderXO Team Invitation</h1>
        <p className="mt-3 text-slate-600">{msg}</p>
      </div>
    </main>
  );
}
