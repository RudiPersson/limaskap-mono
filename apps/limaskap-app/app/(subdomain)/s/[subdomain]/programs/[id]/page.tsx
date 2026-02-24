import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getApiOrganizationsBySubdomainProgramsByProgramId } from "@/lib/sdk";
import { headers } from "next/headers";
import ProgramDetail from "@/features/programs/components/program-detail";
import { authClient } from "@/lib/auth-client";
import { protocol, rootDomain } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EnrollMember from "@/features/programs/components/enroll-member";
import { Button } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string; id: string }>;
}): Promise<Metadata> {
  const { subdomain, id } = await params;

  const { data: program } =
    await getApiOrganizationsBySubdomainProgramsByProgramId({
      path: { subdomain, programId: id },
      headers: await headers(),
    });

  if (!program) {
    return {
      title: "Program Not Found",
    };
  }

  return {
    title: `${program.name} - ${subdomain}`,
    description: program.description || `Program details for ${program.name}`,
  };
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ subdomain: string; id: string }>;
}) {
  const { data: session, error: sessionError } = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  const { subdomain, id } = await params;

  const { data: program, error } =
    await getApiOrganizationsBySubdomainProgramsByProgramId({
      path: { subdomain, programId: id },
      headers: await headers(),
    });

  if (sessionError) {
    return <div>Error: {sessionError.message}</div>;
  }

  if (error || !program) {
    notFound();
  }

  return (
    <>
      <ProgramDetail program={program} subdomain={subdomain} />

      <div className="container mx-auto ">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tilmelding</CardTitle>
            </CardHeader>
            <CardContent>
              {!session ? (
                <div className="space-y-4">
                  <p>
                    Tú mást vera innritað/ur fyri at kunna melda limir til hetta
                    skeiðið. Sign in to continue.
                  </p>
                  <Button asChild>
                    <Link
                      href={`${protocol}://${rootDomain}/sign-in?callbackUrl=${encodeURIComponent(
                        `${protocol}://${subdomain}.${rootDomain}/programs/${id}`
                      )}`}
                    >
                      Rita inn
                    </Link>
                  </Button>
                </div>
              ) : (
                <EnrollMember programId={program.id} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
