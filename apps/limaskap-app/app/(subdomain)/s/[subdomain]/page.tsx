import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSubdomainData } from "@/lib/subdomains";
import { rootDomain } from "@/lib/utils";

import { Suspense } from "react";
import OrganizationProgramsTable from "@/features/organizations/components/organization-programs-table.tsx";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
  const { subdomain } = await params;
  const subdomainData = await getSubdomainData(subdomain);

  if (!subdomainData) {
    return {
      title: rootDomain,
    };
  }

  return {
    title: `${subdomain}.${rootDomain}`,
    description: `Subdomain page for ${subdomain}.${rootDomain}`,
  };
}

export default async function SubdomainPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;

  const subdomainData = await getSubdomainData(subdomain);

  if (!subdomainData) {
    notFound();
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrganizationProgramsTable subdomain={subdomain} />
    </Suspense>
  );
}
