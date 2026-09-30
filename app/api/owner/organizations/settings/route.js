import { proxy } from "../../../../../lib/apiRoute";

export async function GET(req) {
  return proxy(req, "/api/organizations/settings", true);
}

export async function PATCH(req) {
  return proxy(req, "/api/organizations/settings", true);
}
