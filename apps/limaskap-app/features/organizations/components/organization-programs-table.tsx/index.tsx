import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { getApiOrganizationsSubdomainBySubdomain } from "@/lib/sdk";

export default async function OrganizationProgramsTable({
  subdomain,
}: {
  subdomain: string;
}) {
  const { data, error } = await getApiOrganizationsSubdomainBySubdomain({
    cache: "no-store",
    path: {
      subdomain,
    },
  });

  if (!data) {
    return <div>No data</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
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
