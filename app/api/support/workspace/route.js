import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendUrl } from "../../../../lib/backend";
export async function GET() {
  const token = cookies().get("orderxo_support_session")?.value;
  if (!token) return NextResponse.json({ error: "Support session required" }, { status: 401 });
  try {
    const response = await fetch(backendUrl("/api/support/workspace"), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Support service unavailable" }, { status: 502 });
  }
}
