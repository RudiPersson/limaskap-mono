import { getOrganizationProgramsBySubdomain } from "@/features/organizations/server/service";
import { notFound } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params;

  const organization = await getOrganizationProgramsBySubdomain(subdomain);
  if (!organization) {
    return notFound();
  }

  return Response.json(organization);
}
