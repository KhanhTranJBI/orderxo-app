import { proxy } from "../../../../lib/apiRoute";
export async function POST(req) {
  return proxy(req, "/api/auth/resend-verification", false);
}
