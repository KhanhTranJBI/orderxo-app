import { proxy } from "../../../../../lib/apiRoute";
export async function GET(req) {
  return proxy(req, "/api/subscriptions/current", true);
}
