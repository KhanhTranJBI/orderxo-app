import { proxy } from "../../../../lib/apiRoute";
export async function GET(req) {
  return proxy(req, "/api/locations", true);
}
export async function POST(req) {
  return proxy(req, "/api/locations", true);
}
