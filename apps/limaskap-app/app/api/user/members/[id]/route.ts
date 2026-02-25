import { updateUserMember } from "@/features/profile/server/service";
import { parseId, toRouteErrorResponse } from "@/lib/server/http";
import { getViewerFromHeaders } from "@/lib/server/session";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const viewer = await getViewerFromHeaders(request.headers);

  const { id: rawId } = await params;
  const id = parseId(rawId);

  if (!id) {
    return Response.json({ message: "Invalid id" }, { status: 422 });
  }

  const body = await request.json().catch(() => null);
  try {
    const updated = await updateUserMember(viewer, id, body);
    return Response.json(updated);
  } catch (error) {
    return toRouteErrorResponse(error);
  }
}
