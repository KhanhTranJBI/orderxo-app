import { NextResponse } from "next/server";
import { cookieName } from "../../../../lib/backend";
export async function POST() { const res = NextResponse.json({ success: true }); res.cookies.set(cookieName, "", { httpOnly: true, path: "/", maxAge: 0, sameSite: "lax" }); return res; }
