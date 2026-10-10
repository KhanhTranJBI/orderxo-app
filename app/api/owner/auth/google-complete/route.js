import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { cookieName } from "../../../../../lib/backend";
export async function POST(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.ownerToken)
    return NextResponse.json({ error: "Google sign-in is not authorized" }, { status: 401 });
  const response = NextResponse.json({ success: true });
  response.cookies.set(cookieName, token.ownerToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 43200,
  });
  return response;
}
