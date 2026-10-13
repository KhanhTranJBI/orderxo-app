import { NextResponse } from "next/server";
import { backendRequest } from "../../../../lib/backend";
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { status, data } = await backendRequest("/api/support/redeem", { method: "POST", body });
  if (status !== 200) return NextResponse.json(data, { status });
  const response = NextResponse.json({
    success: true,
    organization: data.organization,
    mode: data.mode,
    permissions: data.permissions,
    expiresAt: data.expiresAt,
  });
  response.cookies.set("orderxo_support_session", body.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 1800,
  });
  return response;
}
