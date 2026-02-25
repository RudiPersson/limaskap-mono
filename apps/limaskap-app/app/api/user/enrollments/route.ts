import { getUserEnrollments } from "@/features/profile/server/service";
import { toRouteErrorResponse } from "@/lib/server/http";
import { getViewerFromHeaders } from "@/lib/server/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const viewer = await getViewerFromHeaders(request.headers);
  try {
    const enrollments = await getUserEnrollments(viewer);
    return Response.json(enrollments);
  } catch (error) {
    return toRouteErrorResponse(error);
  }
}
