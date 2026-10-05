import { proxy } from "../../../../lib/apiRoute";
export async function PATCH(req) {
  return proxy(req, "/api/domains", true);
}
