import { cookies } from "next/headers";
import { backendUrl, cookieName } from "../../../../../lib/backend";
export async function GET(req) {
  const token = cookies().get(cookieName)?.value;
  if (!token) return Response.json({ error: "Please sign in" }, { status: 401 });
  const u = new URL(req.url),
    organizationId = u.searchParams.get("organizationId"),
    locationId = u.searchParams.get("locationId"),
    month = u.searchParams.get("month");
  if (!organizationId || !locationId || !month)
    return Response.json(
      { error: "organizationId, locationId and month are required" },
      { status: 400 },
    );
  const qs = new URLSearchParams({ organizationId, locationId, month });
  try {
    const r = await fetch(backendUrl(`/api/admin/financials/statements/download?${qs}`), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      return Response.json(d, { status: r.status });
    }
    const body = await r.arrayBuffer();
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          r.headers.get("content-disposition") || `attachment; filename="Statement-${month}.pdf"`,
      },
    });
  } catch {
    return Response.json({ error: "Admin API unavailable" }, { status: 502 });
  }
}
