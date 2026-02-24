import OrganizationTable from "@/features/organizations/components/organization-table.tsx";
import OrganizationTableSkeleton from "@/features/organizations/components/skeletons/organization-table-skeleton";
import { Suspense } from "react";

export default async function HomePage() {
  return (
    <div className="container mx-auto">
      <Suspense fallback={<OrganizationTableSkeleton />}>
        <OrganizationTable />
      </Suspense>
    </div>
  );
}
