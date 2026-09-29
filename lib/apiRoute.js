import { NextResponse } from "next/server";
import { backendRequest } from "./backend";
export async function proxy(req, path, authenticated = false) {
 const body = req.method === "GET" ? undefined : await req.json().catch(() => ({}));
 const query = new URL(req.url).search;
 const { status, data } = await backendRequest(`${path}${query}`, { method: req.method, body, authenticated });
 return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
