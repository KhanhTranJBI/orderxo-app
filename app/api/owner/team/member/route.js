import { proxy } from "../../../../../lib/apiRoute";
export async function PATCH(req) {
  return proxy(req, "/api/team/member", true);
}
export async function PUT(req) {
  return proxy(req, "/api/team/member", true);
}
