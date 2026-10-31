import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendUrl } from "../../../../lib/backend";
export async function POST() {
  const token = cookies().get("orderxo_support_session")?.value;
  if (token) {
    try {
      await fetch(backendUrl("/api/support/end"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
    } catch {}
  }
  const response = NextResponse.json({ success: true });
  response.cookies.set("orderxo_support_session", "", { httpOnly: true, path: "/", maxAge: 0 });
  response.cookies.set("orderxo_staff_ui", "", { path: "/", maxAge: 0 });
  return response;
}
