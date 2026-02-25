import { getOrganizationProgramsBySubdomain } from "@/features/organizations/server/service";

export async function getSubdomainData(subdomain: string) {
  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "");
  return getOrganizationProgramsBySubdomain(sanitizedSubdomain);
}
