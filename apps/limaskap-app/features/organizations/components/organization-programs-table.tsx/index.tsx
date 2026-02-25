import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOrganizationProgramsBySubdomain } from "@/features/organizations/server/service";
import { columns } from "./columns";
import { DataTable } from "./data-table";

export default async function OrganizationProgramsTable({
  subdomain,
}: {
  subdomain: string;
}) {
  const data = await getOrganizationProgramsBySubdomain(subdomain);
  if (!data) {
    return <div>No data</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>{data.name}</CardTitle>
          <CardDescription>{data.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={data.programs} />
        </CardContent>
      </Card>
    </div>
  );
}
