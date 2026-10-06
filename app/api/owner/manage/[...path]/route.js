import { NextResponse } from "next/server";
import { backendRequest } from "../../../../../lib/backend";

async function handle(req, { params }) {
  const url = new URL(req.url);
  const organizationId = url.searchParams.get("organizationId");
  if (!organizationId)
    return NextResponse.json({ error: "organizationId is required" }, { status: 400 });

  // The browser only talks to this owner-session proxy. The backend endpoints
  // themselves are tenant-safe and live at /api/menu, /api/categories, etc.
  const path = `/api/${params.path.join("/")}`;
  const body = req.method === "GET" ? undefined : await req.json().catch(() => ({}));
  const query = url.searchParams;
  query.set("organizationId", organizationId);
  if (body && typeof body === "object") body.organizationId = organizationId;

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const result = await backendRequest(`${path}${suffix}`, {
    method: req.method,
    body,
    authenticated: true,
  });
  return NextResponse.json(result.data, {
    status: result.status,
    headers: { "Cache-Control": "no-store" },
  });
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
