import { createChargeSession } from "@/features/payments/server/service";
import { toRouteErrorResponse } from "@/lib/server/http";
import { getViewerFromHeaders } from "@/lib/server/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const viewer = await getViewerFromHeaders(request.headers);
  const body = await request.json().catch(() => null);
  try {
    const sessionResponse = await createChargeSession(viewer, body);
    return Response.json(sessionResponse);
  } catch (error) {
    return toRouteErrorResponse(error);
  }
}
