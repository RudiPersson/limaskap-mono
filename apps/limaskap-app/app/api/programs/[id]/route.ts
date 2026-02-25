import {
  deleteProgram,
  getProgramById,
  updateProgram,
} from "@/features/programs/server/service";
import { notFound, parseId, toRouteErrorResponse } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = parseId(rawId);

  if (!id) {
    return Response.json({ message: "Invalid id" }, { status: 422 });
  }

  const program = await getProgramById(id);

  if (!program) {
    return notFound("Program not found");
  }

  return Response.json(program);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = parseId(rawId);

  if (!id) {
    return Response.json({ message: "Invalid id" }, { status: 422 });
  }

  const body = await request.json().catch(() => null);
  try {
    const program = await updateProgram(id, body);
    if (!program) {
      return notFound("Program not found");
    }

    return Response.json(program);
  } catch (error) {
    return toRouteErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = parseId(rawId);

  if (!id) {
    return Response.json({ message: "Invalid id" }, { status: 422 });
  }

  const deleted = await deleteProgram(id);
  if (!deleted) {
    return notFound("Program not found");
  }

  return new Response(null, { status: 204 });
}
