import { proxy } from "../../../../../lib/apiRoute";
export async function GET(req) {
  return proxy(req, "/api/onboarding/go-live", true);
}
export async function POST(req) {
  return proxy(req, "/api/onboarding/go-live", true);
}
