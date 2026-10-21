import { proxy } from "../../../../../lib/apiRoute";
export async function GET(req) {
  return proxy(req, "/api/kiosk/installations", true);
}
export async function POST(req) {
  return proxy(req, "/api/kiosk/installations", true);
}
export async function DELETE(req) {
  return proxy(req, "/api/kiosk/installations", true);
}
