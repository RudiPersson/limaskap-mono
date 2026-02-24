"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { GetApiOrganizationsSubdomainBySubdomainResponse } from "@/lib/sdk";
import { formatPrice } from "@/lib/utils";

const ClickableProgramName = ({
  program,
}: {
  program: GetApiOrganizationsSubdomainBySubdomainResponse["programs"][0];
}) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/programs/${program.id}`);
  };

  return (
    <button
      onClick={handleClick}
      className="text-left hover:underline cursor-pointer text-blue-600 hover:text-blue-800"
    >
      {program.name}
    </button>
  );
};

export const columns: ColumnDef<
  GetApiOrganizationsSubdomainBySubdomainResponse["programs"][0]
>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <ClickableProgramName program={row.original} />,
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "maxParticipants",
    header: "Max Participants",
  },
  {
    accessorKey: "enrollmentCount",
    header: "Enrollment Count",
  },
  {
    accessorKey: "price",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("price"));
      const formatted = formatPrice(amount);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
];
