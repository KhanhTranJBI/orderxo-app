"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
export default function SupportLanding() {
  const [info, setInfo] = useState(null),
    [error, setError] = useState("");
  const router = useRouter();
  useEffect(() => {
    const token = location.hash.slice(1);
    history.replaceState(null, "", location.pathname);
    if (!/^[a-f0-9]{64}$/.test(token)) {
      setError("Invalid or missing access link");
      return;
    }
    fetch("/api/support/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error || "Unable to open session");
        setInfo(d);
      })
      .catch((e) => setError(e.message));
  }, []);
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold">OrderXO Staff Access</h1>
      {error && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}
      {!info && !error && <p className="mt-4">Validating your one-time link…</p>}
      {info && (
        <div className="mt-6 space-y-4 rounded-xl border p-6">
          <p className="font-bold">
            {info.organization?.name} · {info.mode === "setup" ? "Setup Mode" : "Support Mode"}
          </p>
          <p>
            This session is limited to {info.permissions.join(", ")} and expires at{" "}
            {new Date(info.expiresAt).toLocaleString()}.
          </p>
          <p className="text-amber-700">
            This initial access is read-only. Restaurant editing requires scoped server-side
            authorization and is not enabled in this build.
          </p>
          <button
            className="rounded bg-slate-900 px-4 py-2 text-white"
            onClick={async () => {
              await fetch("/api/support/end", { method: "POST" });
              router.replace("/login");
            }}
          >
            End Support Session
          </button>
        </div>
      )}
    </main>
  );
}
