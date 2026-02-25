import { createProgram, listPrograms } from "@/features/programs/server/service";
import { toRouteErrorResponse } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET() {
  const programs = await listPrograms();
  return Response.json(programs);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  try {
    const inserted = await createProgram(body);
    return Response.json(inserted);
  } catch (error) {
    return toRouteErrorResponse(error);
  }
}
