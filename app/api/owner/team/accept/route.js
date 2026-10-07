import { NextResponse } from "next/server";
import { backendRequest, cookieName } from "../../../../../lib/backend";
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { status, data } = await backendRequest("/api/team/accept", { method: "POST", body });
  if (status !== 200 || !data.token) return NextResponse.json(data, { status });
  const r = NextResponse.json({ success: true, organizationId: data.organizationId });
  r.cookies.set(cookieName, data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 43200,
  });
  return r;
}
