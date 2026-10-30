import { proxy } from "../../../../../lib/apiRoute";
export async function GET(req) { return proxy(req, "/api/domains/billing", true); }
export async function POST(req) { return proxy(req, "/api/domains/billing", true); }
export async function DELETE(req) { return proxy(req, "/api/domains/billing", true); }

export async function PATCH(req) { return proxy(req, "/api/domains/billing", true); }
