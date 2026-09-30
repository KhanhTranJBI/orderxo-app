import { cookies } from "next/headers";
export const cookieName = "orderxo_owner_session";
export function backendUrl(path) {
  const base = process.env.ORDERXO_ADMIN_API_URL;
  if (!base) throw new Error("ORDERXO_ADMIN_API_URL is not configured");
  return `${base.replace(/\/$/, "")}${path}`;
}
export async function backendRequest(path, { method = "GET", body, authenticated = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (authenticated) {
    const token = cookies().get(cookieName)?.value;
    if (!token) return { status: 401, data: { error: "Please sign in" } };
    headers.Authorization = `Bearer ${token}`;
  }
  try {
    const res = await fetch(backendUrl(path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json().catch(() => ({ error: "Invalid backend response" }));
    return { status: res.status, data };
  } catch {
    return { status: 502, data: { error: "Admin API unavailable" } };
  }
}
