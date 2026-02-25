import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrganizationProgramBySubdomain } from "@/features/organizations/server/service";
import ProgramDetail from "@/features/programs/components/program-detail";
import { parseId } from "@/lib/server/http";
import { getServerViewer } from "@/lib/server/session";
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
  const programId = parseId(id);
  if (!programId) {
    return {
      title: "Program Not Found",
    };
  }

  const program = await getOrganizationProgramBySubdomain(subdomain, programId);

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
  const { subdomain, id } = await params;
  const viewer = await getServerViewer();
  const programId = parseId(id);
  if (!programId) {
    notFound();
  }

  const program = await getOrganizationProgramBySubdomain(subdomain, programId);
  if (!program) {
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
              {!viewer ? (
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
