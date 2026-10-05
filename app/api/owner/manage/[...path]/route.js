import { NextResponse } from "next/server";
import { backendRequest } from "../../../../../lib/backend";

async function handle(req, { params }) {
  const organizationId = new URL(req.url).searchParams.get("organizationId");
  if (!organizationId)
    return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
  const path = `/api/owner/${params.path.join("/")}`;
  const body = req.method === "GET" ? undefined : await req.json().catch(() => ({}));
  const query = new URL(req.url).searchParams;
  query.delete("organizationId");
  query.set("organizationId", organizationId);
  const result = await backendRequest(`${path}?${query.toString()}`, {
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
