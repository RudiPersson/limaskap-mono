import { getOrganizationById } from "@/features/organizations/server/service";
import { notFound, parseId } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = parseId(rawId);

  if (!id) {
    return Response.json({ message: "Invalid id" }, { status: 422 });
  }

  const organization = await getOrganizationById(id);

  if (!organization) {
    return notFound();
  }

  return Response.json(organization);
}
