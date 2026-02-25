import { openApiDocument } from "@/lib/server/openapi";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(openApiDocument);
}
