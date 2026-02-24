import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { getApiOrganizations } from "@/lib/sdk";

export default async function OrganizationTable() {
  const { data, error } = await getApiOrganizations({
    cache: "no-store",
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
          <CardTitle>Organizations</CardTitle>
          <CardDescription>
            A list of all organizations in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={data} />
        </CardContent>
      </Card>
    </div>
  );
}
