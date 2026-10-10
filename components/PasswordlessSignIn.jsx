"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function PasswordlessSignIn() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const safeNext =
    next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/dashboard";
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/owner/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, next: safeNext }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Unable to send sign-in link");
      setSent(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const googleButton = (
    <button
      type="button"
      onClick={() =>
        signIn("google", {
          callbackUrl: `/auth/google-complete?next=${encodeURIComponent(safeNext)}`,
        })
      }
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50"
    >
      Continue with Google
    </button>
  );

  return sent ? (
    <div className="space-y-4">
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-900">
        <h2 className="font-semibold">Check your email</h2>
        <p className="mt-1 text-sm">
          If an OrderXO owner account exists for <strong>{email}</strong>, we sent a secure one-time
          sign-in link.
        </p>
      </div>
      <button onClick={() => setSent(false)} className="text-sm font-semibold text-orange-700">
        Use a different email
      </button>
    </div>
  ) : (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">
        Email
        <input
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-orange-500"
          placeholder="you@restaurant.com"
        />
      </label>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        disabled={busy}
        className="w-full rounded-xl bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Sending…" : "Email me a sign-in link"}
      </button>
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        OR
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      {googleButton}
      <p className="text-center text-xs text-slate-500">
        No password required. The sign-in link is one-time and expires shortly.
      </p>
    </form>
  );
}
