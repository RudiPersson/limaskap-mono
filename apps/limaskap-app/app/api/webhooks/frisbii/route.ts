import { processFrisbiiWebhook } from "@/features/webhooks/server/service";
import { toRouteErrorResponse } from "@/lib/server/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  try {
    await processFrisbiiWebhook(body);
    return Response.json({ message: "ok" });
  } catch (error) {
    return toRouteErrorResponse(error);
  }
}
