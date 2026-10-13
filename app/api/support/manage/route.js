import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendUrl } from "../../../../lib/backend";
async function proxy(request, method) {
  const token = cookies().get("orderxo_support_session")?.value;
  if (!token) return NextResponse.json({ error: "Support session required" }, { status: 401 });
  const url = new URL(request.url);
  const query = method === "GET" ? `?${url.searchParams.toString()}` : "";
  try {
    const response = await fetch(backendUrl(`/api/support/manage${query}`), {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(method === "PATCH" ? { "Content-Type": "application/json" } : {}),
      },
      ...(method === "PATCH" ? { body: await request.text() } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json();
    return NextResponse.json(data, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Support service unavailable" }, { status: 502 });
  }
}
export async function GET(request) {
  return proxy(request, "GET");
}
export async function PATCH(request) {
  return proxy(request, "PATCH");
}
