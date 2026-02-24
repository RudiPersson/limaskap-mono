import { getApiOrganizationsSubdomainBySubdomain } from "@/lib/sdk";

export async function getSubdomainData(subdomain: string) {
  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "");

  const { data } = await getApiOrganizationsSubdomainBySubdomain({
    path: {
      subdomain: sanitizedSubdomain,
    },
  });

  return data;
}
