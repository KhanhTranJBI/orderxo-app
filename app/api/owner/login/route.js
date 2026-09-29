import { NextResponse } from "next/server";
import { backendRequest, cookieName } from "../../../../lib/backend";
export async function POST(req) {
 const body = await req.json().catch(() => ({}));
 const { status, data } = await backendRequest("/api/auth/login", { method: "POST", body });
 if (status !== 200 || !data.token) return NextResponse.json(data, { status });
 const response = NextResponse.json({ success: true, user: data.user }, { headers: { "Cache-Control": "no-store" } });
 response.cookies.set(cookieName, data.token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: Math.min(data.expiresIn || 43200, 43200) });
 return response;
}
