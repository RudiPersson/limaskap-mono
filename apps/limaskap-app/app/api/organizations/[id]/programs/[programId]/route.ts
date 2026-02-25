import { getOrganizationProgramBySubdomain } from "@/features/organizations/server/service";
import { notFound, parseId } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; programId: string }> },
) {
  const { id, programId: rawProgramId } = await params;
  const subdomain = id;
  const programId = parseId(rawProgramId);

  if (!programId) {
    return Response.json({ message: "Invalid programId" }, { status: 422 });
  }

  const program = await getOrganizationProgramBySubdomain(subdomain, programId);
  if (!program) {
    return notFound("Organization or program not found");
  }

  return Response.json(program);
}
