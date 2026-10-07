"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
export default function AcceptTeam() {
  const q = useSearchParams(),
    router = useRouter(),
    [msg, setMsg] = useState("Accepting your invitation…");
  useEffect(() => {
    const token = q.get("token");
    if (!token) {
      setMsg("Invitation link is missing.");
      return;
    }
    fetch("/api/owner/team/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (r) => ({ ok: r.ok, d: await r.json() }))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || "Unable to accept invitation");
        router.replace(`/dashboard/restaurants/${d.organizationId}`);
      })
      .catch((e) => setMsg(e.message));
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
