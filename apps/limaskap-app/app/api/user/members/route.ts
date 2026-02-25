import {
  createUserMember,
  getUserMembers,
} from "@/features/profile/server/service";
import { toRouteErrorResponse } from "@/lib/server/http";
import { getViewerFromHeaders } from "@/lib/server/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const viewer = await getViewerFromHeaders(request.headers);
  try {
    const memberRecords = await getUserMembers(viewer);
    return Response.json(memberRecords);
  } catch (error) {
    return toRouteErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const viewer = await getViewerFromHeaders(request.headers);
  const body = await request.json().catch(() => null);
  try {
    const created = await createUserMember(viewer, body);
    return Response.json(created, { status: 201 });
  } catch (error) {
    return toRouteErrorResponse(error);
  }
}
