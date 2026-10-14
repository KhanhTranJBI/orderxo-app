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
    const ownerToken = cookies().get(cookieName)?.value;
    const staffToken = cookies().get("orderxo_support_session")?.value;
    if (ownerToken) headers.Authorization = `Bearer ${ownerToken}`;
    else if (staffToken) {
      // All staff requests are checked again by the backend's scoped policy.
      // Only the explicitly audited Manager endpoints may receive this token.
      const parsed = new URL(path, "http://localhost");
      if (method === "GET" && /^\/api\/(organizations|locations)$/.test(parsed.pathname)) {
        path = `/api/support/manager?area=${parsed.pathname.endsWith("organizations") ? "organizations" : "locations"}`;
      } else if (
        !/^\/api\/(admin\/menu(?:\/|$)|menu(?:\/|$)|categories(?:\/|$)|modifier-groups(?:\/|$)|organizations\/settings$|locations\/settings$)/.test(
          parsed.pathname,
        )
      ) {
        return { status: 403, data: { error: "Staff access is not enabled for this API" } };
      }
      headers.Authorization = `Bearer ${staffToken}`;
    } else return { status: 401, data: { error: "Please sign in" } };
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
