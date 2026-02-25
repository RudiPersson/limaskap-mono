import {
  createEnrollmentWithCheckout,
  listEnrollments,
} from "@/features/enrollments/server/service";
import { toRouteErrorResponse } from "@/lib/server/http";
import { getViewerFromHeaders } from "@/lib/server/session";

export const runtime = "nodejs";

export async function GET() {
  const enrollments = await listEnrollments();
  return Response.json(enrollments);
}

export async function POST(request: Request) {
  const viewer = await getViewerFromHeaders(request.headers);
  const body = await request.json().catch(() => null);
  try {
    const checkout = await createEnrollmentWithCheckout(viewer, body);
    return Response.json(checkout, { status: 201 });
  } catch (error) {
    return toRouteErrorResponse(error);
  }
}
